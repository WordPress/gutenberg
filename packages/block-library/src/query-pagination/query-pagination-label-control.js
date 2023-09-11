/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

export function QueryPaginationLabelControl( { value, onChange } ) {
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ __( 'Show label text' ) }
			help={ __(
				'Toggle off to hide the label text, e.g. "Next Page".'
			) }
			onChange={ onChange }
			checked={ value === true }
		/>
	);
}
