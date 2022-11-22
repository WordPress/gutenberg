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
import { ensureNumber, isValueEmpty } from '../utils/values';
import type { WordPressComponentProps } from '../ui/context/wordpress-component';
import type { NumberControlProps } from './types';
import { HStack } from '../h-stack';
import { Spacer } from '../spacer';
import { computeStep } from './utils';

function UnforwardedNumberControl(
	{
		__unstableStateReducer: stateReducerProp,
		className,
		dragDirection = 'n',
		hideHTMLArrows = false,
		spinControls = 'native',
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
		size = 'default',
		suffix,
		onChange,
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

	const inputRef = useRef< HTMLInputElement >();
	const mergedRef = useMergeRefs( [ inputRef, forwardedRef ] );

	const isStepAny = step === 'any';
	const baseStep = isStepAny ? 1 : ensureNumber( step );
	const baseValue = roundClamp( 0, min, max, baseStep );
	const constrainValue = (
		value: number | string,
		stepOverride?: number
	) => {
		// When step is "any" clamp the value, otherwise round and clamp it.
		return isStepAny
			? Math.min( max, Math.max( min, ensureNumber( value ) ) )
			: roundClamp( value, min, max, stepOverride ?? baseStep );
	};

	const autoComplete = typeProp === 'number' ? 'off' : undefined;
	const classes = classNames( 'components-number-control', className );

	const spinValue = (
		value: string | number | undefined,
		direction: 'up' | 'down',
		event: KeyboardEvent | MouseEvent | undefined
	) => {
		event?.preventDefault();
		const enableShift = event?.shiftKey && isShiftStepEnabled;
		const computedStep = computeStep( {
			shiftStep: ensureNumber( shiftStep ),
			enableShift,
			baseStep,
		} );
		let nextValue = isValueEmpty( value ) ? baseValue : value;
		if ( direction === 'up' ) {
			nextValue = add( nextValue, computedStep );
		} else if ( direction === 'down' ) {
			nextValue = subtract( nextValue, computedStep );
		}
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
				// @ts-expect-error TODO: Resolve discrepancy between `value` types in InputControl based components
				nextState.value = spinValue(
					currentValue,
					action.type === inputControlActionTypes.PRESS_UP
						? 'up'
						: 'down',
					actionEvent as KeyboardEvent | undefined
				);
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

				// `shiftKey` comes via the `useDrqg` hook
				const enableShift = dragPayload.shiftKey && isShiftStepEnabled;
				const computedStep = computeStep( {
					shiftStep: ensureNumber( shiftStep ),
					enableShift,
					baseStep,
				} );

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

					// @ts-expect-error TODO: Resolve discrepancy between `value` types in InputControl based components
					nextState.value = constrainValue(
						// @ts-expect-error TODO: Investigate if it's ok for currentValue to be undefined
						add( currentValue, distance ),
						enableShift ? computedStep : undefined
					);
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
					required === false && currentValue === '';

				// @ts-expect-error TODO: Resolve discrepancy between `value` types in InputControl based components
				nextState.value = applyEmptyValue
					? currentValue
					: // @ts-expect-error TODO: Investigate if it's ok for currentValue to be undefined
					  constrainValue( currentValue );
			}

			return nextState;
		};

	const buildSpinButtonClickHandler =
		( direction: 'up' | 'down' ) =>
		( event: MouseEvent< HTMLButtonElement > ) =>
			onChange?.( String( spinValue( valueProp, direction, event ) ), {
				// Set event.target to the <input> so that consumers can use
				// e.g. event.target.validity.
				event: {
					...event,
					target: inputRef.current!,
				},
			} );

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
			// @ts-expect-error TODO: Resolve discrepancy between `value` types in InputControl based components
			value={ valueProp }
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
