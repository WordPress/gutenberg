/**
 * External dependencies
 */
import { noop, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import { UnitSelect, UnitLabel } from './styles/unit-control-styles';
import { CSS_UNITS } from './utils';

/**
 * Renders a `select` if there are multiple units.
 * Otherwise, renders a non-selectable label.
 */
export default function UnitSelectControl( {
	isTabbable = true,
	options = CSS_UNITS,
	onChange = noop,
	size = 'default',
	value = 'px',
} ) {
	if ( isEmpty( options ) || options.length === 1 ) {
		return <UnitLabel size={ size }>{ value }</UnitLabel>;
	}

	const handleOnChange = ( event ) => {
		onChange( event.target.value );
	};

	return (
		<UnitSelect
			value={ value }
			onChange={ handleOnChange }
			size={ size }
			tabIndex={ isTabbable ? null : '-1' }
		>
			{ options.map( ( option ) => (
				<option value={ option.value } key={ option.value }>
					{ option.label }
				</option>
			) ) }
		</UnitSelect>
	);
}
