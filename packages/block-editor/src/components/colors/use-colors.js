/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useAttributePicker } from '../block-edit';
import { getMostReadableColor } from './utils';

/**
 * A hook that returns an object with color objects and color
 * block attribute setters for a given list of color types and
 * a custom color palette.
 *
 * @example
 * Calling it with a color type `"backgroundColor"` will return an object
 * with a color object `backgroundColor`, and a function `setBackgroundColor`.
 * `setBackgroundColor` can be called with any color value. If the value
 * equals the `color` property of an object in the `colorPalette`,
 * `backgroundColor` will be set to that object merged with a custom
 * `class` property. If it's not, it will be set to a custom object
 * with just a `color` property set to the value.
 *
 * ```jsx
 * const CUSTOM_COLORS = [
 * 	{ name: 'Red', slug: 'red', color: '#ff0000' },
 * 	{ name: 'Blue', slug: 'blue', color: '#0000ff' },
 * ];
 *
 * const MyColorfulComponent = () => {
 * 	const { backgroundColor, setBackgroundColor } = useCustomColors(
 * 		[ 'backgroundColor' ],
 * 		CUSTOM_COLORS
 * 	);
 * 	// setBackgroundColor( '#ff0000' );
 * 	// _.isEqual(
 * 	// 	{ ...CUSTOM_COLORS[ 0 ], class: 'has-red-background-color' },
 * 	// 	backgroundColor
 * 	// );
 * 	// setBackgroundColor( '#000000' );
 * 	// _.isEqual( { color: '#000000' }, backgroundColor );
 * 	//...
 * };
 * ```
 *
 * @param {(Object|string)[]} colorTypes The arguments can be strings or objects. If the argument is an object,
 *                                        it should contain the color attribute name as key and the color context as value.
 *                                        If the argument is a string, the value should be the color attribute name,
 *                                        the color context is computed by applying a kebab case transform to the value.
 *                                        Color context represents the context/place where the color is going to be used.
 *                                        The class name of the color is generated using 'has' followed by the color name
 *                                        and ending with the color context all in kebab case e.g: has-green-background-color.
 *
 * @param {Object[]} colorPalette The array of color objects (name, slug, color, etc... ).
 *
 * @return {Object} The object with color objects and color setters.
 */
export function useCustomColors( colorTypes, colorPalette ) {
	const attributePicker = useAttributePicker( {
		names: colorTypes.flatMap( ( colorType ) =>
			typeof colorType === 'string' ? colorType : Object.keys( colorType )
		),
		valuesEnum: colorPalette,

		findEnumValue: ( colorPaletteObject, newColorValue ) =>
			colorPaletteObject.color === newColorValue,
		mapEnumValue: ( colorPaletteObject ) => colorPaletteObject.slug,

		mapAttribute: ( colorSlugOrCustomValue, name ) => {
			const foundColorPaletteObject = colorPalette.find(
				( colorPaletteObject ) => colorPaletteObject.slug === colorSlugOrCustomValue
			) || { color: colorSlugOrCustomValue };

			let colorClass;
			if ( foundColorPaletteObject.slug ) {
				const foundColorType = colorTypes.find( ( colorType ) =>
					typeof colorType === 'string' ?
						colorType === name :
						Object.keys( colorType ).some( ( key ) => key === name )
				);
				const colorContextName =
					typeof foundColorType === 'string' ?
						foundColorType :
						Object.entries( foundColorType ).find( ( entry ) => entry[ 0 ] === name )[ 1 ];

				colorClass = `has-${ kebabCase(
					foundColorPaletteObject.slug
				) }-${ kebabCase( colorContextName ) }`;
			}

			return {
				...foundColorPaletteObject,
				class: colorClass,
			};
		},

		utilsToBind: { getMostReadableColor },
	} );
	attributePicker.colorUtils = attributePicker.utils;
	delete attributePicker.utils;

	return attributePicker;
}

/**
 * Like `useCustomColors`, but uses the color palette from
 * the editor's settings.
 *
 * @see [useCustomColors](/packages/block-editor/README.md#useCustomColors)
 *
 * @example
 * ```jsx
 * const MyColorfulComponent = () => {
 * 	const { backgroundColor, setBackgroundColor } = useColors( [
 * 		'backgroundColor',
 * 	] );
 *
 * 	//...
 * };
 * ```
 *
 * @param {(Object|string)[]} colorTypes The color types passed to `useCustomColors`.
 *
 * @return {Object} The object with color objects and color setters.
 */
export default function useColors( colorTypes ) {
	const colorPalette = useSelect(
		( select ) => select( 'core/block-editor' ).getSettings().colors || [],
		[]
	);

	return useCustomColors( colorTypes, colorPalette );
}
