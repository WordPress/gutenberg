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
import type { InputControlSuffixProps } from './types';

function UnconnectedInputControlSuffix(
	props: WordPressComponentProps< InputControlSuffixProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const derivedProps = useContextSystem( props, 'InputControlSuffix' );

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
 *   __experimentalInputControlSuffix as InputControlSuffix,
 * } from '@wordpress/components';
 *
 * <InputControl
 *   suffix={<InputControlSuffix>%</InputControlSuffix>}
 * />
 * ```
 */
export const InputControlSuffix = contextConnect(
	UnconnectedInputControlSuffix,
	'InputControlSuffix'
);

export default InputControlSuffix;
