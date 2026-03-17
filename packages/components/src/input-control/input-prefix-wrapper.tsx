/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import type { PrefixSuffixWrapperProps } from './types';
import { PrefixSuffixWrapper } from './styles/input-control-styles';

function UnconnectedInputControlPrefixWrapper(
	props: WordPressComponentProps< PrefixSuffixWrapperProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlPrefixWrapper' );

	return (
		<PrefixSuffixWrapper
			{ ...derivedProps }
			isPrefix
			ref={ forwardedRef }
		/>
	);
}

/**
 * A convenience wrapper for the `prefix` when you want to apply
 * standard padding in accordance with the size variant.
 *
 * ```jsx
 * import {
 *   __experimentalInputControl as InputControl,
 *   __experimentalInputControlPrefixWrapper as InputControlPrefixWrapper,
 * } from '@wordpress/components';
 *
 * <InputControl
 *   prefix={<InputControlPrefixWrapper>@</InputControlPrefixWrapper>}
 * />
 * ```
 */
export const InputControlPrefixWrapper = contextConnect(
	UnconnectedInputControlPrefixWrapper,
	'InputControlPrefixWrapper'
);

export default InputControlPrefixWrapper;
