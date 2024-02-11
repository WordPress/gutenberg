/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { Spacer } from '../spacer';
import type { WordPressComponentProps } from '../context';
import { contextConnect, useContextSystem } from '../context';
import type { InputControlSuffixWrapperProps } from './types';

function UnconnectedInputControlSuffixWrapper(
	props: WordPressComponentProps< InputControlSuffixWrapperProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlSuffixWrapper' );

	return (
		<Spacer marginBottom={ 0 } { ...derivedProps } ref={ forwardedRef } />
	);
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
