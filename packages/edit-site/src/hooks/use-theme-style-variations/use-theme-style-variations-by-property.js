/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from '../../components/global-styles/global-styles-provider';
import cloneDeep from '../../utils/clone-deep';

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

		let processedStyleVariations = variations.map( ( variation ) => {
			let result = {
				...filterObjectByProperty( variation, property ),
				title: variation?.title,
				description: variation?.description,
			};

			if ( clonedBaseVariation ) {
				/*
				 * Overwrites all baseVariation object `styleProperty` properties
				 * with the theme variation `styleProperty` properties.
				 */
				result = mergeBaseAndUserConfigs( clonedBaseVariation, result );
			}
			return result;
		} );

		if ( 'function' === typeof filter ) {
			processedStyleVariations =
				processedStyleVariations.filter( filter );
		}

		return processedStyleVariations;
	}, [ variations, property, baseVariation, filter ] );
}
