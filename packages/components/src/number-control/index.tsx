/**
 * External dependencies
 */
import classNames from 'classnames';
import type { Ref } from 'react';

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
import { composeStateReducers } from '../input-control/reducer/reducer';
import { add, subtract, roundClamp } from '../utils/math';
import { isValueEmpty } from '../utils/values';
import type { Props } from './types';

// TODO: is there a "safer" version? Should we strip white space, etc?
const ensureNumber = ( n: string | number ) =>
	typeof n === 'string' ? parseFloat( n ) : n;

export function NumberControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		className,
		dragDirection = 'n',
		hideHTMLArrows = false,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max: maxProp = Infinity,
		min: minProp = -Infinity,
		required = false,
		shiftStep = 10,
		step: stepProp = 1,
		type: typeProp = 'number',
		value: valueProp,
		...props
	}: Props,
	ref: Ref< any >
) {
	const min = ensureNumber( minProp );
	const max = ensureNumber( maxProp );

	const isStepAny = stepProp === 'any';
	const baseStep = isStepAny ? 1 : ensureNumber( stepProp );
	const baseValue = roundClamp( 0, min, max, baseStep );
	const constrainValue = ( value, stepOverride ) => {
		// When step is "any" clamp the value, otherwise round and clamp it
		return isStepAny
			? Math.min( max, Math.max( min, value ) )
			: roundClamp( value, min, max, stepOverride ?? baseStep );
	};

	const autoComplete = typeProp === 'number' ? 'off' : null;
	const classes = classNames( 'components-number-control', className );

	// "Middleware" function that intercepts updates from InputControl.
	// This allows us to tap into actions to transform the (next) state for
	// `InputControl`.
	const numberControlStateReducer: Props[ '__unstableStateReducer' ] = (
		state,
		action
	) => {
		const { type, payload } = action;
		const event = payload?.event;
		const currentValue = state.value;

		/**
		 * Handles custom UP and DOWN Keyboard events
		 */
		if (
			type === inputControlActionTypes.PRESS_UP ||
			type === inputControlActionTypes.PRESS_DOWN
		) {
			const enableShift = event.shiftKey && isShiftStepEnabled;

			const incrementalValue = enableShift
				? shiftStep * baseStep
				: baseStep;
			let nextValue = isValueEmpty( currentValue )
				? baseValue
				: currentValue;

			if ( event?.preventDefault ) {
				event.preventDefault();
			}

			if ( type === inputControlActionTypes.PRESS_UP ) {
				nextValue = add( nextValue, incrementalValue );
			}

			if ( type === inputControlActionTypes.PRESS_DOWN ) {
				nextValue = subtract( nextValue, incrementalValue );
			}

			state.value = constrainValue(
				nextValue,
				enableShift ? incrementalValue : null
			);
		}

		/**
		 * Handles drag to update events
		 */
		if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
			const [ x, y ] = payload.delta;
			const enableShift = payload.shiftKey && isShiftStepEnabled;
			const modifier = enableShift ? shiftStep * baseStep : baseStep;

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

				state.value = constrainValue(
					add( currentValue, distance ),
					enableShift ? modifier : null
				);
			}
		}

		/**
		 * Handles commit (ENTER key press or on blur if isPressEnterToChange)
		 */
		if (
			type === inputControlActionTypes.PRESS_ENTER ||
			type === inputControlActionTypes.COMMIT
		) {
			const applyEmptyValue = required === false && currentValue === '';

			state.value = applyEmptyValue
				? currentValue
				: constrainValue( currentValue );
		}

		return state;
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
			step={ stepProp }
			type={ typeProp }
			value={ valueProp }
			__unstableStateReducer={ composeStateReducers(
				numberControlStateReducer,
				stateReducer
			) }
		/>
	);
}

export default forwardRef( NumberControl );
