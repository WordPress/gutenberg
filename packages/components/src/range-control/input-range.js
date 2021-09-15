// @ts-nocheck
/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { UP, RIGHT, DOWN, LEFT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';
import { useDebouncedHoverInteraction } from './utils';
import { add, subtract, roundClamp } from '../utils/math';

const _isRTL = isRTL();

const operationList = {
	[ UP ]: add,
	[ RIGHT ]: _isRTL ? subtract : add,
	[ DOWN ]: subtract,
	[ LEFT ]: _isRTL ? add : subtract,
};

function InputRange(
	{
		describedBy,
		failsafeValue,
		isShiftStepEnabled = true,
		label,
		onHideTooltip = noop,
		onMouseLeave = noop,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onMouseMove = noop,
		onShiftStep,
		onShowTooltip = noop,
		shiftStep,
		value,
		...props
	},
	ref
) {
	const onKeyDown = ( event ) => {
		const { keyCode, shiftKey } = event;
		props.onKeyDown?.( event );

		if ( isShiftStepEnabled && shiftKey && keyCode in operationList ) {
			event.preventDefault();
			const { min, max, step } = props;
			const modifiedStep = shiftStep * step;
			const nextValue = operationList[ keyCode ](
				failsafeValue,
				modifiedStep
			);
			onShiftStep( roundClamp( nextValue, min, max, modifiedStep ) );
		}
	};

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
			onKeyDown={ onKeyDown }
			ref={ ref }
			tabIndex={ 0 }
			type="range"
			value={ value }
		/>
	);
}

const ForwardedComponent = forwardRef( InputRange );

export default ForwardedComponent;
