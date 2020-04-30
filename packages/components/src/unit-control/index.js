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
import { CSS_UNITS, getParsedValue, getValidParsedUnit } from './utils';

function UnitControl(
	{
		// eslint-disable-next-line camelcase
		unstable_stateReducer: stateReducer = ( state ) => state,
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

	const classes = classnames( 'components-unit-control', className );

	const handleOnChange = ( next, changeProps ) => {
		/**
		 * Customizing the onChange callback.
		 * This allows as to broadcast a combined value+unit to onChange.
		 */
		const [ parsedValue, parsedUnit ] = getValidParsedUnit(
			next,
			units,
			value,
			unit
		);
		const nextValue = `${ parsedValue }${ parsedUnit }`;

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

		/**
		 * Customizes the submit interaction.
		 *
		 * This occurs when pressing ENTER to fire a change.
		 * By intercepting the state change, we can parse the incoming
		 * value to determine if the unit needs to be updated.
		 */
		if ( type === inputControlActionTypes.SUBMIT ) {
			const valueToParse = event?.target?.value;

			const [ parsedValue, parsedUnit ] = getValidParsedUnit(
				valueToParse,
				units,
				value,
				unit
			);

			nextState.value = parsedValue;

			// Update unit if the incoming parsed unit is different.
			if ( unit !== parsedUnit ) {
				handleOnUnitChange( parsedUnit, { event } );
			}
		}

		return nextState;
	};

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
				value={ value }
				unstable_stateReducer={ customStateReducer }
			/>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );

export default ForwardedUnitControl;
