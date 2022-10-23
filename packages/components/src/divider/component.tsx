/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { Separator } from 'reakit';
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../ui/context';
import { DividerView } from './styles';
import type { DividerProps } from './types';

function UnconnectedDivider(
	props: WordPressComponentProps< DividerProps, 'hr', false >,
	forwardedRef: ForwardedRef< any >
) {
	const contextProps = useContextSystem( props, 'Divider' );

	return (
		<Separator
			as={ DividerView }
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
