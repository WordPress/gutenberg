// @ts-nocheck
/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { InputRange as BaseInputRange } from './styles/range-control-styles';
import { useDebouncedHoverInteraction } from './utils';
import { useJumpStep } from '../utils/hooks';
import { roundClamp } from '../utils/math';

function InputRange(
	{
		describedBy,
		failsafeValue,
		isShiftStepEnabled = true,
		label,
		onHideTooltip = noop,
		onMouseLeave = noop,
		onMouseMove = noop,
		onShowTooltip = noop,
		shiftStep,
		step,
		...props
	},
	ref
) {
	const baseStep = step === 'any' ? 1 : step;
	const jumpStep = useJumpStep( {
		baseStep,
		shiftStep,
		isShiftStepEnabled,
	} );

	const refIsMouseDown = useRef( false );
	let onChange;
	let onMouseDown;
	if ( isShiftStepEnabled ) {
		onChange = ( { target: { value: nextValue } } ) => {
			nextValue = parseFloat( nextValue );
			if ( jumpStep !== baseStep ) {
				const { min, max } = props;
				if ( ! refIsMouseDown.current ) {
					const difference = nextValue - failsafeValue;
					nextValue = failsafeValue + difference * jumpStep;
				}
				nextValue = roundClamp( nextValue, min, max, jumpStep );
			}
			props.onChange( nextValue );
		};
		// Syncs refIsMouseDown to mouse down/up events
		onMouseDown = ( event ) => {
			props.onMouseDown?.( event );
			refIsMouseDown.current = true;
			document.addEventListener(
				'mouseup',
				() => ( refIsMouseDown.current = false ),
				{ once: true }
			);
		};
	}

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
			onChange={ onChange }
			onMouseDown={ onMouseDown }
			ref={ ref }
			tabIndex={ 0 }
			type="range"
		/>
	);
}

const ForwardedComponent = forwardRef( InputRange );

export default ForwardedComponent;
