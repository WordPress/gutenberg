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
 * Returns a new object with only the properties specified in `properties`.
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

		let processedStyleVariations = variations.map( ( variation ) => ( {
			...filterObjectByProperty( variation, property ),
			// Add variation title and description to every variation item.
			title: variation?.title,
			description: variation?.description,
		} ) );

		if (
			typeof baseVariation === 'object' &&
			Object.keys( baseVariation ).length > 0
		) {
			/*
			 * Overwrites all baseVariation object `styleProperty` properties
			 * with the theme variation `styleProperty` properties.
			 */
			const clonedBaseVariation = cloneDeep( baseVariation );
			processedStyleVariations = processedStyleVariations.map(
				( variation ) =>
					mergeBaseAndUserConfigs( clonedBaseVariation, variation )
			);
		}

		if ( 'function' === typeof filter ) {
			processedStyleVariations =
				processedStyleVariations.filter( filter );
		}

		return processedStyleVariations;
	}, [ variations, property, baseVariation, filter ] );
}
