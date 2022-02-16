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

const ensureString = ( s: string | number ) =>
	typeof s === 'string' ? s : `${ s }`;

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
		shiftStep: shiftStepProp = 10,
		step: stepProp = 1,
		type: typeProp = 'number',
		value: valueProp,
		onChange: onChangeProp,
		...props
	}: Props,
	ref: Ref< any >
) {
	const min = ensureNumber( minProp );
	const max = ensureNumber( maxProp );
	const shiftStep = ensureNumber( shiftStepProp );

	const isStepAny = stepProp === 'any';
	const baseStep = isStepAny ? 1 : ensureNumber( stepProp );
	const baseValue = roundClamp( 0, min, max, baseStep );
	const constrainValue = ( value: number, stepOverride?: number ) => {
		// When step is "any" clamp the value, otherwise round and clamp it
		return isStepAny
			? Math.min( max, Math.max( min, value ) )
			: roundClamp( value, min, max, stepOverride ?? baseStep );
	};

	const autoComplete = typeProp === 'number' ? 'off' : undefined;
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
			const enableShift =
				( event as KeyboardEvent | undefined )?.shiftKey &&
				isShiftStepEnabled;

			const incrementalValue = enableShift
				? shiftStep * baseStep
				: baseStep;
			let nextValue = isValueEmpty( currentValue )
				? baseValue
				: ensureNumber( ( currentValue as unknown ) as string );

			if ( event?.preventDefault ) {
				event.preventDefault();
			}

			if ( type === inputControlActionTypes.PRESS_UP ) {
				nextValue = add( nextValue, incrementalValue );
			}

			if ( type === inputControlActionTypes.PRESS_DOWN ) {
				nextValue = subtract( nextValue, incrementalValue );
			}

			state.value = ensureString(
				constrainValue(
					nextValue,
					enableShift ? incrementalValue : undefined
				)
			);
		}

		/**
		 * Handles drag to update events
		 */
		if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
			// @ts-ignore
			const [ x, y ] = payload.delta;
			// @ts-ignore
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

				state.value = ensureString(
					constrainValue(
						add( currentValue ?? 0, distance ),
						enableShift ? modifier : undefined
					)
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
				: ensureString(
						constrainValue( ensureNumber( currentValue ?? 0 ) )
				  );
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
			value={
				typeof valueProp !== 'undefined'
					? ensureString( valueProp )
					: undefined
			}
			__unstableStateReducer={ composeStateReducers(
				numberControlStateReducer,
				stateReducer
			) }
			onChange={ ( nextValue, extra ) => {
				let v;

				if ( typeof nextValue !== 'undefined' ) {
					v = ensureNumber( nextValue );
				}

				onChangeProp?.( v, extra );
			} }
		/>
	);
}

export default forwardRef( NumberControl );
