/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { View } from '../../view';
import { useFlexItem } from './hook';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').FlexItemProps, 'div'>} props
 * @param {import('react').Ref<any>}                                                                    forwardedRef
 */
function FlexItem( props, forwardedRef ) {
	const flexItemProps = useFlexItem( props );

	return <View { ...flexItemProps } ref={ forwardedRef } />;
}

/**
 * `FlexItem` is a primitive layout component that aligns content within layout containers like `Flex`.
 *
 * @example
 * ```jsx
 * <Flex>
 * 	<FlexItem>...</FlexItem>
 * </Flex>
 * ```
 */
const ConnectedFlexItem = contextConnect( FlexItem, 'FlexItem' );

export default ConnectedFlexItem;
