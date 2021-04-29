/**
 * Internal dependencies
 */
import { createComponent } from '../../ui/utils';
import { useFlexItem } from './hook';

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
const FlexItem = createComponent( {
	as: 'div',
	useHook: useFlexItem,
	name: 'FlexItem',
} );

export default FlexItem;
