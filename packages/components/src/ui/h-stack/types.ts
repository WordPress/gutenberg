import { CSSProperties } from 'react';
import { FlexProps } from '../flex/types';

export type HStackAlignment =
	| 'bottom'
	| 'bottomLeft'
	| 'bottomRight'
	| 'center'
	| 'edge'
	| 'left'
	| 'right'
	| 'stretch'
	| 'top'
	| 'topLeft'
	| 'topRight';

export type AlignmentProps = {
	justify?: CSSProperties[ 'justifyContent' ];
	align?: CSSProperties[ 'alignItems' ];
};

export type Alignments = Record<HStackAlignment, AlignmentProps>;

export type Props = Omit< FlexProps, 'align' | 'gap' > & {
	/**
	 * Determines how the child elements are aligned.
	 *
	 * * `top`: Aligns content to the top.
	 * * `topLeft`: Aligns content to the top/left.
	 * * `topRight`: Aligns content to the top/right.
	 * * `left`: Aligns content to the left.
	 * * `center`: Aligns content to the center.
	 * * `right`: Aligns content to the right.
	 * * `bottom`: Aligns content to the bottom.
	 * * `bottomLeft`: Aligns content to the bottom/left.
	 * * `bottomRight`: Aligns content to the bottom/right.
	 * * `edge`: Aligns content to the edges of the container.
	 * * `stretch`: Stretches content to the edges of the container.
	 *
	 * @default 'edge'
	 *
	 * @example
	 *```jsx
	 * import { HStack, Text, View } from `@wp-g2/components`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <HStack alignment="center">
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Olaf</Text>
	 *       </View>
	 *     </HStack>
	 *   );
	 * }
	 *```
	 */
	alignment?: HStackAlignment | CSSProperties[ 'alignItems' ];
	/**
	 * The amount of space between each child element. Spacing in between each child can be adjusted by using `spacing`.
	 * The value of `spacing` works as a multiplier to the library's grid system (base of `4px`).
	 *
	 * @default 2
	 *
	 * @example
	 * ```jsx
	 * import { HStack, Text, View } from `@wp-g2/components`
	 * import { ui } from `@wp-g2/styles`
	 *
	 * function Example() {
	 *   return (
	 *     <HStack alignment="center" spacing={8}>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Ana</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Elsa</Text>
	 *       </View>
	 *       <View css={[ui.background.blue]}>
	 *         <Text>Olaf</Text>
	 *       </View>
	 *     </HStack>
	 *   );
	 * }
	 *```
	 */
	spacing?: CSSProperties[ 'width' ];
};

/**
 * `HStack` (Horizontal Stack) arranges child elements in a horizontal line.
 *
 * @remarks
 * `HStack` can render anything inside.
 *
 * @example
 * ```jsx
 * import { HStack, Text, View } from `@wp-g2/components`
 * import { ui } from `@wp-g2/styles`
 *
 * function Example() {
 *   return (
 *     <HStack>
 *       <View css={[ui.background.blue]}>
 *         <Text>Ana</Text>
 *       </View>
 *       <View css={[ui.background.blue]}>
 *         <Text>Elsa</Text>
 *       </View>
 *       <View css={[ui.background.blue]}>
 *         <Text>Olaf</Text>
 *       </View>
 *     </HStack>
 *   );
 * }
 * ```
 */
