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
		isUnitSelectTabbable = true,
		isResetValueOnUnitChange = true,
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

		if ( isResetValueOnUnitChange && ! data.default === undefined ) {
			onChange( data.default, changeProps );
		}
	};

	const classes = classnames( 'component-unit-control', className );

	return (
		<Root className={ classes } ref={ ref } style={ style }>
			<ValueInput
				aria-label={ label }
				{ ...props }
				disableUnits={ disableUnits }
				className="component-unit-control__input"
				value={ value }
				onChange={ onChange }
				size={ size }
				type="number"
			/>
			{ ! disableUnits && (
				<UnitSelectControl
					className="component-unit-control__select"
					isTabbable={ isUnitSelectTabbable }
					options={ units }
					onChange={ handleOnUnitChange }
					size={ size }
					value={ unit }
				/>
			) }
		</Root>
	);
}

const ForwardedUnitControl = forwardRef( UnitControl );
ForwardedUnitControl.__defaultUnits = CSS_UNITS;

export default ForwardedUnitControl;
