/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import {
	forwardRef,
	useRef,
	useLayoutEffect,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import ToggleGroupControlContext from '../context';
import type { WordPressComponentProps } from '../../ui/context';
import type { ToggleGroupControlMainControlProps } from '../types';

function UnforwardedToggleGroupControlAsRadioGroup(
	{
		children,
		isAdaptiveWidth,
		label,
		onChange,
		size,
		value,
		...otherProps
	}: WordPressComponentProps<
		ToggleGroupControlMainControlProps,
		'div',
		false
	>,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	const mounted = useRef( false );

	const baseId = useInstanceId(
		ToggleGroupControlAsRadioGroup,
		'toggle-group-control-as-radio-group'
	).toString();
	const radio = useRadioState( {
		baseId,
		state: value,
	} );
	const previousValue = usePrevious( value );

	useEffect( () => {
		mounted.current = true;
	}, [] );

	const { setState: radioSetState, state: radioState } = radio;

	// Propagate radio.state change.
	useLayoutEffect( () => {
		// Avoid calling onChange if radio state changed
		// from incoming value.
		if ( mounted.current && previousValue !== radioState ) {
			onChange( radioState );
		}
	}, [ radioState, previousValue, onChange ] );

	// Sync incoming value with radio.state.
	useLayoutEffect( () => {
		if ( mounted.current && value !== radioState ) {
			radioSetState( value );
		}
	}, [ value, radioSetState, radioState ] );

	return (
		<ToggleGroupControlContext.Provider
			value={ { ...radio, isBlock: ! isAdaptiveWidth, size } }
		>
			<RadioGroup
				{ ...radio }
				aria-label={ label }
				as={ View }
				{ ...otherProps }
				ref={ forwardedRef }
			>
				{ children }
			</RadioGroup>
		</ToggleGroupControlContext.Provider>
	);
}

export const ToggleGroupControlAsRadioGroup = forwardRef(
	UnforwardedToggleGroupControlAsRadioGroup
);
