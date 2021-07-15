/**
 * Internal dependencies
 */
import { createComponent } from '../../ui/utils';
import { useFlexBlock } from './hook';

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
const FlexBlock = createComponent( {
	as: 'div',
	useHook: useFlexBlock,
	name: 'FlexBlock',
} );

export default FlexBlock;
