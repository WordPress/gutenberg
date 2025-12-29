/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function NestedTermsControl( { value, onChange, ...props } ) {
	return (
		<ToggleControl checked={ value } onChange={ onChange } { ...props } />
	);
}
