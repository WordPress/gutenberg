/**
 * External dependencies
 */
import { isUndefined, noop } from 'lodash';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import { CSS_UNITS } from './utils';

export default function UnitControl( {
	className,
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
} ) {
	const handleOnUnitChange = ( unitValue, changeProps ) => {
		const { data } = changeProps;
		onUnitChange( unitValue, changeProps );

		if ( isResetValueOnUnitChange && ! isUndefined( data.default ) ) {
			onChange( data.default, changeProps );
		}
	};

	const classes = classnames( 'component-unit-control', className );

	return (
		<Root className={ classes } style={ style }>
			<ValueInput
				aria-label={ label }
				{ ...props }
				className="component-unit-control__input"
				value={ value }
				onChange={ onChange }
				size={ size }
				type="number"
			/>
			<UnitSelectControl
				className="component-unit-control__select"
				isTabbable={ isUnitSelectTabbable }
				options={ units }
				onChange={ handleOnUnitChange }
				size={ size }
				value={ unit }
			/>
		</Root>
	);
}

UnitControl.__defaultUnits = CSS_UNITS;
