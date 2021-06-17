/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Input } from './styles/number-control-styles';
import {
	inputControlActionTypes,
	composeStateReducers,
} from '../input-control/state';
import { add, decimalClamp, roundClamp, subtract } from '../utils/math';
import { useJumpStep } from '../utils/hooks';
import { isValueEmpty } from '../utils/values';

export function NumberControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		className,
		dragDirection = 'n',
		hideHTMLArrows = false,
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		shiftStep = 10,
		step = 1,
		allowDecimal = false,
		type: typeProp = 'number',
		value: valueProp,
		...props
	},
	ref
) {
	const baseValue = roundClamp( 0, min, max, step );

	const jumpStep = useJumpStep( {
		step,
		shiftStep,
		isShiftStepEnabled,
	} );

	const autoComplete = typeProp === 'number' ? 'off' : null;
	const classes = classNames( 'components-number-control', className );

	/**
	 * "Middleware" function that intercepts updates from InputControl.
	 * This allows us to tap into actions to transform the (next) state for
	 * InputControl.
	 *
	 * @param {Object} state  State from InputControl
	 * @param {Object} action Action triggering state change
	 * @return {Object} The updated state to apply to InputControl
	 */
	const numberControlStateReducer = ( state, action ) => {
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
				? parseFloat( shiftStep ) * parseFloat( step )
				: parseFloat( step );
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

			nextValue = roundClamp( nextValue, min, max, incrementalValue );

			state.value = nextValue;
		}

		/**
		 * Handles drag to update events
		 */
		if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
			const { delta, shiftKey } = payload;
			const [ x, y ] = delta;
			const modifier = shiftKey
				? parseFloat( shiftStep ) * parseFloat( step )
				: parseFloat( step );

			let directionModifier;
			let directionBaseValue;

			switch ( dragDirection ) {
				case 'n':
					directionBaseValue = y;
					directionModifier = -1;
					break;

				case 'e':
					directionBaseValue = x;
					directionModifier = isRTL() ? -1 : 1;
					break;

				case 's':
					directionBaseValue = y;
					directionModifier = 1;
					break;

				case 'w':
					directionBaseValue = x;
					directionModifier = isRTL() ? 1 : -1;
					break;
			}

			const distance = directionBaseValue * modifier * directionModifier;
			let nextValue;

			if ( distance !== 0 ) {
				nextValue = roundClamp(
					add( currentValue, distance ),
					min,
					max,
					modifier
				);

				state.value = nextValue;
			}
		}

		/**
		 * Handles commit (ENTER key press or on blur if isPressEnterToChange)
		 */
		if (
			type === inputControlActionTypes.PRESS_ENTER ||
			type === inputControlActionTypes.COMMIT
		) {
			if ( allowDecimal ) {
				state.value = decimalClamp( currentValue, min, max, 5 );
			} else {
				state.value = roundClamp( currentValue, min, max );
			}
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
			step={ jumpStep }
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
