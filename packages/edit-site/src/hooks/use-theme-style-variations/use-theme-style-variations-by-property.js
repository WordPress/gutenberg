/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useContext, useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import cloneDeep from '../../utils/clone-deep';
import { unlock } from '../../lock-unlock';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

/**
 * Removes all instances of a property from an object.
 *
 * @param {Object} object   The object to remove the property from.
 * @param {string} property The property to remove.
 * @return {Object} The modified object.
 */
export function removePropertyFromObject( object, property ) {
	if ( ! property || typeof property !== 'string' ) {
		return object;
	}

	if (
		typeof object !== 'object' ||
		! object ||
		! Object.keys( object ).length
	) {
		return object;
	}

	for ( const key in object ) {
		if ( key === property ) {
			delete object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			removePropertyFromObject( object[ key ], property );
		}
	}
	return object;
}

/**
 * A convenience wrapper for `useThemeStyleVariationsByProperty()` that fetches the current theme style variations,
 * and user-defined global style/settings object.
 *
 * @param {Object}   props          Object of hook args.
 * @param {string}   props.property The property to filter by.
 * @param {Function} props.filter   Optional. The filter function to apply to the variations.
 * @return {Object[]|*} The merged object.
 */
export function useCurrentMergeThemeStyleVariationsWithUserConfig( {
	property,
	filter,
} ) {
	const { variationsFromTheme } = useSelect( ( select ) => {
		const _variationsFromTheme =
			select(
				coreStore
			).__experimentalGetCurrentThemeGlobalStylesVariations();

		return {
			variationsFromTheme: _variationsFromTheme || [],
		};
	}, [] );
	const { user: baseVariation } = useContext( GlobalStylesContext );

	const variations = useMemo( () => {
		return [
			{
				title: __( 'Default' ),
				settings: {},
				styles: {},
			},
			...variationsFromTheme,
		];
	}, [ variationsFromTheme ] );

	return useThemeStyleVariationsByProperty( {
		variations,
		property,
		filter,
		baseVariation: removePropertyFromObject(
			cloneDeep( baseVariation ),
			property
		),
	} );
}

/**
 * Returns a new object, with properties specified in `property`,
 * maintain the original object tree structure.
 * The function is recursive, so it will perform a deep search for the given property.
 * E.g., the function will return `{ a: { b: { c: { test: 1 } } } }` if the property is `test`.
 *
 * @param {Object} object   The object to filter
 * @param {Object} property The property to filter by
 * @return {Object} The merged object.
 */
export const filterObjectByProperty = ( object, property ) => {
	if ( ! object ) {
		return {};
	}

	const newObject = {};
	Object.keys( object ).forEach( ( key ) => {
		if ( key === property ) {
			newObject[ key ] = object[ key ];
		} else if ( typeof object[ key ] === 'object' ) {
			const newFilter = filterObjectByProperty( object[ key ], property );
			if ( Object.keys( newFilter ).length ) {
				newObject[ key ] = newFilter;
			}
		}
	} );
	return newObject;
};

/**
 * Returns a new object with only the properties specified in `property`.
 * Optional merges the baseVariation object with the variation object.
 * Note: this function will only overwrite the specified property in baseVariation if it exists.
 * The baseVariation will not be otherwise modified. To strip a property from the baseVariation object, use `removePropertyFromObject`.
 * See useCurrentMergeThemeStyleVariationsWithUserConfig for an example of how to use this function.
 *
 * @param {Object}   props               Object of hook args.
 * @param {Object[]} props.variations    The theme style variations to filter.
 * @param {string}   props.property      The property to filter by.
 * @param {Function} props.filter        Optional. The filter function to apply to the variations.
 * @param {Object}   props.baseVariation Optional. Base or user settings to be updated with variation properties.
 * @return {Object[]|*} The merged object.
 */
export default function useThemeStyleVariationsByProperty( {
	variations,
	property,
	filter,
	baseVariation,
} ) {
	return useMemo( () => {
		if ( ! property || ! variations || variations?.length === 0 ) {
			return variations;
		}

		const clonedBaseVariation =
			typeof baseVariation === 'object' &&
			Object.keys( baseVariation ).length > 0
				? cloneDeep( baseVariation )
				: null;

		let processedStyleVariations = variations.reduce(
			( accumulator, variation ) => {
				const variationFilteredByProperty = filterObjectByProperty(
					cloneDeep( variation ),
					property
				);
				// Remove variations that are empty once the property is filtered out.
				if ( Object.keys( variationFilteredByProperty ).length === 0 ) {
					return accumulator;
				}

				let result = {
					...variationFilteredByProperty,
					title: variation?.title,
					description: variation?.description,
				};

				if ( clonedBaseVariation ) {
					/*
					 * Overwrites all baseVariation object `styleProperty` properties
					 * with the theme variation `styleProperty` properties.
					 */
					result = mergeBaseAndUserConfigs(
						clonedBaseVariation,
						result
					);
				}

				// Detect if this is a duplicate variation.
				const isDuplicate = accumulator.some( ( item ) => {
					return (
						JSON.stringify( item.styles ) ===
							JSON.stringify( result?.styles ) &&
						JSON.stringify( item.settings ) ===
							JSON.stringify( result?.settings )
					);
				} );
				if ( isDuplicate ) {
					return accumulator;
				}

				// If the variation is not a duplicate, add it to the accumulator.
				accumulator.push( result );
				return accumulator;
			},
			[] // Initial accumulator value.
		);

		if ( 'function' === typeof filter ) {
			processedStyleVariations =
				processedStyleVariations.filter( filter );
		}

		return processedStyleVariations;
	}, [ variations, property, baseVariation, filter ] );
}

/**
 * Compares a style variation to the same variation filtered by a single property.
 * Returns true if the variation contains only the property specified.
 *
 * @param {Object} variation The variation to compare.
 * @param {string} property  The property to compare.
 * @return {boolean} Whether the variation contains only a single property.
 */
export function isVariationWithSingleProperty( variation, property ) {
	const variationWithProperty = filterObjectByProperty(
		cloneDeep( variation ),
		property
	);

	return (
		JSON.stringify( variationWithProperty?.styles ) ===
			JSON.stringify( variation?.styles ) &&
		JSON.stringify( variationWithProperty?.settings ) ===
			JSON.stringify( variation?.settings )
	);
}
