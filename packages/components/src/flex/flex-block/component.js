/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { View } from '../../view';
import { useFlexBlock } from './hook';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').FlexBlockProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                     forwardedRef
 */
function FlexBlock( props, forwardedRef ) {
	const flexBlockProps = useFlexBlock( props );

	return <View { ...flexBlockProps } ref={ forwardedRef } />;
}

/**
 * `FlexBlock` is a primitive layout component that adaptively resizes content within layout containers like `Flex`.
 *
 * @example
 * ```jsx
 * <Flex>
 * 	<FlexBlock>...</FlexBlock>
 * </Flex>
 * ```
 */
const ConnectedFlexBlock = contextConnect( FlexBlock, 'FlexBlock' );

export default ConnectedFlexBlock;
