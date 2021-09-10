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
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<HStack>
 * 			<Text>Code</Text>
 * 			<Text>is</Text>
 * 			<Text>Poetry</Text>
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
