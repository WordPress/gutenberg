/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';
import { useDebouncedHoverInteraction } from './utils';
import { useJumpStep } from '../utils/hooks';

function InputRange(
	{
		describedBy,
		isShiftStepEnabled = true,
		label,
		onHideTooltip = noop,
		onMouseLeave = noop,
		step = 1,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onMouseMove = noop,
		onShowTooltip = noop,
		shiftStep = 10,
		value,
		...props
	},
	ref
) {
	const jumpStep = useJumpStep( {
		step,
		shiftStep,
		isShiftStepEnabled,
	} );

	const hoverInteractions = useDebouncedHoverInteraction( {
		onHide: onHideTooltip,
		onMouseLeave,
		onMouseMove,
		onShow: onShowTooltip,
	} );

	return (
		<BaseInputRange
			{ ...props }
			{ ...hoverInteractions }
			aria-describedby={ describedBy }
			aria-label={ label }
			aria-hidden={ false }
			onBlur={ onBlur }
			onChange={ onChange }
			onFocus={ onFocus }
			ref={ ref }
			step={ jumpStep }
			tabIndex={ 0 }
			type="range"
			value={ value }
		/>
	);
}

const ForwardedComponent = forwardRef( InputRange );

export default ForwardedComponent;
