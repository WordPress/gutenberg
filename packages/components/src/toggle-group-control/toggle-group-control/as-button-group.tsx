/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { LayoutGroup } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { forwardRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
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
				ref={ forwardedRef }
				role="group"
			>
				{ /* `LayoutGroup` acts as a "namespace" for the backdrop's shared
							layout animation (defined in `ToggleGroupControlOptionBase`), and
							thus it allows multiple instances of `ToggleGroupControl` in the
							same page, each with their independent backdrop animation.
					 */ }
				<LayoutGroup id={ baseId }>{ children }</LayoutGroup>
			</View>
		</ToggleGroupControlContext.Provider>
	);
}

export const ToggleGroupControlAsButtonGroup = forwardRef(
	UnforwardedToggleGroupControlAsButtonGroup
);
