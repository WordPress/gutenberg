/**
 * External dependencies
 */
import { clamp } from 'lodash';
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Input } from './styles/number-control-styles';
import { add, getValue, roundClamp, subtract } from './utils';
import { isValueEmpty } from '../input-control/utils';
import { inputControlActionTypes } from '../input-control/state';
import { useRtl } from '../utils/style-mixins';

export function NumberControl(
	{
		// eslint-disable-next-line camelcase
		unstable_stateReducer: stateReducer = ( state ) => state,
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
		type: typeProp = 'number',
		value: valueProp,
		...props
	},
	ref
) {
	const initialValue = getValue( valueProp, min, max );
	const baseValue = clamp( 0, min, max );
	const isRtl = useRtl();

	const autoComplete = typeProp === 'number' ? 'off' : null;
	const classes = classNames( 'components-number-control', className );

	/**
	 * "Middleware" function that intercepts updates from InputControl.
	 * This allows us to tap into actions to transform the (next) state for
	 * InputControl.
	 *
	 * @param {Object} state State from InputControl
	 * @param {Object} action Action triggering state change
	 * @return {Object} The updated state to apply to InputControl
	 */
	const customStateReducer = ( state, action ) => {
		const { type, payload } = action;
		const event = payload?.event;

		const nextState = stateReducer( state, action );
		const currentValue = nextState.value;

		/**
		 * Handles custom UP and DOWN Keyboard events
		 */
		if (
			type === inputControlActionTypes.PRESS_UP ||
			type === inputControlActionTypes.PRESS_DOWN
		) {
			const enableShift = event.shiftKey && isShiftStepEnabled;

			const incrementalValue = enableShift
				? parseFloat( shiftStep )
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

			nextState.value = nextValue;
		}

		/**
		 * Handles drag to update events
		 */
		if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
			const { delta, shiftKey } = payload;
			const [ x, y ] = delta;
			const modifier = shiftKey ? shiftStep : 1;

			let directionModifier;
			let directionBaseValue;

			switch ( dragDirection ) {
				case 'n':
					directionBaseValue = y;
					directionModifier = -1;
					break;

				case 'e':
					directionBaseValue = x;
					directionModifier = isRtl ? -1 : 1;
					break;

				case 's':
					directionBaseValue = y;
					directionModifier = 1;
					break;

				case 'w':
					directionBaseValue = x;
					directionModifier = isRtl ? 1 : -1;
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

				nextState.value = nextValue;
			}
		}

		/**
		 * Handles ENTER key press and submit
		 */
		if (
			type === inputControlActionTypes.PRESS_ENTER ||
			type === inputControlActionTypes.SUBMIT
		) {
			nextState.value = roundClamp( currentValue, min, max );
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
			ref={ ref }
			type={ typeProp }
			value={ initialValue }
			unstable_stateReducer={ customStateReducer }
		/>
	);
}

export default forwardRef( NumberControl );
