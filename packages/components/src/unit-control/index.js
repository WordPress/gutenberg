/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { ENTER } from '@wordpress/keycodes';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import {
	CSS_UNITS,
	DEFAULT_UNIT,
	getParsedValue,
	getValidParsedUnit,
	parseUnit,
} from './utils';

function UnitControl(
	{
		autoComplete = 'off',
		className,
		disabled = false,
		disableUnits = false,
		isResetValueOnUnitChange = false,
		isUnitSelectTabbable = false,
		label,
		onChange = noop,
		onUnitChange = noop,
		size = 'default',
		style,
		type = 'text',
		unit: unitProp,
		units = CSS_UNITS,
		value: valueProp,
		...props
	},
	ref
) {
	const [ value, unit ] = getParsedValue( valueProp, unitProp, units );

	const handleOnChange = ( next, changeProps ) => {
		const { event } = changeProps;
		const isEnterPress = event?.keyCode === ENTER;

		const valueToParse = isEnterPress ? event.target.value : next;

		/**
		 * Extracts the parsed value on any type of change.
		 */
		const [ parsedValue ] = getValidParsedUnit(
			valueToParse,
			units,
			value
		);
		// Unit parsing is only required for ENTER press onChange.
		const [ , parsedUnit ] = parseUnit( event.target.value, units );

		const baseUnit = parsedUnit || unit || DEFAULT_UNIT.value;

		const nextValue = `${ parsedValue }${ baseUnit }`;

		onChange( nextValue, changeProps );

		if ( unit !== baseUnit ) {
			onUnitChange( baseUnit, changeProps );
		}
	};

	const handleOnUnitChange = ( next, changeProps ) => {
		const { data } = changeProps;

		let nextValue = `${ value }${ next }`;

		if ( isResetValueOnUnitChange && data.default !== undefined ) {
			nextValue = `${ data.default }${ next }`;
		}

		onChange( nextValue, changeProps );
		onUnitChange( next, changeProps );
	};

	/**
	 * Validates and transforms content onChange.
	 * If the next value isn't a valid value, it will reset to the previous
	 * value from props.
	 *
	 * @param {any} next
	 */
	const handleTransformValueOnChange = ( next ) => {
		const [ parsedValue ] = getValidParsedUnit( next, units, value );

		return parsedValue;
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
				{ ...props }
				autoComplete={ autoComplete }
				className={ classes }
				disabled={ disabled }
				disableUnits={ disableUnits }
				label={ label }
				onChange={ handleOnChange }
				ref={ ref }
				size={ size }
				suffix={ inputSuffix }
				transformValueOnChange={ handleTransformValueOnChange }
				type={ type }
				value={ value }
			/>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );

export default ForwardedUnitControl;
