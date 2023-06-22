/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useMemo } from '@wordpress/element';

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

function UnforwardedToggleGroupControlAsRadioGroup(
	{
		children,
		isAdaptiveWidth,
		label,
		onChange: onChangeProp,
		size,
		value: valueProp,
		defaultValue: defaultValueProp,
		...otherProps
	}: WordPressComponentProps<
		ToggleGroupControlMainControlProps,
		'div',
		false
	>,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	const baseId = useInstanceId(
		ToggleGroupControlAsRadioGroup,
		'toggle-group-control-as-radio-group'
	).toString();

	// Handle controlled and uncontrolled updates to the component.
	// Similar to the logic in the `useControlledState` hook, but with:
	// - `useRadioState` instead of `useState`
	// - a guard in `onChange` so that it doesn't fire if the value doesn't change
	const hasValue = typeof valueProp !== 'undefined';
	const initialValue = hasValue ? valueProp : defaultValueProp;
	const { state, setState, ...radio } = useRadioState( {
		baseId,
		state: initialValue,
	} );
	const value = hasValue ? valueProp : state;
	const onChange =
		typeof onChangeProp === 'function'
			? ( ( ( newValue ) => {
					if ( newValue !== value ) {
						onChangeProp( newValue );
					}
			  } ) as typeof onChangeProp )
			: undefined;

	let setValue: ( nextValue: typeof value ) => void;
	if ( hasValue && typeof onChange === 'function' ) {
		setValue = onChange;
	} else if ( ! hasValue && typeof onChange === 'function' ) {
		setValue = ( nextValue ) => {
			onChange( nextValue );
			setState( nextValue );
		};
	} else {
		setValue = setState;
	}

	const groupContextValue = useMemo(
		() =>
			( {
				...radio,
				state: value,
				setState: setValue,
				isBlock: ! isAdaptiveWidth,
				size,
			} as ToggleGroupControlContextProps ),
		[ radio, setValue, value, isAdaptiveWidth, size ]
	);

	return (
		<ToggleGroupControlContext.Provider value={ groupContextValue }>
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
