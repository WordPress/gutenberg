/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { useFlex } from './hook';
import { FlexContext } from './../context';
import { View } from '../../view';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').FlexProps, 'div'>} props
 * @param {import('react').Ref<any>} forwardedRef
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
 * import {
 * 	__experimentalFlex as Flex,
 * 	__experimentalFlexBlock as FlexBlock,
 * 	__experimentalFlexItem as FlexItem,
 * 	__experimentalText as Text
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<Flex>
 * 			<FlexItem>
 * 				<Text>Code</Text>
 * 			</FlexItem>
 * 			<FlexBlock>
 * 				<Text>Poetry</Text>
 * 			</FlexBlock>
 * 		</Flex>
 * 	);
 * }
 * ```
 *
 */
const ConnectedFlex = contextConnect( Flex, 'Flex' );

export default ConnectedFlex;
