/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect } from '../context';
import { View } from '../view';
import { useHStack } from './hook';
import type { Props } from './types';

// This prop is exported differently than others because creating a type and
// then using that type in the component below causes TS union error in other
// files. `Expression produces a union type that is too complex to represent.`
export type HStackProps = Parameters< typeof UnconnectedHStack >[ 0 ];

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
