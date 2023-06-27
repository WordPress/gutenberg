/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioStore } from '@ariakit/react/radio';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import type { WordPressComponentProps } from '../../ui/context';
import ToggleGroupControlContext from '../context';
import { useAdjustUndefinedValue } from './utils';
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
		id: idProp,
		...otherProps
	}: WordPressComponentProps<
		ToggleGroupControlMainControlProps,
		'div',
		false
	>,
	forwardedRef: ForwardedRef< HTMLDivElement >
) {
	const generatedId = useInstanceId(
		ToggleGroupControlAsRadioGroup,
		'toggle-group-control-as-radio-group'
	).toString();
	const baseId = idProp || generatedId;

	// Use a heuristic to understand if an `undefined` value should be intended as
	// "no value" for controlled mode, or that the component is being used in
	// an uncontrolled way.
	const adjustedValueProp = useAdjustUndefinedValue( valueProp );

	// `useRadioStore`'s `setValue` prop can be called with `null`, while
	// the component's `onChange` prop only expects `undefined`
	const wrappedOnChangeProp = onChangeProp
		? ( value: string | number | null ) => {
				onChangeProp( value ?? undefined );
		  }
		: undefined;

	const radio = useRadioStore( {
		defaultValue: defaultValueProp,
		value: adjustedValueProp,
		setValue: wrappedOnChangeProp,
	} );

	const selectedValue = radio.useState( 'value' );
	const setValue = radio.setValue;

	const groupContextValue = useMemo(
		() =>
			( {
				baseId,
				isBlock: ! isAdaptiveWidth,
				size,
				value: selectedValue,
				setValue,
			} as ToggleGroupControlContextProps ),
		[ baseId, isAdaptiveWidth, size, selectedValue, setValue ]
	);

	return (
		<ToggleGroupControlContext.Provider value={ groupContextValue }>
			<RadioGroup
				store={ radio }
				aria-label={ label }
				as={ View }
				{ ...otherProps }
				id={ baseId }
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
