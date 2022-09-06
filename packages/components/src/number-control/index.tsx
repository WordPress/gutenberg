/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Input } from './styles/number-control-styles';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { add, subtract, roundClamp } from '../utils/math';
import { isValueEmpty } from '../utils/values';
import type { WordPressComponentProps } from '../ui/context/wordpress-component';
import type { NumberControlProps } from './types';
import type { InputState } from '../input-control/reducer/state';

function UnforwardedNumberControl(
	{
		__unstableStateReducer: stateReducerProp,
		className,
		dragDirection = 'n',
		hideHTMLArrows = false,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		required = false,
		shiftStep = 10,
		step = 1,
		type: typeProp = 'number',
		value: valueProp,
		...props
	}: WordPressComponentProps< NumberControlProps, 'input', false >,
	ref: ForwardedRef< any >
) {
	const isStepAny = step === 'any';
	// @ts-expect-error step should be a number but could be string
	const baseStep = isStepAny ? 1 : parseFloat( step );
	const baseValue = roundClamp( 0, min, max, baseStep );
	const constrainValue = ( value: number, stepOverride?: number ) => {
		// When step is "any" clamp the value, otherwise round and clamp it.
		return isStepAny
			? Math.min( max, Math.max( min, value ) )
			: roundClamp( value, min, max, stepOverride ?? baseStep );
	};

	const autoComplete = typeProp === 'number' ? 'off' : undefined;
	const classes = classNames( 'components-number-control', className );

	/**
	 * "Middleware" function that intercepts updates from InputControl.
	 * This allows us to tap into actions to transform the (next) state for
	 * InputControl.
	 *
	 * @return The updated state to apply to InputControl
	 */
	const numberControlStateReducer = (
		/** State from InputControl. */
		state: InputState,
		/** Action triggering state change. */
		action: inputControlActionTypes.InputAction
	) => {
		const nextState = { ...state };

		const { type, payload } = action;
		const event = payload?.event;
		const currentValue = nextState.value;

		/**
		 * Handles custom UP and DOWN Keyboard events
		 */
		if (
			type === inputControlActionTypes.PRESS_UP ||
			type === inputControlActionTypes.PRESS_DOWN
		) {
			// @ts-expect-error TODO: Investigate if this is wrong
			const enableShift = event.shiftKey && isShiftStepEnabled;

			const incrementalValue = enableShift
				? // @ts-expect-error shiftStep should be a number but could be string
				  parseFloat( shiftStep ) * baseStep
				: baseStep;
			let nextValue = isValueEmpty( currentValue )
				? baseValue
				: currentValue;

			if ( event?.preventDefault ) {
				event.preventDefault();
			}

			if ( type === inputControlActionTypes.PRESS_UP ) {
				// @ts-expect-error TODO: Investigate if this is wrong
				nextValue = add( nextValue, incrementalValue );
			}

			if ( type === inputControlActionTypes.PRESS_DOWN ) {
				// @ts-expect-error TODO: Investigate if this is wrong
				nextValue = subtract( nextValue, incrementalValue );
			}

			// @ts-expect-error TODO: Investigate if this is wrong
			nextState.value = constrainValue(
				// @ts-expect-error TODO: Investigate if this is wrong
				nextValue,
				enableShift ? incrementalValue : undefined
			);
		}

		/**
		 * Handles drag to update events
		 */
		if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
			// @ts-expect-error TODO: Investigate
			const [ x, y ] = payload.delta;
			// @ts-expect-error TODO: Investigate
			const enableShift = payload.shiftKey && isShiftStepEnabled;
			const modifier = enableShift
				? // @ts-expect-error shiftStep should be a number but could be string
				  parseFloat( shiftStep ) * baseStep
				: baseStep;

			let directionModifier;
			let delta;

			switch ( dragDirection ) {
				case 'n':
					delta = y;
					directionModifier = -1;
					break;

				case 'e':
					delta = x;
					directionModifier = isRTL() ? -1 : 1;
					break;

				case 's':
					delta = y;
					directionModifier = 1;
					break;

				case 'w':
					delta = x;
					directionModifier = isRTL() ? 1 : -1;
					break;
			}

			if ( delta !== 0 ) {
				delta = Math.ceil( Math.abs( delta ) ) * Math.sign( delta );
				const distance = delta * modifier * directionModifier;

				// @ts-expect-error TODO: Investigate if this is wrong
				nextState.value = constrainValue(
					// @ts-expect-error TODO: Investigate if this is wrong
					add( currentValue, distance ),
					enableShift ? modifier : undefined
				);
			}
		}

		/**
		 * Handles commit (ENTER key press or blur)
		 */
		if (
			type === inputControlActionTypes.PRESS_ENTER ||
			type === inputControlActionTypes.COMMIT
		) {
			const applyEmptyValue = required === false && currentValue === '';

			// @ts-expect-error TODO: Investigate if this is wrong
			nextState.value = applyEmptyValue
				? currentValue
				: // @ts-expect-error TODO: Investigate if this is wrong
				  constrainValue( currentValue );
		}

		return nextState;
	};

	return (
		<Input
			autoComplete={ autoComplete }
			inputMode="numeric"
			{ ...props }
			className={ classes }
			dragDirection={ dragDirection }
			hideHTMLArrows={ hideHTMLArrows }
			isDragEnabled={ isDragEnabled }
			label={ label }
			max={ max }
			min={ min }
			ref={ ref }
			required={ required }
			step={ step }
			type={ typeProp }
			// @ts-expect-error TODO: Resolve discrepancy
			value={ valueProp }
			__unstableStateReducer={ ( state, action ) => {
				const baseState = numberControlStateReducer( state, action );
				return stateReducerProp?.( baseState, action ) ?? baseState;
			} }
		/>
	);
}

export const NumberControl = forwardRef( UnforwardedNumberControl );

export default NumberControl;
