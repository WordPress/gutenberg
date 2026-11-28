import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import type { QueryPaginationLabelControlProps } from './types';

export function QueryPaginationLabelControl( {
	value,
	onChange,
}: QueryPaginationLabelControlProps ) {
	return (
		<ToggleControl
			label={ __( 'Show label text' ) }
			help={ __( 'Make label text visible, e.g. "Next Page".' ) }
			onChange={ onChange }
			checked={ value === true }
		/>
	);
}
