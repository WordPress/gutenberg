import type { Props as TruncateProps } from '../truncate/use-truncate';
import type { CSSProperties, ReactNode } from 'react';

type TextAdjustLineHeightForInnerControls =
	| boolean
	| 'large'
	| 'medium'
	| 'small'
	| 'xSmall';

export type TextSize =
	| 'body'
	| 'caption'
	| 'footnote'
	| 'largeTitle'
	| 'subheadline'
	| 'title';

type TextVariant = 'muted';

type TextWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

type Highlighted = {
		/**
	 * Letters or words within `Text` can be highlighted using `highlightWords`.
	 *
	 * @example
	 * ```jsx
	 * import { Text } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 *   return (
	 *     <Text highlightWords={["the"]}>
	 *       Where the north wind meets the sea, there's a river full of memory. Sleep,
	 *       my darling, safe and sound, for in this river all is found. In her waters,
	 *       deep and true, lay the answers and a path for you. Dive down deep into her
	 *       sound, but not too far or you'll be drowned
	 *     </Text>
	 *   )
	 * }
	 * ```
	 */
	highlightWords?: string[];
	children: string;
}

type Unhighlighted = {
	highlightWords?: undefined;
	children: ReactNode;
}

export type Props = TruncateProps & (Highlighted | Unhighlighted) & {
	/**
	 * Adjusts the text alignment.
	 *
	 * @example
	 * ```jsx
	 * import { Text } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 * 	return (
	 * 		<Text align="center" isBlock>
	 * 			Where the north wind meets the sea...
	 * 		</Text>
	 * 	)
	 * }
	 *```
	 */
	align?: CSSProperties[ 'textAlign' ];
	/**
	 * Automatically calculate the appropriate line-height value for contents that render text and Control elements (e.g. `TextInput`).
	 *
	 * @example
	 * ```jsx
	 * import { Text, TextInput } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 * 	return (
	 * 		<Text adjustLineHeightForInnerControls>
	 * 			Where the north wind meets the <TextInput value="sea..." />
	 * 		</Text>
	 * 	)
	 * }
	 *```
	 */
	adjustLineHeightForInnerControls?: TextAdjustLineHeightForInnerControls;
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
	 */
	highlightEscape?: boolean;
	/**
	 * Determines if `highlightWords` should be case sensitive.
	 */
	highlightCaseSensitive?: boolean;
	/**
	 * Array of search words. String search terms are automatically cast to RegExps unless `highlightEscape` is true.
	 */
	highlightSanitize?: import( 'highlight-words-core' ).FindAllArgs[ 'sanitize' ];
	/**
	 * Sets `Text` to have `display: block`.
	 */
	isBlock?: boolean;
	/**
	 * Adjusts all text line-height based on the typography system.
	 */
	lineHeight?: CSSProperties[ 'lineHeight' ];
	/**
	 * The `Text` color can be adapted to a background color for optimal readability. `optimizeReadabilityFor` can accept CSS variables, in addition to standard CSS color values (e.g. Hex, RGB, HSL, etc...).
	 *
	 * @example
	 * ```jsx
	 * import { Text, View } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 *   const backgroundColor = "blue"
	 *
	 *   return (
	 *     <View css={{ backgroundColor }}>
	 *       <Text optimizeReadabilityFor={backgroundColor}>
	 *         Where the north wind meets the sea, there's a river full of memory.
	 *       </Text>
	 *     </View>
	 *   )
	 * }
	 * ```
	 */
	optimizeReadabilityFor?: CSSProperties[ 'color' ];
	/**
	 * Adjusts text size based on the typography system. `Text` can render a wide range of font sizes, which are automatically calculated and adapted to the typography system. The `size` value can be a system preset, a `number`, or a custom unit value (`string`) such as `30em`.
	 *
	 * @example
	 * ```jsx
	 * import { Text } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 *   return <Text size="largeTitle">Where the north wind meets the sea...</Text>
	 * }
	 * ```
	 */
	size?: CSSProperties[ 'fontSize' ] | TextSize;
	/**
	 * Enables text truncation. When `truncate` is set,we are able to truncate the long text in a variety of ways.
	 *
	 * @example
	 *
	 * ```jsx
	 * import { Text } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 *   return (
	 *     <Text truncate>
	 *       Where the north wind meets the sea, there's a river full of memory. Sleep,
	 *       my darling, safe and sound, for in this river all is found. In her waters,
	 *       deep and true, lay the answers and a path for you. Dive down deep into her
	 *       sound, but not too far or you'll be drowned
	 *     </Text>
	 *   )
	 * }
	 * ```
	 */
	truncate?: boolean;
	/**
	 * Uppercases the text content.
	 */
	upperCase?: boolean;
	/**
	 * Adjusts style variation of the text.
	 *
	 * @example
	 * ```jsx
	 * import { Text } from `@wordpress/components/ui`
	 *
	 * function Example() {
	 *   return <Text variant="muted">Where the north wind meets the sea...</Text>
	 * }
	 * ```
	 */
	variant?: TextVariant;
	/**
	 * Adjusts font-weight of the text.
	 */
	weight?: CSSProperties[ 'fontWeight' ] | TextWeight;
	/**
	 * Adjusts letter-spacing of the text.
	 */
	letterSpacing?: CSSProperties[ 'letterSpacing' ];
};
