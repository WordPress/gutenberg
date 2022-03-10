/**
 * External dependencies
 */
import type {
	FocusEventHandler,
	KeyboardEvent,
	ForwardedRef,
	SyntheticEvent,
	ChangeEvent,
} from 'react';
import { noop, omit } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef, useMemo, useRef, useEffect } from '@wordpress/element';
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
	getParsedQuantityAndUnit,
	getUnitsWithCurrentUnit,
	getValidParsedQuantityAndUnit,
} from './utils';
import { useControlledState } from '../utils/hooks';
import type { UnitControlProps, UnitControlOnChangeCallback } from './types';
import type { StateReducer } from '../input-control/reducer/state';

function UnforwardedUnitControl(
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
	forwardedRef: ForwardedRef< any >
) {
	// The `value` prop, in theory, should not be `null`, but the following line
	// ensures it fallback to `undefined` in case a consumer of `UnitControl`
	// still passes `null` as a `value`.
	const nonNullValueProp = valueProp ?? undefined;
	const units = useMemo(
		() => getUnitsWithCurrentUnit( nonNullValueProp, unitProp, unitsProp ),
		[ nonNullValueProp, unitProp, unitsProp ]
	);
	const [ parsedQuantity, parsedUnit ] = getParsedQuantityAndUnit(
		nonNullValueProp,
		unitProp,
		units
	);

	const [ unit, setUnit ] = useControlledState< string | undefined >(
		unitProp,
		{
			initial: parsedUnit,
			fallback: '',
		}
	);

	useEffect( () => {
		setUnit( parsedUnit );
	}, [ parsedUnit ] );

	// Stores parsed value for hand-off in state reducer.
	const refParsedQuantity = useRef< number | undefined >( undefined );

	const classes = classnames( 'components-unit-control', className );

	const handleOnQuantityChange = (
		nextQuantityValue: number | string | undefined,
		changeProps: { event: ChangeEvent< HTMLInputElement > }
	) => {
		if (
			nextQuantityValue === '' ||
			typeof nextQuantityValue === 'undefined' ||
			nextQuantityValue === null
		) {
			onChange( '', changeProps );
			return;
		}

		/*
		 * Customizing the onChange callback.
		 * This allows as to broadcast a combined value+unit to onChange.
		 */
		const onChangeValue = getValidParsedQuantityAndUnit(
			nextQuantityValue,
			units,
			parsedQuantity,
			unit
		).join( '' );

		onChange( onChangeValue, changeProps );
	};

	const handleOnUnitChange: UnitControlOnChangeCallback = (
		nextUnitValue,
		changeProps
	) => {
		const { data } = changeProps;

		let nextValue = `${ parsedQuantity ?? '' }${ nextUnitValue }`;

		if ( isResetValueOnUnitChange && data?.default !== undefined ) {
			nextValue = `${ data.default }${ nextUnitValue }`;
		}

		onChange( nextValue, changeProps );
		onUnitChange( nextUnitValue, changeProps );

		setUnit( nextUnitValue );
	};

	const mayUpdateUnit = ( event: SyntheticEvent< HTMLInputElement > ) => {
		if ( ! isNaN( Number( event.currentTarget.value ) ) ) {
			refParsedQuantity.current = undefined;
			return;
		}
		const [
			validParsedQuantity,
			validParsedUnit,
		] = getValidParsedQuantityAndUnit(
			event.currentTarget.value,
			units,
			parsedQuantity,
			unit
		);

		refParsedQuantity.current = validParsedQuantity;

		if ( isPressEnterToChange && validParsedUnit !== unit ) {
			const data = Array.isArray( units )
				? units.find( ( option ) => option.value === validParsedUnit )
				: undefined;
			const changeProps = { event, data };

			onChange(
				`${ validParsedQuantity ?? '' }${ validParsedUnit }`,
				changeProps
			);
			onUnitChange( validParsedUnit, changeProps );

			setUnit( validParsedUnit );
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
			if ( refParsedQuantity.current !== undefined ) {
				state.value = ( refParsedQuantity.current ?? '' ).toString();
				refParsedQuantity.current = undefined;
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
				onChange={ handleOnQuantityChange }
				ref={ forwardedRef }
				size={ size }
				suffix={ inputSuffix }
				value={ parsedQuantity ?? '' }
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
 * `UnitControl` allows the user to set a numeric quantity as well as a unit (e.g. `px`).
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
export const UnitControl = forwardRef( UnforwardedUnitControl );

export { parseQuantityAndUnitFromRawValue, useCustomUnits } from './utils';
export default UnitControl;
