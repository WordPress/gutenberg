/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import { useVStack } from './hook';

/**
 * `VStack` (or Vertical Stack) is a layout component that arranges child elements in a vertical line.
 *
 * `VStack` can render anything inside.
 *
 * @example
 * ```jsx
 * import {
 * 	__experimentalText as Text,
 * 	__experimentalView as View,
 * 	__experimentalVStack as VStack,
 * } from `@wordpress/components`;
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
