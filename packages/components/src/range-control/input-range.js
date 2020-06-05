/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';
import { useDebouncedHoverInteraction } from './utils';

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
			className="components-range-control__slider"
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

function useJumpStep( { isShiftStepEnabled, shiftStep, step } ) {
	const [ isShiftKey, setIsShiftKey ] = useState( false );

	useEffect( () => {
		const handleShiftKeyToggle = ( event ) => {
			setIsShiftKey( event.shiftKey );
		};

		window.addEventListener( 'keydown', handleShiftKeyToggle );
		window.addEventListener( 'keyup', handleShiftKeyToggle );

		return () => {
			window.removeEventListener( 'keydown', handleShiftKeyToggle );
			window.removeEventListener( 'keyup', handleShiftKeyToggle );
		};
	}, [] );

	return isShiftStepEnabled && isShiftKey ? shiftStep : step;
}

const ForwardedComponent = forwardRef( InputRange );

export default ForwardedComponent;
