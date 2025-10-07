/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function NestedTermsControl( { value, onChange, ...props } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ value }
			onChange={ onChange }
			{ ...props }
		/>
	);
}
