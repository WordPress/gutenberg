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
 * 	__experimentalVStack as VStack,
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<VStack>
 * 			<Text>Code</Text>
 * 			<Text>is</Text>
 * 			<Text>Poetry</Text>
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
