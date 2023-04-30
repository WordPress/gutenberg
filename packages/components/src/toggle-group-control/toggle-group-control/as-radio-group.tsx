/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { RadioGroup, useRadioState } from 'reakit';
// eslint-disable-next-line no-restricted-imports
import { LayoutGroup } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import ToggleGroupControlContext from '../context';
import { useUpdateEffect } from '../../utils/hooks';
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
	const baseId = useInstanceId(
		ToggleGroupControlAsRadioGroup,
		'toggle-group-control-as-radio-group'
	).toString();
	const radio = useRadioState( {
		baseId,
		state: value,
	} );
	const previousValue = usePrevious( value );

	// Propagate radio.state change.
	useUpdateEffect( () => {
		// Avoid calling onChange if radio state changed
		// from incoming value.
		if ( previousValue !== radio.state ) {
			onChange( radio.state );
		}
	}, [ radio.state ] );

	// Sync incoming value with radio.state.
	useUpdateEffect( () => {
		if ( value !== radio.state ) {
			radio.setState( value );
		}
	}, [ value ] );

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
				{ /* `LayoutGroup` acts as a "namespace" for the backdrop's shared
							layout animation (defined in `ToggleGroupControlOptionBase`), and
							thus it allows multiple instances of `ToggleGroupControl` in the
							same page, each with their independent backdrop animation.
					 */ }
				<LayoutGroup id={ baseId }>{ children }</LayoutGroup>
			</RadioGroup>
		</ToggleGroupControlContext.Provider>
	);
}

export const ToggleGroupControlAsRadioGroup = forwardRef(
	UnforwardedToggleGroupControlAsRadioGroup
);
