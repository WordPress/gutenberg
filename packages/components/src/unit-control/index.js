/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { inputControlActionTypes } from '../input-control/state';
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import {
	CSS_UNITS,
	DEFAULT_UNIT,
	getParsedValue,
	getValidParsedUnit,
} from './utils';

function UnitControl(
	{
		autoComplete = 'off',
		className,
		disabled = false,
		disableUnits = false,
		isPressEnterToChange = false,
		isResetValueOnUnitChange = false,
		isUnitSelectTabbable = false,
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
	const [ unit, setUnit ] = useState( initialUnit );

	const handleOnChange = ( next, changeProps ) => {
		const [ , parsedUnit ] = getParsedValue( next, units );
		const baseUnit = parsedUnit || unit;

		const nextValue = `${ next }${ baseUnit }`;

		onChange( nextValue, changeProps );
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

	const stateReducer = ( state, action ) => {
		const { type, payload } = action;
		const event = payload?.event;

		const nextState = { ...state };

		if ( type === inputControlActionTypes.SUBMIT ) {
			const valueToParse = event?.target?.value;

			const [ parsedValue, parsedUnit ] = getValidParsedUnit(
				valueToParse,
				units,
				value
			);

			const baseUnit = parsedUnit || unit || DEFAULT_UNIT.value;

			nextState.value = parsedValue;

			if ( unit !== baseUnit ) {
				handleOnUnitChange( baseUnit, { event } );
			}
		}

		return nextState;
	};

	const classes = classnames( 'components-unit-control', className );

	const inputSuffix = ! disableUnits ? (
		<UnitSelectControl
			className="components-unit-control__select"
			disabled={ disabled }
			isTabbable={ isUnitSelectTabbable }
			options={ units }
			onChange={ handleOnUnitChange }
			size={ size }
			value={ unit }
		/>
	) : null;

	return (
		<Root className="components-unit-control-wrapper" style={ style }>
			<ValueInput
				aria-label={ label }
				type={ isPressEnterToChange ? 'text' : 'number' }
				{ ...props }
				autoComplete={ autoComplete }
				className={ classes }
				disabled={ disabled }
				disableUnits={ disableUnits }
				isPressEnterToChange={ isPressEnterToChange }
				label={ label }
				onChange={ handleOnChange }
				ref={ ref }
				size={ size }
				suffix={ inputSuffix }
				stateReducer={ stateReducer }
				value={ value }
			/>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );

export default ForwardedUnitControl;
