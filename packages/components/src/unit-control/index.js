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
import { CSS_UNITS, parseUnit } from './utils';
import { useValueState } from '../input-control/utils';

function UnitControl(
	{
		className,
		disableUnits = false,
		isResetValueOnUnitChange = false,
		isUnitSelectTabbable = false,
		label,
		onChange = noop,
		size = 'default',
		style,
		units = CSS_UNITS,
		value: valueProp,
		...props
	},
	ref
) {
	const [ valueState, setValueState ] = useValueState( valueProp );
	const [ value, unit ] = parseUnit( valueState );

	const handleOnChange = ( next, changeProps ) => {
		const { event } = changeProps;
		const [ parsedValue, parsedUnit ] = parseUnit( event.target.value );

		const baseValue = parsedUnit ? parsedValue : next;
		const baseUnit = parsedUnit || unit;

		const nextValue = `${ baseValue }${ baseUnit }`;

		setValueState( nextValue );
		onChange( nextValue, changeProps );
	};

	const handleOnUnitChange = ( next, changeProps ) => {
		const { data } = changeProps;

		let nextValue = `${ value }${ next }`;

		if ( isResetValueOnUnitChange && data.default !== undefined ) {
			nextValue = `${ data.default }${ next }`;
		}

		onChange( nextValue, changeProps );
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
				className="component-unit-control__input"
				disableUnits={ disableUnits }
				label={ label }
				onChange={ handleOnChange }
				size={ size }
				suffix={ inputSuffix }
				type="text"
				value={ value }
			></ValueInput>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );
ForwardedUnitControl.__defaultUnits = CSS_UNITS;

export default ForwardedUnitControl;
