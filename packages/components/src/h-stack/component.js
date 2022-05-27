/**
 * Internal dependencies
 */
import { contextConnect } from '../ui/context';
import { View } from '../view';
import { useHStack } from './hook';

/**
 * @param {import('../ui/context').WordPressComponentProps<import('./types').Props, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                               forwardedRef
 */
function HStack( props, forwardedRef ) {
	const hStackProps = useHStack( props );

	return <View { ...hStackProps } ref={ forwardedRef } />;
}

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
const ConnectedHStack = contextConnect( HStack, 'HStack' );

export default ConnectedHStack;
