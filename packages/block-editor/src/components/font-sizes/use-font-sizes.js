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

/**
 * A hook that returns an object with font size objects and font size
 * block attribute setters for a given list of font size names.
 * It uses the font size object list from the editor's settings as a palette.
 *
 * @example
 * Calling it with a font size name `"paragraphFontSize"` will return an object
 * with a font size object `paragraphFontSize`, and a function `setParagraphFontSize`.
 * `setParagraphFontSize` can be called with any font size value. If the value
 * equals the `size` property of an object in the `fontSizes` list from the editor's settings,
 * `paragraphFontSize` will be set to that object merged with a custom
 * `class` property. If it's not, it will be set to a custom object
 * with just a `size` property set to the value.
 *
 * ```jsx
 * // const FONT_SIZES = [
 * // 	{
 * // 		name: 'Small',
 * // 		size: 13,
 * // 		slug: 'small',
 * // 	},
 * // 	// ...
 * // ];
 * // _.isEqual( FONT_SIZES, select( 'core/block-editor' ).getSettings().fontSizes );
 *
 * const MyFontSizeableComponent = () => {
 * 	const { paragraphFontSize, setParagraphFontSize } = useFontSizes( [
 * 		'paragraphFontSize',
 * 	] );
 *
 * 	// setParagraphFontSize( 13 );
 * 	// _.isEqual(
 * 	// 	{ ...FONT_SIZES[ 0 ], class: 'has-small-font-size' },
 * 	// 	paragraphFontSize
 * 	// );
 * 	// setParagraphFontSize( 14 );
 * 	// _.isEqual( { size: 14 }, paragraphFontSize );
 * };
 * ```
 *
 * @param {string[]} fontSizeNames The list of font size names.
 *
 * @return {Object} The object with font size objects and font size setters.
 */
export default function useFontSizes( fontSizeNames ) {
	const fontSizes = useSelect(
		( select ) => select( 'core/block-editor' ).getSettings().fontSizes || [],
		[]
	);

	return useAttributePicker( {
		names: fontSizeNames,
		valuesEnum: fontSizes,

		findEnumValue: ( fontSizeObject, newFontSizeValue ) =>
			fontSizeObject.size === newFontSizeValue,
		mapEnumValue: ( fontSizeObject ) => fontSizeObject.slug,

		mapAttribute: ( fontSizeSlugOrCustomValue ) => {
			const foundFontSizeObject = fontSizes.find(
				( fontSizeObject ) => fontSizeObject.slug === fontSizeSlugOrCustomValue
			) || { size: fontSizeSlugOrCustomValue };

			return {
				...foundFontSizeObject,
				class:
					foundFontSizeObject.slug &&
					`has-${ kebabCase( foundFontSizeObject.slug ) }-font-size`,
			};
		},
	} );
}
