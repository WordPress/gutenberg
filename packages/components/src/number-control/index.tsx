/**
 * External dependencies
 */
import classNames from 'classnames';
import type { ForwardedRef, ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { plus as plusIcon, reset as resetIcon } from '@wordpress/icons';

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

const noop = () => {};

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
		size = 'default',
		onChange = noop,
		...props
	}: WordPressComponentProps< NumberControlProps, 'input', false >,
	ref: ForwardedRef< any >
) {
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

			const { type, payload } = action;
			const event = payload.event;
			const currentValue = nextState.value;

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
					? ensureNumber( shiftStep ) * baseStep
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

				// @ts-expect-error TODO: Resolve discrepancy between `value` types in InputControl based components
				nextState.value = constrainValue(
					nextValue,
					enableShift ? incrementalValue : undefined
				);
			}

			/**
			 * Handles drag to update events
			 */
			if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
				// @ts-expect-error TODO: See if reducer actions can be typed better
				const [ x, y ] = payload.delta;
				// @ts-expect-error TODO: See if reducer actions can be typed better
				const enableShift = payload.shiftKey && isShiftStepEnabled;
				const modifier = enableShift
					? ensureNumber( shiftStep ) * baseStep
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

					// @ts-expect-error TODO: Resolve discrepancy between `value` types in InputControl based components
					nextState.value = constrainValue(
						// @ts-expect-error TODO: Investigate if it's ok for currentValue to be undefined
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

	return (
		<Input
			autoComplete={ autoComplete }
			inputMode="numeric"
			{ ...props }
			className={ classes }
			dragDirection={ dragDirection }
			hideHTMLArrows={ size === '__unstable-large' || hideHTMLArrows }
			isDragEnabled={ isDragEnabled }
			label={ label }
			max={ max }
			min={ min }
			ref={ ref }
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
				size === '__unstable-large' &&
				! hideHTMLArrows && (
					<Spacer marginBottom={ 0 } marginRight={ 2 }>
						<HStack spacing={ 1 }>
							<SpinButton
								icon={ plusIcon }
								isSmall
								aria-hidden="true"
								onClick={ (
									event: ChangeEvent< HTMLInputElement >
								) => {
									const currentValue = isValueEmpty(
										valueProp
									)
										? baseValue
										: valueProp;
									const nextValue = constrainValue(
										add( currentValue, baseStep )
									);
									onChange?.( String( nextValue ), {
										event,
									} );
								} }
							/>
							<SpinButton
								icon={ resetIcon }
								isSmall
								aria-hidden="true"
								onClick={ (
									event: ChangeEvent< HTMLInputElement >
								) => {
									const currentValue = isValueEmpty(
										valueProp
									)
										? baseValue
										: valueProp;
									const nextValue = constrainValue(
										subtract( currentValue, baseStep )
									);
									onChange?.( String( nextValue ), {
										event,
									} );
								} }
							/>
						</HStack>
					</Spacer>
				)
			}
			onChange={ onChange }
		/>
	);
}

export const NumberControl = forwardRef( UnforwardedNumberControl );

export default NumberControl;
