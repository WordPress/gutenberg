/**
 * External dependencies
 */
import { noop } from 'lodash';
/**
 * Internal dependencies
 */
import { Root, ValueInput } from './styles/unit-control-styles';
import UnitSelectControl from './unit-select-control';
import { CSS_UNITS } from './utils';

export default function UnitControl( {
	isUnitSelectTabbable = true,
	label,
	onChange = noop,
	onUnitChange = noop,
	size = 'default',
	unit = 'px',
	units = CSS_UNITS,
	value,
	...props
} ) {
	return (
		<Root>
			<ValueInput
				aria-label={ label }
				{ ...props }
				value={ value }
				onChange={ onChange }
				size={ size }
				type="number"
			/>
			<UnitSelectControl
				isTabbable={ isUnitSelectTabbable }
				options={ units }
				onChange={ onUnitChange }
				size={ size }
				value={ unit }
			/>
		</Root>
	);
}
