/**
 * WordPress dependencies
 */
import { __experimentalApplyValueToSides as applyValueToSides } from '@wordpress/components';

/**
 * Internal dependencies
 */
import SpacingInputControl from './spacing-input-control';
import { getAllRawValue, isValuesMixed, isValuesDefined } from './utils';

export default function AllInputControl( {
	onChange,
	values,
	sides,
	spacingSizes,
	type,
	minimumCustomValue,
	onMouseOver,
	onMouseOut,
} ) {
	const allValue = getAllRawValue( values );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values, sides );

	const handleOnChange = ( next ) => {
		const nextValues = applyValueToSides( values, next, sides );
		onChange( nextValues );
	};

	return (
		<SpacingInputControl
			value={ allValue }
			onChange={ handleOnChange }
			side={ 'all' }
			spacingSizes={ spacingSizes }
			isMixed={ isMixed }
			type={ type }
			minimumCustomValue={ minimumCustomValue }
			onMouseOver={ onMouseOver }
			onMouseOut={ onMouseOut }
		/>
	);
}
