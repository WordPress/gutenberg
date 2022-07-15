/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { Spacer } from '../spacer';
import {
	WordPressComponentProps,
	contextConnect,
	useContextSystem,
} from '../ui/context';
import type { InputControlPrefixProps } from './types';

function UnconnectedInputControlPrefix(
	props: WordPressComponentProps< InputControlPrefixProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlPrefix' );

	return (
		<Spacer marginBottom={ 0 } { ...derivedProps } ref={ forwardedRef } />
	);
}

/**
 * A convenience wrapper for the `prefix` when you want to apply
 * standard padding in accordance with the size variant.
 *
 * ```jsx
 * import {
 *   __experimentalInputControl as InputControl,
 *   __experimentalInputControlPrefix as InputControlPrefix,
 * } from '@wordpress/components';
 *
 * <InputControl
 *   prefix={<InputControlPrefix>@</InputControlPrefix>}
 * />
 * ```
 */
export const InputControlPrefix = contextConnect(
	UnconnectedInputControlPrefix,
	'InputControlPrefix'
);

export default InputControlPrefix;
