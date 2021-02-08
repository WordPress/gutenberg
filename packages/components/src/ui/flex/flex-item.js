/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useFlexItem } from './use-flex-item';

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
