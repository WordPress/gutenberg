/**
 * External dependencies
 */
import { noop, omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ENTER } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import {
	inputControlActionTypes,
	composeStateReducers,
} from '../input-control/state';
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import { CSS_UNITS, getParsedValue, getValidParsedUnit } from './utils';
import { useControlledState } from '../utils/hooks';
import { getNumber, getPrecision } from '../utils/math';

function UnitControl(
	{
		__unstableStateReducer: stateReducer = ( state ) => state,
		autoComplete = 'off',
		className,
		disabled = false,
		disableUnits = false,
		isPressEnterToChange = false,
		isResetValueOnUnitChange = false,
		isUnitSelectTabbable = true,
		label,
		onChange = noop,
		onUnitChange = noop,
		size = 'default',
		style,
		unit: unitProp,
		units = CSS_UNITS,
		value: valueProp,
		...props
	},
	ref
) {
	const [ value, initialUnit ] = getParsedValue( valueProp, unitProp, units );
	const [ unit, setUnit ] = useControlledState( unitProp, {
		initial: initialUnit,
	} );

	const activeUnit = useMemo(
		() => units.find( ( option ) => option.value === unit ),
		[ unit, units ]
	);

	// Stores parsed value for hand-off in state reducer
	const refParsedValue = useRef( null );

	// Stores custom step value for hand-off in state reducer
	const refCustomStep = useRef( null );

	const classes = classnames( 'components-unit-control', className );

	const handleOnChange = ( next, changeProps ) => {
		if ( next === '' ) {
			onChange( '', changeProps );
			return;
		}

		/*
		 * Customizing the onChange callback.
		 * This allows as to broadcast a combined value+unit to onChange.
		 */
		next = getValidParsedUnit( next, units, value, unit ).join( '' );

		onChange( next, changeProps );
	};

	const handleOnUnitChange = ( next, changeProps ) => {
		const { data } = changeProps;

		let nextValue = `${ value }${ next }`;

		if ( isResetValueOnUnitChange && data?.default !== undefined ) {
			nextValue = `${ data.default }${ next }`;
		}

		onChange( nextValue, changeProps );
		onUnitChange( next, changeProps );

		setUnit( next );
	};

	const mayUpdateUnit = ( event ) => {
		if ( ! isNaN( event.target.value ) ) {
			refParsedValue.current = null;
			return;
		}
		const [ parsedValue, parsedUnit ] = getValidParsedUnit(
			event.target.value,
			units,
			value,
			unit
		);

		refParsedValue.current = parsedValue;

		if ( isPressEnterToChange && parsedUnit !== unit ) {
			const data = units.find(
				( option ) => option.value === parsedUnit
			);
			const changeProps = { event, data };

			onChange( `${ parsedValue }${ parsedUnit }`, changeProps );
			onUnitChange( parsedUnit, changeProps );

			setUnit( parsedUnit );
		}
	};

	const handleOnBlur = mayUpdateUnit;

	const handleOnKeyDown = ( event ) => {
		const { keyCode } = event;
		if ( keyCode === ENTER ) {
			mayUpdateUnit( event );
		}
	};

	/**
	 * "Middleware" function that intercepts updates from InputControl.
	 * This allows us to tap into actions to transform the (next) state for
	 * InputControl.
	 *
	 * @param {Object} state  State from InputControl
	 * @param {Object} action Action triggering state change
	 * @return {Object} The updated state to apply to InputControl
	 */
	const unitControlStateReducer = ( state, action ) => {
		const realValue = action?.payload?.value;
		if ( realValue ) {
			const originalStep = props.step ?? activeUnit?.step ?? 1;

			const currentStepPrecision = getPrecision(
				getNumber( originalStep )
			);
			const realValuePrecision = getPrecision( getNumber( realValue ) );
			const customStepPrecision = getPrecision(
				getNumber( refCustomStep.current )
			);

			if (
				realValuePrecision > 0 &&
				realValuePrecision > currentStepPrecision &&
				realValuePrecision > customStepPrecision
			) {
				const zeros = '0'.repeat(
					Math.min( realValuePrecision - 1, 4 )
				);
				refCustomStep.current = getNumber( `0.${ zeros }1` );
			} else if ( realValuePrecision < customStepPrecision ) {
				refCustomStep.current = null;
			}
		}

		/*
		 * On commits (when pressing ENTER and on blur if
		 * isPressEnterToChange is true), if a parse has been performed
		 * then use that result to update the state.
		 */
		if ( action.type === inputControlActionTypes.COMMIT ) {
			if ( refParsedValue.current !== null ) {
				state.value = refParsedValue.current;
				refParsedValue.current = null;
			}
		}

		return state;
	};

	const inputSuffix = ! disableUnits ? (
		<UnitSelectControl
			aria-label={ __( 'Select unit' ) }
			disabled={ disabled }
			isTabbable={ isUnitSelectTabbable }
			options={ units }
			onChange={ handleOnUnitChange }
			size={ size }
			value={ unit }
		/>
	) : null;

	let step = props.step;

	/*
	 * If no step prop has been passed, lookup the active unit and
	 * try to get step from `units`, or default to a value of `1`
	 */
	if ( ! step && units ) {
		step = activeUnit?.step ?? 1;
	}

	// If a more specific custom step value is being used, use that instead.
	if ( refCustomStep.current && refCustomStep.current < step ) {
		step = refCustomStep.current;
	}

	return (
		<Root className="components-unit-control-wrapper" style={ style }>
			<ValueInput
				aria-label={ label }
				type={ isPressEnterToChange ? 'text' : 'number' }
				{ ...omit( props, [ 'children' ] ) }
				autoComplete={ autoComplete }
				className={ classes }
				disabled={ disabled }
				disableUnits={ disableUnits }
				isPressEnterToChange={ isPressEnterToChange }
				label={ label }
				onBlur={ handleOnBlur }
				onKeyDown={ handleOnKeyDown }
				onChange={ handleOnChange }
				ref={ ref }
				size={ size }
				suffix={ inputSuffix }
				value={ value }
				step={ step }
				__unstableStateReducer={ composeStateReducers(
					unitControlStateReducer,
					stateReducer
				) }
			/>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );

export { parseUnit, useCustomUnits } from './utils';
export default ForwardedUnitControl;
