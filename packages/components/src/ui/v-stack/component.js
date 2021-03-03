/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useVStack } from './hook';

/**
 * `VStack` (or Vertical Stack) is a layout component that arranges child elements in a vertical line.
 *
 * `VStack` can render anything inside.
 *
 * @example
 * ```jsx
 * import { VStack, Text, View } from `@wordpress/components/ui`;
 *
 * function Example() {
 * 	return (
 * 		<VStack>
 * 			<View>
 * 				<Text>Code</Text>
 * 			</View>
 * 			<View>
 * 				<Text>is</Text>
 * 			</View>
 * 			<View>
 * 				<Text>Poetry</Text>
 * 			</View>
 * 		</VStack>
 * 	);
 * }
 * ```
 */
const VStack = createComponent( {
	as: 'div',
	useHook: useVStack,
	name: 'VStack',
} );

export default VStack;
