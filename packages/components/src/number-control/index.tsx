/**
 * External dependencies
 */
import clsx from 'clsx';
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
import { Input, SpinButton, styles } from './styles/number-control-styles';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { add, subtract, clamp, ensureValidStep } from '../utils/math';
import { ensureNumber, isValueEmpty } from '../utils/values';
import type { WordPressComponentProps } from '../context/wordpress-component';
import type { NumberControlProps } from './types';
import { HStack } from '../h-stack';
import { Spacer } from '../spacer';
import { useCx } from '../utils';
import { useDeprecated36pxDefaultSizeProp } from '../utils/use-deprecated-props';
import { maybeWarnDeprecated36pxSize } from '../utils/deprecated-36px-size';

const noop = () => {};

function UnforwardedNumberControl(
	props: WordPressComponentProps< NumberControlProps, 'input', false >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		__unstableStateReducer: stateReducerProp,
		className,
		dragDirection = 'n',
		hideHTMLArrows = false,
		spinControls = hideHTMLArrows ? 'none' : 'native',
		isDragEnabled = true,
		isShiftStepEnabled = true,
		label,
		max = Infinity,
		min = -Infinity,
		required = false,
		shiftStep = 10,
		step = 1,
		spinFactor = 1,
		type: typeProp = 'number',
		value: valueProp,
		size = 'default',
		suffix,
		onChange = noop,
		__shouldNotWarnDeprecated36pxSize,
		...restProps
	} = useDeprecated36pxDefaultSizeProp< NumberControlProps >( props );

	maybeWarnDeprecated36pxSize( {
		componentName: 'NumberControl',
		size,
		__next40pxDefaultSize: restProps.__next40pxDefaultSize,
		__shouldNotWarnDeprecated36pxSize,
	} );

	if ( hideHTMLArrows ) {
		deprecated( 'wp.components.NumberControl hideHTMLArrows prop ', {
			alternative: 'spinControls="none"',
			since: '6.2',
			version: '6.3',
		} );
	}
	const inputRef = useRef< HTMLInputElement >();
	const mergedRef = useMergeRefs( [ inputRef, forwardedRef ] );

	const isStepAny = step === 'any';
	const baseStep = isStepAny ? 1 : ensureNumber( step );
	const baseSpin = ensureNumber( spinFactor ) * baseStep;
	const constrainValue = (
		value: number | string,
		stepOverride?: number
	) => {
		// When step is not "any" the value must be a valid step.
		if ( ! isStepAny ) {
			value = ensureValidStep( value, min, stepOverride ?? baseStep );
		}

		return `${ clamp( value, min, max ) }`;
	};
	const baseValue = constrainValue( 0 );

	const autoComplete = typeProp === 'number' ? 'off' : undefined;
	const classes = clsx( 'components-number-control', className );
	const cx = useCx();
	const spinButtonClasses = cx( size === 'small' && styles.smallSpinButtons );

	const spinValue = (
		value: string | number | undefined,
		direction: 'up' | 'down',
		event: KeyboardEvent | MouseEvent | undefined
	) => {
		event?.preventDefault();
		const shift = event?.shiftKey && isShiftStepEnabled;
		const delta = shift ? ensureNumber( shiftStep ) * baseSpin : baseSpin;
		let nextValue = isValueEmpty( value ) ? baseValue : value;
		if ( direction === 'up' ) {
			nextValue = add( nextValue, delta );
		} else if ( direction === 'down' ) {
			nextValue = subtract( nextValue, delta );
		}
		return constrainValue( nextValue, shift ? delta : undefined );
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
				nextState.value = spinValue(
					currentValue,
					type === inputControlActionTypes.PRESS_UP ? 'up' : 'down',
					event as KeyboardEvent | undefined
				);
			}

			/**
			 * Handles drag to update events
			 */
			if ( type === inputControlActionTypes.DRAG && isDragEnabled ) {
				const [ x, y ] = payload.delta;
				const enableShift = payload.shiftKey && isShiftStepEnabled;
				const modifier = enableShift
					? ensureNumber( shiftStep ) * baseSpin
					: baseSpin;

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
			onChange( String( spinValue( valueProp, direction, event ) ), {
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
			{ ...restProps }
			className={ classes }
			dragDirection={ dragDirection }
			hideHTMLArrows={ spinControls !== 'native' }
			isDragEnabled={ isDragEnabled }
			label={ label }
			max={ max === Infinity ? undefined : max }
			min={ min === -Infinity ? undefined : min }
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
			__shouldNotWarnDeprecated36pxSize
			suffix={
				spinControls === 'custom' ? (
					<>
						{ suffix }
						<Spacer marginBottom={ 0 } marginRight={ 2 }>
							<HStack spacing={ 1 }>
								<SpinButton
									className={ spinButtonClasses }
									icon={ plusIcon }
									size="small"
									label={ __( 'Increment' ) }
									onClick={ buildSpinButtonClickHandler(
										'up'
									) }
								/>
								<SpinButton
									className={ spinButtonClasses }
									icon={ resetIcon }
									size="small"
									label={ __( 'Decrement' ) }
									onClick={ buildSpinButtonClickHandler(
										'down'
									) }
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
