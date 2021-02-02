/**
 * Internal dependencies
 */
import { createComponent } from '../utils';
import { useFlexBlock } from './use-flex-block';

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
