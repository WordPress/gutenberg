/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { View } from '../view';
import { useHStack } from './hook';
import type { Props } from './types';

function UnconnectedHStack(
	props: WordPressComponentProps< Props, 'div' >,
	forwardedRef: React.ForwardedRef< any >
) {
	const hStackProps = useHStack( props );

	return <View { ...hStackProps } ref={ forwardedRef } />;
}

/**
 * `HStack` (Horizontal Stack) arranges child elements in a horizontal line.
 *
 * `HStack` can render anything inside.
 *
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
export const HStack = contextConnect( UnconnectedHStack, 'HStack' );

export default HStack;
