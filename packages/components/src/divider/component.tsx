/**
 * External dependencies
 */
import * as Ariakit from '@ariakit/react';
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import { DividerView } from './styles';
import type { DividerProps } from './types';

function UnconnectedDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) {
	const contextProps = useContextSystem( props, 'Divider' );

	return (
		<Ariakit.Separator
			render={ <DividerView /> }
			{ ...contextProps }
			ref={ forwardedRef }
		/>
	);
}

/**
 * `Divider` is a layout component that separates groups of related content.
 *
 * ```js
 * import {
 * 		__experimentalDivider as Divider,
 * 		__experimentalText as Text,
 * 		__experimentalVStack as VStack,
 * } from `@wordpress/components`;
 *
 * function Example() {
 * 	return (
 * 		<VStack spacing={4}>
 * 			<Text>Some text here</Text>
 * 			<Divider />
 * 			<Text>Some more text here</Text>
 * 		</VStack>
 * 	);
 * }
 * ```
 */
export const Divider = contextConnect( UnconnectedDivider, 'Divider' );

export default Divider;
