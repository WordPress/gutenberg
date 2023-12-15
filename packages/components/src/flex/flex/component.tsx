/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useFlex } from './hook';
import { FlexContext } from './../context';
import { View } from '../../view';
import type { FlexProps } from '../types';

function UnconnectedFlex(
	props: WordPressComponentProps< FlexProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
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
 * `Flex` is used with any of its two sub-components, `FlexItem` and
 * `FlexBlock`.
 *
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
export const Flex = contextConnect( UnconnectedFlex, 'Flex' );

export default Flex;
