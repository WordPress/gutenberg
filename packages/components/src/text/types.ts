/**
 * Internal dependencies
 */
import type { TruncateProps } from '../truncate/types';

/**
 * External dependencies
 */
import type { CSSProperties } from 'react';
import type { FindAllArgs } from 'highlight-words-core';

export type TextSize =
	| 'body'
	| 'caption'
	| 'footnote'
	| 'largeTitle'
	| 'subheadline'
	| 'title';

type TextVariant = 'muted';

type TextWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface Props extends TruncateProps {
	/**
	 * Adjusts the text alignment.
	 */
	align?: CSSProperties[ 'textAlign' ];
	/**
	 * Automatically calculate the appropriate line-height value for contents that render text and Control elements (e.g. `TextInput`).
	 */
	adjustLineHeightForInnerControls?: 'large' | 'medium' | 'small' | 'xSmall';
	/**
	 * Adjusts the text color.
	 */
	color?: CSSProperties[ 'color' ];
	/**
	 * Adjusts the CSS display.
	 */
	display?: CSSProperties[ 'display' ];
	/**
	 * Renders a destructive color.
	 *
	 * @default false
	 */
	isDestructive?: boolean;
	/**
	 * Escape characters in `highlightWords` which are meaningful in regular expressions.
	 *
	 * @default false
	 */
	highlightEscape?: boolean;
	/**
	 * Determines if `highlightWords` should be case sensitive.
	 *
	 * @default false
	 */
	highlightCaseSensitive?: boolean;
	/**
	 * Array of search words. String search terms are automatically cast to RegExps unless `highlightEscape` is true.
	 */
	highlightSanitize?: FindAllArgs[ 'sanitize' ];
	/**
	 * Sets `Text` to have `display: block`. Note: text truncation only works
	 * when `isBlock` is `false`.
	 *
	 * @default false
	 */
	isBlock?: boolean;
	/**
	 * Adjusts all text line-height based on the typography system.
	 */
	lineHeight?: CSSProperties[ 'lineHeight' ];
	/**
	 * The `Text` color can be adapted to a background color for optimal readability. `optimizeReadabilityFor` can accept CSS variables, in addition to standard CSS color values (e.g. Hex, RGB, HSL, etc...).
	 */
	optimizeReadabilityFor?: CSSProperties[ 'color' ];
	/**
	 * Adjusts text size based on the typography system. `Text` can render a wide range of font sizes, which are automatically calculated and adapted to the typography system. The `size` value can be a system preset, a `number`, or a custom unit value (`string`) such as `30em`.
	 */
	size?: CSSProperties[ 'fontSize' ] | TextSize;
	/**
	 * Enables text truncation. When `truncate` is set, we are able to truncate the long text in a variety of ways. Note: text truncation won't work if the `isBlock` property is set to `true`
	 *
	 * @default false
	 */
	truncate?: boolean;
	/**
	 * Uppercases the text content.
	 *
	 * @default false
	 */
	upperCase?: boolean;
	/**
	 * Adjusts style variation of the text.
	 */
	variant?: TextVariant;
	/**
	 * Adjusts font-weight of the text.
	 *
	 * @default 'normal'
	 */
	weight?: CSSProperties[ 'fontWeight' ] | TextWeight;
	/**
	 * Adjusts letter-spacing of the text.
	 */
	letterSpacing?: CSSProperties[ 'letterSpacing' ];
	/**
	 * Letters or words within `Text` can be highlighted using `highlightWords`.
	 */
	highlightWords?: string[];
}
