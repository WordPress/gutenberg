/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

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
import type { ToggleGroupControlMainControlProps } from '../types';

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
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeObserver();
	const baseId = useInstanceId(
		ToggleGroupControlAsButtonGroup,
		'toggle-group-control-as-button-group'
	).toString();
	const [ selectedValue, setSelectedValue ] = useState( value );
	const groupContext = {
		baseId,
		state: selectedValue,
		setState: setSelectedValue,
	};
	const previousValue = usePrevious( value );

	// Propagate groupContext.state change.
	useUpdateEffect( () => {
		// Avoid calling onChange if groupContext state changed
		// from incoming value.
		if ( previousValue !== groupContext.state ) {
			onChange( groupContext.state );
		}
	}, [ groupContext.state ] );

	// Sync incoming value with groupContext.state.
	useUpdateEffect( () => {
		if ( value !== groupContext.state ) {
			groupContext.setState( value );
		}
	}, [ value ] );

	return (
		<ToggleGroupControlContext.Provider
			value={ {
				...groupContext,
				isBlock: ! isAdaptiveWidth,
				isDeselectable: true,
				size,
			} }
		>
			<View
				aria-label={ label }
				{ ...otherProps }
				ref={ useMergeRefs( [ containerRef, forwardedRef ] ) }
				role="group"
			>
				{ resizeListener }
				<ToggleGroupControlBackdrop
					state={ groupContext.state }
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
