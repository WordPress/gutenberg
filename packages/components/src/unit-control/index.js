/**
 * External dependencies
 */
import { noop } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import { CSS_UNITS, DEFAULT_UNIT, parseUnit, useUnitValueState } from './utils';

function UnitControl(
	{
		autoComplete = 'off',
		className,
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
	const [ valueState, setValueState ] = useUnitValueState(
		valueProp,
		unitProp
	);
	const [ value, unit ] = parseUnit( valueState, units );

	const handleOnChange = ( next, changeProps ) => {
		const { event } = changeProps;
		const inputValue = event.target.value;

		const [ parsedValue, parsedUnit ] = parseUnit( inputValue, units );

		const baseValue = next === value ? parsedValue : next;
		const baseUnit = parsedUnit || unit || DEFAULT_UNIT.value;

		const nextValue = `${ baseValue }${ baseUnit }`;

		setValueState( nextValue );
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

	const classes = classnames( 'component-unit-control', className );

	const inputSuffix = ! disableUnits ? (
		<UnitSelectControl
			className="component-unit-control__select"
			isTabbable={ isUnitSelectTabbable }
			options={ units }
			onChange={ handleOnUnitChange }
			size={ size }
			value={ unit }
		/>
	) : null;

	return (
		<Root className={ classes } ref={ ref } style={ style }>
			<ValueInput
				aria-label={ label }
				{ ...props }
				autoComplete={ autoComplete }
				className="component-unit-control__input-control"
				disableUnits={ disableUnits }
				label={ label }
				onChange={ handleOnChange }
				size={ size }
				suffix={ inputSuffix }
				type={ type }
				value={ value }
			/>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );
ForwardedUnitControl.__defaultUnits = CSS_UNITS;

export default ForwardedUnitControl;
