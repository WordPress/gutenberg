/**
 * Internal dependencies
 */
import { createComponent } from '../ui/utils';
import { useHStack } from './hook';

/**
 * `HStack` (Horizontal Stack) arranges child elements in a horizontal line.
 *
 * `HStack` can render anything inside.
 *
 * @example
 * ```jsx
 * import {
 * 	__experimentalHStack as HStack,
 * 	__experimentalText as Text,
 * 	__experimentalView as View,
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<HStack>
 * 			<View>
 * 				<Text>Code</Text>
 * 			</View>
 * 			<View>
 * 				<Text>is</Text>
 * 			</View>
 * 			<View>
 * 				<Text>Poetry</Text>
 * 			</View>
 * 		</HStack>
 * 	);
 * }
 * ```
 */
const HStack = createComponent( {
	as: 'div',
	useHook: useHStack,
	name: 'HStack',
} );

export default HStack;
