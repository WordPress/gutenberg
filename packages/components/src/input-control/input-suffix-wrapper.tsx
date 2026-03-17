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

function UnconnectedInputControlSuffixWrapper(
	props: WordPressComponentProps< PrefixSuffixWrapperProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlSuffixWrapper' );

	return <PrefixSuffixWrapper { ...derivedProps } ref={ forwardedRef } />;
}

/**
 * A convenience wrapper for the `suffix` when you want to apply
 * standard padding in accordance with the size variant.
 *
 * ```jsx
 * import {
 *   __experimentalInputControl as InputControl,
 *   __experimentalInputControlSuffixWrapper as InputControlSuffixWrapper,
 * } from '@wordpress/components';
 *
 * <InputControl
 *   suffix={<InputControlSuffixWrapper>%</InputControlSuffixWrapper>}
 * />
 * ```
 */
export const InputControlSuffixWrapper = contextConnect(
	UnconnectedInputControlSuffixWrapper,
	'InputControlSuffixWrapper'
);

export default InputControlSuffixWrapper;
