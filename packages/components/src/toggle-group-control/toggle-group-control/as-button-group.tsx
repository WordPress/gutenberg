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
import { forwardRef, useRef, useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import ToggleGroupControlBackdrop from './toggle-group-control-backdrop';
import ToggleGroupControlContext from '../context';
import { useUpdateEffect } from '../../utils/hooks';
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
	const containerRef = useRef();
	const [ resizeListener, sizes ] = useResizeObserver();
	const baseId = useInstanceId(
		ToggleGroupControlAsButtonGroup,
		'toggle-group-control-as-button-group'
	).toString();
	const [ selectedValue, setSelectedValue ] = useState( value );
	const previousValue = usePrevious( value );

	// Propagate selectedValue change.
	useUpdateEffect( () => {
		// Avoid calling onChange if selectedValue changed
		// from incoming value.
		if ( previousValue !== selectedValue ) {
			onChange( selectedValue );
		}
	}, [ selectedValue, previousValue, onChange ] );

	// Sync incoming value with selectedValue.
	useUpdateEffect( () => {
		if ( previousValue !== value ) {
			setSelectedValue( value );
		}
	}, [ value, previousValue ] );
	// Expose selectedValue getter/setter via context
	const groupContext: ToggleGroupControlContextProps = useMemo(
		() => ( {
			baseId,
			state: selectedValue,
			setState: setSelectedValue,
			isBlock: ! isAdaptiveWidth,
			isDeselectable: true,
			size,
		} ),
		[ baseId, selectedValue, isAdaptiveWidth, size ]
	);
	return (
		<ToggleGroupControlContext.Provider value={ groupContext }>
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
