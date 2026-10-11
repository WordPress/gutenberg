import { getInlineStyles } from './style';
import {
	getBackgroundImageClasses,
	setBackgroundStyleDefaults,
} from './background';

// This utility is intended to assist where the serialization of the background
// block support is being skipped for a block but the background related CSS
// classes & styles still need to be generated so they can be applied to inner
// elements.

/**
 * Provides the CSS class names and inline styles for a block's background
 * support attributes.
 *
 * @param {Object} attributes Block attributes.
 * @return {Object} Background block support derived CSS classes & styles.
 */
export function getBackgroundClassesAndStyles( attributes ) {
	const { style } = attributes;
	const backgroundStyles = style?.background || {};

	// Mirrors gutenberg_render_background_support() in lib/block-supports/background.php.
	const className =
		'text' !== backgroundStyles.backgroundClip
			? getBackgroundImageClasses( style )
			: '';

	return {
		className: className || undefined,
		style: getInlineStyles( {
			background: {
				...backgroundStyles,
				...setBackgroundStyleDefaults( backgroundStyles ),
			},
		} ),
	};
}

/**
 * Derives the background related props for a block from its background block
 * support attributes.
 *
 * Prefer this in edit components so editor settings can be resolved later
 * without a new API.
 *
 * @param {Object} attributes Block attributes.
 *
 * @return {Object} ClassName & style props from background block support.
 */
export function useBackgroundProps( attributes ) {
	return getBackgroundClassesAndStyles( attributes );
}
