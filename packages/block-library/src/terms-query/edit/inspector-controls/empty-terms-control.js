/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

export default function EmptyTermsControl( { hideEmpty, onChange } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ __( 'Show empty terms' ) }
			checked={ ! hideEmpty }
			onChange={
				( showEmpty ) => onChange( ! showEmpty ) // ToggleControl returns the inverse of hideEmpty.
			}
		/>
	);
}
