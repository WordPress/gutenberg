/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

export default function NestedTermsControl( { hierarchical, onChange } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ __( 'Include nested terms' ) }
			checked={ hierarchical }
			onChange={ onChange }
		/>
	);
}
