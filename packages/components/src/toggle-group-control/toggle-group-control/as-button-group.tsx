/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import {
	forwardRef,
	useMemo,
	useState,
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
import type {
	ToggleGroupControlMainControlProps,
	ToggleGroupControlContextProps,
} from '../types';

function UnforwardedToggleGroupControlAsButtonGroup(
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
		ToggleGroupControlAsButtonGroup,
		'toggle-group-control-as-button-group'
	).toString();
	const [ selectedValue, setSelectedValue ] = useState( value );
	const previousValue = usePrevious( value );

	const groupContextValue = useMemo(
		() =>
			( {
				baseId,
				state: selectedValue,
				setState: setSelectedValue,
				isBlock: ! isAdaptiveWidth,
				isDeselectable: true,
				size,
			} as ToggleGroupControlContextProps ),
		[ baseId, selectedValue, isAdaptiveWidth, size ]
	);

	useEffect( () => {
		mounted.current = true;
	}, [] );

	const { setState: groupSetState, state: groupState } = groupContextValue;

	// Propagate groupContext.state change.
	useLayoutEffect( () => {
		// Avoid calling onChange if groupContext state changed
		// from incoming value.
		if ( mounted.current && previousValue !== groupState ) {
			onChange( groupState );
		}
	}, [ groupState, onChange, previousValue ] );

	// Sync incoming value with groupContext.state.
	useLayoutEffect( () => {
		if ( value !== groupState ) {
			groupSetState( value );
		}
	}, [ groupSetState, groupState, value ] );

	return (
		<ToggleGroupControlContext.Provider value={ groupContextValue }>
			<View
				aria-label={ label }
				{ ...otherProps }
				ref={ forwardedRef }
				role="group"
			>
				{ children }
			</View>
		</ToggleGroupControlContext.Provider>
	);
}

export const ToggleGroupControlAsButtonGroup = forwardRef(
	UnforwardedToggleGroupControlAsButtonGroup
);
