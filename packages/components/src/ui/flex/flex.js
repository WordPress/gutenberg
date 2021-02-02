/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useFlex } from './use-flex';

/**
 * `Flex` is a primitive layout component that adaptively aligns child content horizontally or vertically. `Flex` powers components like `HStack` and `VStack`.
 *
 * `Flex` is used with any of it's two sub-components, `FlexItem` and `FlexBlock`.
 *
 *
 * @example
 * ```jsx
 * import { Flex, FlexItem, FlexBlock, Text, View } from `@wordpress/components`
 *
 * function Example() {
 *   return (
 *     <Flex>
 *       <FlexItem>
 *         <View css={[ui.background.blue]}>
 *           <Text>Ana</Text>
 *         </View>
 *       </FlexItem>
 *       <FlexBlock>
 *         <View css={[ui.background.blue]}>
 *           <Text>Elsa</Text>
 *         </View>
 *       </FlexBlock>
 *     </Flex>
 *   );
 * }
 * ```
 */
const Flex = createComponent( {
	as: 'div',
	useHook: useFlex,
	name: 'Flex',
} );

export default Flex;
