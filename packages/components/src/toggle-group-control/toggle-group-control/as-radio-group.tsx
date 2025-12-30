/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import * as Ariakit from '@ariakit/react';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useEffect, useMemo } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import type { WordPressComponentProps } from '../../context';
import ToggleGroupControlContext from '../context';
import { useComputeControlledOrUncontrolledValue } from './utils';
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
		id: idProp,
		setSelectedElement,
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
	);
	const baseId = idProp || generatedId;

	// Use a heuristic to understand if the component is being used in controlled
	// or uncontrolled mode, and consequently:
	// - when controlled, convert `undefined` values to `''` (ie. "no value")
	// - use the `value` prop as the `defaultValue` when uncontrolled
	const { value, defaultValue } =
		useComputeControlledOrUncontrolledValue( valueProp );

	// `useRadioStore`'s `setValue` prop can be called with `null`, while
	// the component's `onChange` prop only expects `undefined`
	const wrappedOnChangeProp = onChangeProp
		? ( v: string | number | null ) => {
				onChangeProp( v ?? undefined );
		  }
		: undefined;

	const radio = Ariakit.useRadioStore( {
		defaultValue,
		value,
		setValue: wrappedOnChangeProp,
		rtl: isRTL(),
	} );

	const selectedValue = Ariakit.useStoreState( radio, 'value' );
	const setValue = radio.setValue;

	// Ensures that the active id is also reset after the value is "reset" by the consumer.
	useEffect( () => {
		if ( selectedValue === '' ) {
			radio.setActiveId( undefined );
		}
	}, [ radio, selectedValue ] );

	const groupContextValue = useMemo(
		(): ToggleGroupControlContextProps => ( {
			activeItemIsNotFirstItem: () =>
				radio.getState().activeId !== radio.first(),
			baseId,
			isBlock: ! isAdaptiveWidth,
			size,
			// @ts-expect-error - This is wrong and we should fix it.
			value: selectedValue,
			// @ts-expect-error - This is wrong and we should fix it.
			setValue,
			setSelectedElement,
		} ),
		[
			baseId,
			isAdaptiveWidth,
			radio,
			selectedValue,
			setSelectedElement,
			setValue,
			size,
		]
	);

	return (
		<ToggleGroupControlContext.Provider value={ groupContextValue }>
			<Ariakit.RadioGroup
				store={ radio }
				aria-label={ label }
				render={ <View /> }
				{ ...otherProps }
				id={ baseId }
				ref={ forwardedRef }
			>
				{ children }
			</Ariakit.RadioGroup>
		</ToggleGroupControlContext.Provider>
	);
}

export const ToggleGroupControlAsRadioGroup = forwardRef(
	UnforwardedToggleGroupControlAsRadioGroup
);
