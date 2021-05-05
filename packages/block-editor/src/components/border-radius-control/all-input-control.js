/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getAllValue, isValuesMixed, isValuesDefined } from './utils';

export default function AllInputControl( {
	onChange = noop,
	values,
	...props
} ) {
	const allValue = getAllValue( values );
	const hasValues = isValuesDefined( values );
	const isMixed = hasValues && isValuesMixed( values );
	const allPlaceholder = isMixed ? __( 'Mixed' ) : null;

	return (
		<UnitControl
			{ ...props }
			disableUnits={ isMixed }
			isOnly
			value={ allValue }
			onChange={ onChange }
			placeholder={ allPlaceholder }
		/>
	);
}
