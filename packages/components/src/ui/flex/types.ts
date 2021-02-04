import { CSSProperties } from 'react';
import { ResponsiveCSSValue } from '../utils/types';

export type FlexDirection = ResponsiveCSSValue< CSSProperties[ 'flexDirection' ] >;

export type FlexProps = {
	/**
	 * Aligns children using CSS Flexbox `align-items`. Vertically aligns content if the `direction` is `row`, or horizontally aligns content if the `direction` is `column`.
	 *
	 * In the example below, `flex-start` will align the children content to the top.
	 *
	 * @default 'center'
	 *
	 * @example
	 * ```jsx
	 * import { Flex, Text, View } from `@wordpress/components/ui`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <Flex align="flex-start">
	 *       <View css={[ui.background.blue, { height: 100 }]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *     </Flex>
	 *   )
	 * }
	 * ```
	 */
	align?: CSSProperties[ 'alignItems' ];
	/**
	 * @default false
	 */
	alignItems?: boolean;
	/**
	 * The direction flow of the children content can be adjusted with `direction`. `column` will align children vertically and `row` will align children horizontally.
	 *
	 * @default 'row'
	 *
	 * @example
	 * ```jsx
	 * import { Flex, Text, View } from `@wordpress/components/ui`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <Flex direction="column">
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *     </Flex>
	 *   )
	 * }
	 * ```
	 */
	direction?: FlexDirection;
	/**
	 * Expands to the maximum available width (if horizontal) or height (if vertical).
	 *
	 * @default true
	 *
	 * @example
	 * ```jsx
	 * import { Flex, Text, View } from `@wordpress/components/ui`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <Flex direction="row" expanded>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *     </Flex>
	 *   )
	 * }
	 * ```
	 */
	expanded?: boolean;
	/**
	 * Spacing in between each child can be adjusted by using `gap`. The value of `gap` works as a multiplier to the library's grid system (base of `4px`).
	 *
	 * @default 2
	 *
	 * @example
	 * ```jsx
	 * import { Flex, Text, View } from `@wordpress/components/ui`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 * 	return (
	 * 		<Flex justify="flex-start" gap={8}>
	 * 			<View css={[ui.background.blue]}>
	 * 				<Text>Ana</Text>
	 * 			</View>
	 * 			<View css={[ui.background.blue]}>
	 * 				<Text>Elsa</Text>
	 * 			</View>
	 * 		</Flex>
	 * 	)
	 * }
	 * ```
	 */
	gap?: number;
	/**
	 * Horizontally aligns content if the `direction` is `row`, or vertically aligns content if the `direction` is `column`.
	 * In the example below, `flex-start` will align the children content to the left.
	 *
	 * @default 'space-between'
	 *
	 * @example
	 * ```jsx
	 * import { Flex, Text, View } from `@wordpress/components/ui`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <Flex justify="flex-start">
	 *       <View css={[ui.background.blue, { height: 100 }]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *     </Flex>
	 *   )
	 * }
	 * ```
	 */
	justify?: CSSProperties[ 'justifyContent' ];
	/**
	 * @default false
	 */
	justifyContent?: boolean;
	/**
	 * Determines if children should wrap.
	 *
	 * @default false
	 *
	 * @example
	 * ```jsx
	 * import { Flex, Text, View } from `@wordpress/components/ui`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <Flex justify="flex-start" wrap>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>Olaf</Text>
	 *       </View>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>Kristoff</Text>
	 *       </View>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>Queen Iduna</Text>
	 *       </View>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>King Agnarr</Text>
	 *       </View>
	 *       <View css={[ui.background.blue, { width: 200 }]}>
	 *         <Text>Yelena</Text>
	 *       </View>
	 *     </Flex>
	 *   )
	 * }
	 * ```
	 */
	wrap?: boolean;
};

export type FlexItemProps = {
	/**
	 * The (CSS) display of the `FlexItem`.
	 */
	display?: CSSProperties[ 'display' ];
	/**
	 * Determines if `FlexItem` should render as an adaptive full-width block.
	 *
	 * @default true
	 */
	isBlock?: boolean;
};

export type FlexBlockProps = Omit< FlexItemProps, 'isBlock' >;