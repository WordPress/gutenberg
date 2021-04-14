/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useFlex } from './use-flex';

/**
 * `Flex` is a primitive layout component that adaptively aligns child content
 * horizontally or vertically. `Flex` powers components like `HStack` and
 * `VStack`.
 *
 * `Flex` is used with any of it's two sub-components, `FlexItem` and `FlexBlock`.
 *
 * @example
 * ```jsx
 * import { Flex, FlexItem, FlexBlock, Text } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<Flex>
 * 			<FlexItem>
 * 				<Text>Code</Text>
 * 			</FlexItem>
 * 			<FlexBlock>
 * 				<Text>Poetry</Text>
 * 			</FlexBlock>
 * 		</Flex>
 * 	);
 * }
 * ```
 */
const Flex = createComponent( {
	as: 'div',
	useHook: useFlex,
	name: 'Flex',
} );

export default Flex;
