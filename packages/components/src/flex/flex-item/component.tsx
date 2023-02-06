/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { View } from '../../view';
import { useFlexItem } from './hook';
import type { FlexItemProps } from '../types';

function UnconnectedFlexItem(
	props: WordPressComponentProps< FlexItemProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const flexItemProps = useFlexItem( props );

	return <View { ...flexItemProps } ref={ forwardedRef } />;
}

/**
 * `FlexItem` is a primitive layout component that aligns content within layout
 * containers like `Flex`.
 *
 * ```jsx
 * import { Flex, FlexItem } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <Flex>
 *       <FlexItem>...</FlexItem>
 *     </Flex>
 *   );
 * }
 * ```
 */
export const FlexItem = contextConnect( UnconnectedFlexItem, 'FlexItem' );

export default FlexItem;
