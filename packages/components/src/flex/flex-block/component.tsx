/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressPolymorphicComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { View } from '../../view';
import type { FlexBlockProps } from '../types';
import { useFlexBlock } from './hook';

function UnconnectedFlexBlock(
	props: WordPressPolymorphicComponentProps< FlexBlockProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const flexBlockProps = useFlexBlock( props );

	return <View { ...flexBlockProps } ref={ forwardedRef } />;
}

/**
 * `FlexBlock` is a primitive layout component that adaptively resizes content
 * within layout containers like `Flex`.
 *
 * ```jsx
 * import { Flex, FlexBlock } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <Flex>
 *       <FlexBlock>...</FlexBlock>
 *     </Flex>
 *   );
 * }
 * ```
 */
export const FlexBlock = contextConnect( UnconnectedFlexBlock, 'FlexBlock' );

export default FlexBlock;
