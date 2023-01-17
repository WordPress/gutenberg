/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ForwardedRef, KeyboardEvent, MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useRef, forwardRef } from '@wordpress/element';
import { isRTL, __ } from '@wordpress/i18n';
import { plus as plusIcon, reset as resetIcon } from '@wordpress/icons';
import { useMergeRefs } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { Input, SpinButton } from './styles/number-control-styles';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { add, subtract, roundClamp } from '../utils/math';
import {
	ensureFiniteNumber,
	ensureFiniteNumberAsString,
	isValueEmpty,
} from '../utils/values';
import type { WordPressComponentProps } from '../ui/context/wordpress-component';
import type { NumberControlProps } from './types';
import { HStack } from '../h-stack';
import { Spacer } from '../spacer';

const DEFAULT_STEP = 1;
const DEFAULT_SHIFT_STEP = 10;

function UnforwardedNumberControl(
	{
		__unstableStateReducer: stateReducerProp,
		className,
		dragDirection = 'n',
		spinControls = 'native',
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		required = false,
		shiftStep = DEFAULT_SHIFT_STEP,
		step = DEFAULT_STEP,
		type: typeProp = 'number',
		value: valueProp,
		size = 'default',
		suffix,
		onChange,

		// Deprecated
		hideHTMLArrows = false,

		// Rest
		...props
	}: WordPressComponentProps< NumberControlProps, 'input', false >,
	forwardedRef: ForwardedRef< any >
) {
	if ( hideHTMLArrows ) {
		deprecated( 'hideHTMLArrows', {
			alternative: 'spinControls="none"',
			since: '6.2',
			version: '6.3',
		} );
		spinControls = 'none';
	}

	if ( typeof valueProp === 'number' ) {
		// TODO: deprecate `value` as a `number`
	}

	const valuePropAsString =
		valueProp !== undefined
			? ensureFiniteNumberAsString( valueProp ) ?? undefined
			: undefined;
	const shiftStepAsNumber =
		ensureFiniteNumber( shiftStep ) ?? DEFAULT_SHIFT_STEP;

	const inputRef = useRef< HTMLInputElement >();
	const mergedRef = useMergeRefs( [ inputRef, forwardedRef ] );

	const isStepAny = step === 'any';
	// Base step is `1` when `step="any". Use `1` as a fallback in case
	// `step` prop couldn't be parsed to a finite number.
	const baseStep = isStepAny
		? DEFAULT_STEP
		: ensureFiniteNumber( step ) ?? DEFAULT_STEP;
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
	 * Computes the new value when the current value needs to change following a
	 * "spin" event (i.e. up or down arrow, up or down spin buttons)
	 */
	const spinValue = (
		value: number,
		direction: 'up' | 'down',
		event: KeyboardEvent | MouseEvent | undefined
	) => {
		event?.preventDefault();
		const enableShift = event?.shiftKey && isShiftStepEnabled;

		const computedStep = enableShift
			? shiftStepAsNumber * baseStep
			: baseStep;

		const nextValue =
			direction === 'up'
				? add( value, computedStep )
				: subtract( value, computedStep );

		return constrainValue(
			nextValue,
			enableShift ? computedStep : undefined
		);
	};

	/**
	 * "Middleware" function that intercepts updates from InputControl.
	 * This allows us to tap into actions to transform the (next) state for
	 * InputControl.
	 *
	 * @return The updated state to apply to InputControl
	 */
	const numberControlStateReducer: NumberControlProps[ '__unstableStateReducer' ] =
		( state, action ) => {
			const nextState = { ...state };

			const currentValue = nextState.value;

			/**
			 * Handles custom UP and DOWN Keyboard events
			 */
			if (
				action.type === inputControlActionTypes.PRESS_UP ||
				action.type === inputControlActionTypes.PRESS_DOWN
			) {
				const actionEvent = (
					action as inputControlActionTypes.KeyEventAction
				 ).payload.event;
				const valueToSpin = isValueEmpty( currentValue )
					? baseValue
					: ensureFiniteNumber( currentValue ) ?? baseValue;

				const nextValue = ensureFiniteNumberAsString(
					spinValue(
						valueToSpin,
						action.type === inputControlActionTypes.PRESS_UP
							? 'up'
							: 'down',
						actionEvent as KeyboardEvent
					)
				);

				if ( nextValue !== null ) {
					nextState.value = nextValue;
				}
			}

			/**
			 * Handles drag to update events
			 */
			if (
				action.type === inputControlActionTypes.DRAG &&
				isDragEnabled
			) {
				const dragPayload = (
					action as inputControlActionTypes.DragAction
				 ).payload;
				const [ x, y ] = dragPayload.delta;

				// `shiftKey` comes via the `useDrag` hook
				const enableShift = dragPayload.shiftKey && isShiftStepEnabled;
				const computedStep = enableShift
					? shiftStepAsNumber * baseStep
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
					const distance = delta * computedStep * directionModifier;

					const valueToConstrain = isValueEmpty( currentValue )
						? baseValue
						: ensureFiniteNumber( currentValue ) ?? baseValue;

					const nextValue = ensureFiniteNumberAsString(
						constrainValue(
							add( valueToConstrain, distance ),
							enableShift ? computedStep : undefined
						)
					);

					if ( nextValue !== null ) {
						nextState.value = nextValue;
					}
				}
			}

			/**
			 * Handles commit (ENTER key press or blur)
			 */
			if (
				action.type === inputControlActionTypes.PRESS_ENTER ||
				action.type === inputControlActionTypes.COMMIT
			) {
				const applyEmptyValue =
					currentValue === undefined ||
					( required === false && currentValue === '' );

				const nextValue = applyEmptyValue
					? ''
					: ensureFiniteNumberAsString(
							constrainValue(
								ensureFiniteNumber( currentValue ) ?? baseValue
							)
					  );

				if ( nextValue !== null ) {
					nextState.value = nextValue;
				}
			}

			return nextState;
		};

	const buildSpinButtonClickHandler =
		( direction: 'up' | 'down' ) =>
		( event: MouseEvent< HTMLButtonElement > ) => {
			if ( onChange === undefined ) {
				return;
			}

			const valueToSpin = isValueEmpty( valuePropAsString )
				? baseValue
				: ensureFiniteNumber( valuePropAsString ) ?? baseValue;

			const onChangeValue = ensureFiniteNumberAsString(
				spinValue( valueToSpin, direction, event )
			);

			if ( onChangeValue !== null ) {
				return onChange( onChangeValue, {
					// Set event.target to the <input> so that consumers can use
					// e.g. event.target.validity.
					event: {
						...event,
						target: inputRef.current!,
					},
				} );
			}
		};

	return (
		<Input
			autoComplete={ autoComplete }
			inputMode="numeric"
			{ ...props }
			className={ classes }
			dragDirection={ dragDirection }
			hideHTMLArrows={ spinControls !== 'native' }
			isDragEnabled={ isDragEnabled }
			label={ label }
			max={ max }
			min={ min }
			ref={ mergedRef }
			required={ required }
			step={ step }
			type={ typeProp }
			value={ valuePropAsString }
			__unstableStateReducer={ ( state, action ) => {
				const baseState = numberControlStateReducer( state, action );
				return stateReducerProp?.( baseState, action ) ?? baseState;
			} }
			size={ size }
			suffix={
				spinControls === 'custom' ? (
					<>
						{ suffix }
						<Spacer marginBottom={ 0 } marginRight={ 2 }>
							<HStack spacing={ 1 }>
								<SpinButton
									icon={ plusIcon }
									isSmall
									aria-hidden="true"
									aria-label={ __( 'Increment' ) }
									tabIndex={ -1 }
									onClick={ buildSpinButtonClickHandler(
										'up'
									) }
									size={ size }
								/>
								<SpinButton
									icon={ resetIcon }
									isSmall
									aria-hidden="true"
									aria-label={ __( 'Decrement' ) }
									tabIndex={ -1 }
									onClick={ buildSpinButtonClickHandler(
										'down'
									) }
									size={ size }
								/>
							</HStack>
						</Spacer>
					</>
				) : (
					suffix
				)
			}
			onChange={ onChange }
		/>
	);
}

export const NumberControl = forwardRef( UnforwardedNumberControl );

export default NumberControl;
