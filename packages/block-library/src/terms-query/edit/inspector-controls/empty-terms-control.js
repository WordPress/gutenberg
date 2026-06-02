/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function EmptyTermsControl( { value, onChange, ...props } ) {
	return (
		<ToggleControl
			checked={ ! value }
			onChange={ ( showEmpty ) => onChange( ! showEmpty ) }
			{ ...props }
		/>
	);
}
