/**
 * External dependencies
 */
import type { ForwardedRef, ReactText } from 'react';

/**
 * WordPress dependencies
 */
import {
	useMergeRefs,
	useInstanceId,
	usePrevious,
	useResizeObserver,
} from '@wordpress/compose';
import { forwardRef, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import ToggleGroupControlBackdrop from './toggle-group-control-backdrop';
import ToggleGroupControlContext from '../context';
import { useUpdateEffect } from '../../utils/hooks';
import type { WordPressComponentProps } from '../../ui/context';
import type { ToggleGroupControlAsRadioProps } from '../types';

function UnforwardedToggleGroupControlAsButtonGroup(
	{
		children,
		isAdaptiveWidth,
		label,
		onChange,
		size,
		value,
		...otherProps
	}: WordPressComponentProps< ToggleGroupControlAsRadioProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeObserver();
	const baseId = useInstanceId(
		ToggleGroupControlAsButtonGroup,
		'toggle-group-control-as-button-group'
	).toString();
	const [ selectedValue, setSelectedValue ] = useState<
		ReactText | undefined
	>( value );
	const radio = { baseId, state: selectedValue, setState: setSelectedValue };
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
			value={ {
				...radio,
				isBlock: ! isAdaptiveWidth,
				isDeselectable: true,
				size,
			} }
		>
			<View
				{ ...radio }
				aria-label={ label }
				{ ...otherProps }
				ref={ useMergeRefs( [ containerRef, forwardedRef ] ) }
				role="group"
			>
				{ resizeListener }
				<ToggleGroupControlBackdrop
					{ ...radio }
					containerRef={ containerRef }
					containerWidth={ sizes.width }
					isAdaptiveWidth={ isAdaptiveWidth }
				/>
				{ children }
			</View>
		</ToggleGroupControlContext.Provider>
	);
}

export const ToggleGroupControlAsButtonGroup = forwardRef(
	UnforwardedToggleGroupControlAsButtonGroup
);
