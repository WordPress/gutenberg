// @ts-nocheck
/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useCallback } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Input } from './styles/number-control-styles';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { composeStateReducers } from '../input-control/reducer/reducer';
import { add, subtract, roundClamp } from '../utils/math';
import { isValueEmpty } from '../utils/values';

// Creates a state reducer for specialization of InputControl.
const useNumberControlStateReducer = ( props ) => {
	const {
		dragDirection,
		isDragEnabled,
		isShiftStepEnabled,
		min,
		max,
		required,
		shiftStep,
		step,
	} = props;

	return useCallback( ( state, action ) => {
		const { type, payload } = action;
		const event = state._event;
		const currentValue = state.value;

		const isStepAny = step === 'any';
		const baseStep = isStepAny ? 1 : parseFloat( step );
		const baseValue = roundClamp( 0, min, max, baseStep );

		const constrainValue = ( value, stepOverride ) => {
			// When step is "any" clamp the value, otherwise round and clamp it.
			return isStepAny
				? Math.min( max, Math.max( min, value ) )
				: roundClamp( value, min, max, stepOverride ?? baseStep );
		};

		/**
		 * Handles custom UP and DOWN Keyboard events
		 */
		if (
			type === inputControlActionTypes.PRESS_UP ||
			type === inputControlActionTypes.PRESS_DOWN
		) {
			const enableShift = event.shiftKey && isShiftStepEnabled;

			const incrementalValue = enableShift
				? parseFloat( shiftStep ) * baseStep
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
			const modifier = enableShift
				? parseFloat( shiftStep ) * baseStep
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

				state.value = constrainValue(
					add( currentValue, distance ),
					enableShift ? modifier : null
				);
			}
		}

		/**
		 * Handles ENTER key press or commits. The latter originates from blur
		 * events or ENTER key presses when isPressEnterToChange is true).
		 */
		if (
			( type === inputControlActionTypes.PRESS_ENTER &&
				! state.isPressEnterToChange ) ||
			type === inputControlActionTypes.COMMIT
		) {
			const applyEmptyValue = required === false && currentValue === '';

			state.value = applyEmptyValue
				? currentValue
				: constrainValue( currentValue );

			state.error = null;
		}

		/**
		 * Handles changes when isPressEnterToChange is false in order to skip
		 * propagation of invalid values through onChange.
		 */
		if (
			type === inputControlActionTypes.CHANGE &&
			! state.isPressEnterToChange
		) {
			// console.log('NC', event.target.value, state.value )
			const { valid } = event.target.validity;
			if ( ! valid ) {
				state.error = 'invalid';
			}
		}

		return state;
	}, Object.keys( props ) );
};

const passThrough = ( state ) => state;

export function NumberControl(
	{
		__unstableStateReducer: stateReducer = passThrough,
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
	},
	ref
) {
	const autoComplete = typeProp === 'number' ? 'off' : null;
	const classes = classNames( 'components-number-control', className );

	const numberControlStateReducer = useNumberControlStateReducer( {
		dragDirection,
		isDragEnabled,
		isShiftStepEnabled,
		min,
		max,
		required,
		shiftStep,
		step,
	} );

	const reducer = useCallback(
		composeStateReducers( numberControlStateReducer, stateReducer ),
		[ numberControlStateReducer, stateReducer ]
	);

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
			// onValidate={ onValidate }
			ref={ ref }
			required={ required }
			step={ step }
			type={ typeProp }
			value={ valueProp }
			__unstableStateReducer={ reducer }
		/>
	);
}

export default forwardRef( NumberControl );
