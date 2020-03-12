/**
 * External dependencies
 */
import { noop, isEmpty } from 'lodash';
/**
 * Internal dependencies
 */
import {
	Root,
	UnitSelect,
	UnitLabel,
	ValueInput,
} from './styles/unit-control-styles';

const CSS_UNITS = [
	{ value: 'px', label: 'px' },
	{ value: '%', label: '%' },
	{ value: 'em', label: 'em' },
	{ value: 'rem', label: 'rem' },
	{ value: 'vw', label: 'vw' },
	{ value: 'vh', label: 'vh' },
];

export default function UnitControl( {
	isUnitSelectTabbable = true,
	label,
	onChange = noop,
	onUnitChange = noop,
	size = 'default',
	unit,
	units = CSS_UNITS,
	value,
	...props
} ) {
	const handleOnChange = ( event ) => {
		onChange( event.target.value );
	};

	// TODO: Create NumberControl primitive

	return (
		<Root>
			<ValueInput
				aria-label={ label }
				inputmode="numeric"
				{ ...props }
				value={ value }
				onChange={ handleOnChange }
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

function UnitSelectControl( {
	isTabbable = true,
	options = CSS_UNITS,
	onChange = noop,
	size = 'default',
	value = 'px',
} ) {
	if ( isEmpty( options ) ) {
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
