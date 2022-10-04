/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../ui/context';
import { View } from '../view';
import { useVStack } from './hook';
import type { VStackProps } from './types';

function UnconnectedVStack(
	props: WordPressComponentProps< VStackProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const vStackProps = useVStack( props );

	return <View { ...vStackProps } ref={ forwardedRef } />;
}

/**
 * `VStack` (or Vertical Stack) is a layout component that arranges child
 * elements in a vertical line.
 *
 * `VStack` can render anything inside.
 *
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
export const VStack = contextConnect( UnconnectedVStack, 'VStack' );

export default VStack;
