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
 * Returns a new object with only the properties specified in `properties`.
 *
 * @param {Object}   props                 Object of hook args.
 * @param {Object[]} props.styleVariations The theme style variations to filter.
 * @param {string}   props.styleProperty   The property to filter by.
 * @param {Function} props.filter          Optional. The filter function to apply to the variations.
 * @param {Object}   props.baseVariation   Optional. Base or user settings to be updated with variation properties.
 * @return {Object[]} The merged object.
 */
export default function useThemeStyleVariationsByProperty( {
	styleVariations,
	styleProperty,
	filter,
	baseVariation,
} ) {
	return useMemo( () => {
		if ( ! styleProperty || styleVariations?.length === 0 ) {
			return styleVariations;
		}

		let processedStyleVariations = styleVariations.map( ( variation ) => ( {
			...filterObjectByProperty( variation, styleProperty ),
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
	}, [ styleVariations, styleProperty, baseVariation, filter ] );
}
