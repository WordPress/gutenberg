/**
 * WordPress dependencies
 */
import { ToggleControl } from '@wordpress/components';

export default function EmptyTermsControl( { value, onChange, ...props } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ ! value }
			onChange={
				( showEmpty ) => onChange( ! showEmpty ) // ToggleControl returns the inverse of hideEmpty.
			}
			{ ...props }
		/>
	);
}
