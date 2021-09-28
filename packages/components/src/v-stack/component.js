/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import { useVStack } from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').Ref<any>}                                                        forwardedRef
 */
function VStack( props, forwardedRef ) {
	const vStackProps = useVStack( props );

	return <View { ...vStackProps } ref={ forwardedRef } />;
}

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
const ConnectedVStack = contextConnect( VStack, 'VStack' );

export default ConnectedVStack;
