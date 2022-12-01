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
import { forwardRef, useRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import ToggleGroupControlBackdrop from './toggle-group-control-backdrop';
import ToggleGroupControlContext from '../context';
import { useControlledValue } from '../../utils/hooks';
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
	const previousValue = usePrevious( value );
	const [ selectedValue, setSelectedValue ] = useControlledValue( {
		defaultValue: previousValue,
		onChange,
		value,
	} );
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
		[ baseId, selectedValue, setSelectedValue, isAdaptiveWidth, size ]
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
