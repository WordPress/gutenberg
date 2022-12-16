/**
 * WordPress dependencies
 */
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	FONT_STYLE_ITALIC,
	FONT_STYLE_REGULAR,
	FONT_WEIGHT_BOLD,
	FONT_WEIGHT_REGULAR,
} from '../components/font-appearance-control';

/**
 * A hook to infer the bold and italic states from the block style, and
 * functions to toggle them.
 *
 * @param {Object} props               Block props.
 * @param {Object} props.attributes    Block's attributes.
 * @param {Object} props.setAttributes Function to set block's attributes.
 * @return {Object} The isBold and isItalic states, functions to toggle them
 *                  and shortcuts listener.
 */
export function useFontAppearanceStyles( { attributes = {}, setAttributes } ) {
	const typographyStyle = attributes.style?.typography;
	const isBold = typographyStyle?.fontWeight === FONT_WEIGHT_BOLD;
	const isItalic = typographyStyle?.fontStyle === FONT_STYLE_ITALIC;

	function getFontAppearanceStyle( newIsBold, newIsItalic ) {
		if ( ! newIsBold && ! newIsItalic ) {
			return {
				fontWeight: undefined,
				fontStyle: undefined,
			};
		}
		return {
			fontWeight: newIsBold ? FONT_WEIGHT_BOLD : FONT_WEIGHT_REGULAR,
			fontStyle: newIsItalic ? FONT_STYLE_ITALIC : FONT_STYLE_REGULAR,
		};
	}

	function toggleBold() {
		setAttributes( {
			style: {
				typography: {
					...typographyStyle,
					...getFontAppearanceStyle( ! isBold, isItalic ),
				},
			},
		} );
	}

	function toggleItalic() {
		setAttributes( {
			style: {
				typography: {
					...typographyStyle,
					...getFontAppearanceStyle( isBold, ! isItalic ),
				},
			},
		} );
	}

	function onKeyDownToggleFontAppearance( event ) {
		if ( isKeyboardEvent.primary( event, 'b' ) ) {
			toggleBold();
		} else if ( isKeyboardEvent.primary( event, 'i' ) ) {
			toggleItalic();
		}
	}

	return {
		isBold,
		isItalic,
		toggleBold,
		toggleItalic,
		onKeyDownToggleFontAppearance,
	};
}
