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
import { CSS_UNITS } from './utils';

function UnitControl(
	{
		className,
		disableUnits = false,
		isResetValueOnUnitChange = false,
		isUnitSelectTabbable = true,
		label,
		onChange = noop,
		onUnitChange = noop,
		size = 'default',
		style,
		unit = 'px',
		units = CSS_UNITS,
		value,
		...props
	},
	ref
) {
	const handleOnUnitChange = ( unitValue, changeProps ) => {
		const { data } = changeProps;
		onUnitChange( unitValue, changeProps );

		if ( isResetValueOnUnitChange && data.default !== undefined ) {
			onChange( data.default, changeProps );
		}
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
				disableUnits={ disableUnits }
				className="component-unit-control__input"
				label={ label }
				value={ value }
				onChange={ onChange }
				size={ size }
				suffix={ inputSuffix }
			></ValueInput>
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );
ForwardedUnitControl.__defaultUnits = CSS_UNITS;

export default ForwardedUnitControl;
