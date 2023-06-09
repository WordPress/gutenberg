/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { forwardRef, useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { useUpdateLayoutEffect } from '../utils';
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

	const { setState: groupSetState, state: groupState } = groupContextValue;

	// Propagate groupContext.state change.
	useUpdateLayoutEffect( () => {
		// Avoid calling onChange if groupContext state changed
		// from incoming value.
		if ( previousValue !== groupState ) {
			onChange( groupState );
		}
	}, [ groupState, onChange, previousValue ] );

	// Sync incoming value with groupContext.state.
	useUpdateLayoutEffect( () => {
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
