/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { forwardRef, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { View } from '../../view';
import { useControlledValue } from '../../utils';
import type { WordPressComponentProps } from '../../context';
import ToggleGroupControlContext from '../context';
import { useComputeControlledOrUncontrolledValue } from './utils';
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
		value: valueProp,
		id: idProp,
		setSelectedElement,
		...otherProps
	}: WordPressComponentProps<
		ToggleGroupControlMainControlProps,
		'div',
		false
	>,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) {
	const generatedId = useInstanceId(
		ToggleGroupControlAsButtonGroup,
		'toggle-group-control-as-button-group'
	);
	const baseId = idProp || generatedId;

	// Use a heuristic to understand if the component is being used in controlled
	// or uncontrolled mode, and consequently:
	// - when controlled, convert `undefined` values to `''` (ie. "no value")
	// - use the `value` prop as the `defaultValue` when uncontrolled
	const { value, defaultValue } =
		useComputeControlledOrUncontrolledValue( valueProp );

	const [ selectedValue, setSelectedValue ] = useControlledValue( {
		defaultValue,
		value,
		onChange,
	} );

	const groupContextValue = useMemo(
		(): ToggleGroupControlContextProps => ( {
			baseId,
			value: selectedValue,
			setValue: setSelectedValue,
			isBlock: ! isAdaptiveWidth,
			isDeselectable: true,
			size,
			setSelectedElement,
		} ),
		[
			baseId,
			selectedValue,
			setSelectedValue,
			isAdaptiveWidth,
			size,
			setSelectedElement,
		]
	);

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
