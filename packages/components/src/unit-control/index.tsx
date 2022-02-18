/**
 * External dependencies
 */
import type {
	FocusEventHandler,
	KeyboardEvent,
	Ref,
	SyntheticEvent,
} from 'react';
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
import type { WordPressComponentProps } from '../ui/context';
import * as inputControlActionTypes from '../input-control/reducer/actions';
import { composeStateReducers } from '../input-control/reducer/reducer';
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import {
	CSS_UNITS,
	getParsedValue,
	getUnitsWithCurrentUnit,
	getValidParsedUnit,
} from './utils';
import { useControlledState } from '../utils/hooks';
import type { UnitControlProps, UnitControlOnChangeCallback } from './types';
import type { StateReducer } from '../input-control/reducer/state';

const ensureString = ( s: string | number ) =>
	typeof s === 'string' ? s : `${ s }`;

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
		units: unitsProp = CSS_UNITS,
		value: valueProp,
		...props
	}: WordPressComponentProps< UnitControlProps, 'input', false >,
	forwardedRef: Ref< any >
) {
	const units = useMemo(
		() => getUnitsWithCurrentUnit( valueProp, unitProp, unitsProp ),
		[ valueProp, unitProp, unitsProp ]
	);
	const [ value, initialUnit ] = getParsedValue( valueProp, unitProp, units );
	const [ unit, setUnit ] = useControlledState< string | undefined >(
		unitProp,
		{
			initial: initialUnit,
			fallback: '',
		}
	);

	// Stores parsed value for hand-off in state reducer
	const refParsedValue = useRef< string | null >( null );

	const classes = classnames( 'components-unit-control', className );

	const handleOnChange: UnitControlOnChangeCallback = (
		next,
		changeProps
	) => {
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

	const handleOnUnitChange: UnitControlOnChangeCallback = (
		next,
		changeProps
	) => {
		const { data } = changeProps;

		let nextValue = `${ value }${ next }`;

		if ( isResetValueOnUnitChange && data?.default !== undefined ) {
			nextValue = `${ data.default }${ next }`;
		}

		onChange( nextValue, changeProps );
		onUnitChange( next, changeProps );

		setUnit( next );
	};

	const mayUpdateUnit = ( event: SyntheticEvent< HTMLInputElement > ) => {
		if ( ! isNaN( Number( event.currentTarget.value ) ) ) {
			refParsedValue.current = null;
			return;
		}
		const [ parsedValue, parsedUnit ] = getValidParsedUnit(
			event.currentTarget.value,
			units,
			value,
			unit
		);

		refParsedValue.current = parsedValue.toString();

		if ( isPressEnterToChange && parsedUnit !== unit ) {
			const data = Array.isArray( units )
				? units.find( ( option ) => option.value === parsedUnit )
				: undefined;
			const changeProps = { event, data };

			onChange( `${ parsedValue }${ parsedUnit }`, changeProps );
			onUnitChange( parsedUnit, changeProps );

			setUnit( parsedUnit );
		}
	};

	const handleOnBlur: FocusEventHandler< HTMLInputElement > = mayUpdateUnit;

	const handleOnKeyDown = ( event: KeyboardEvent< HTMLInputElement > ) => {
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
	 * @param  state  State from InputControl
	 * @param  action Action triggering state change
	 * @return The updated state to apply to InputControl
	 */
	const unitControlStateReducer: StateReducer = ( state, action ) => {
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
			isUnitSelectTabbable={ isUnitSelectTabbable }
			onChange={ handleOnUnitChange }
			size={ size }
			unit={ unit }
			units={ units }
		/>
	) : null;

	let step = props.step;

	/*
	 * If no step prop has been passed, lookup the active unit and
	 * try to get step from `units`, or default to a value of `1`
	 */
	if ( ! step && units ) {
		const activeUnit = units.find( ( option ) => option.value === unit );
		step = activeUnit?.step ?? 1;
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
				ref={ forwardedRef }
				size={ size }
				suffix={ inputSuffix }
				value={ ensureString( value ) }
				step={ step }
				__unstableStateReducer={ composeStateReducers(
					unitControlStateReducer,
					stateReducer
				) }
			/>
		</Root>
	);
}

/**
 * `UnitControl` allows the user to set a value as well as a unit (e.g. `px`).
 *
 *
 * @example
 * ```jsx
 * import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const Example = () => {
 *   const [ value, setValue ] = useState( '10px' );
 *
 *   return <UnitControl onChange={ setValue } value={ value } />;
 * };
 * ```
 */
const ForwardedUnitControl = forwardRef( UnitControl );

export { parseUnit, useCustomUnits } from './utils';
export default ForwardedUnitControl;
