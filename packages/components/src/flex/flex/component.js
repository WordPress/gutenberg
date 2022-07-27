/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { useFlex } from './hook';
import { FlexContext } from './../context';
import { View } from '../../view';

/**
 * @param {import('../../ui/context').WordPressComponentProps<import('../types').FlexProps, 'div'>} props
 * @param {import('react').ForwardedRef<any>}                                                       forwardedRef
 */
function Flex( props, forwardedRef ) {
	const { children, isColumn, ...otherProps } = useFlex( props );

	return (
		<FlexContext.Provider
			value={ { flexItemDisplay: isColumn ? 'block' : undefined } }
		>
			<View { ...otherProps } ref={ forwardedRef }>
				{ children }
			</View>
		</FlexContext.Provider>
	);
}

/**
 * `Flex` is a primitive layout component that adaptively aligns child content
 * horizontally or vertically. `Flex` powers components like `HStack` and
 * `VStack`.
 *
 * `Flex` is used with any of it's two sub-components, `FlexItem` and `FlexBlock`.
 *
 * @example
 * ```jsx
 * import { Flex, FlexBlock, FlexItem } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <Flex>
 *       <FlexItem>
 *         <p>Code</p>
 *       </FlexItem>
 *       <FlexBlock>
 *         <p>Poetry</p>
 *       </FlexBlock>
 *     </Flex>
 *   );
 * }
 * ```
 */
const ConnectedFlex = contextConnect( Flex, 'Flex' );

export default ConnectedFlex;
