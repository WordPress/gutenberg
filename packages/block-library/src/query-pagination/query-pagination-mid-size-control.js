/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

export function QueryPaginationMidSizeControl( { value, onChange } ) {
	return (
		<NumberControl
			label={ __( 'Pages next to current one' ) }
			help={ __(
				'Maximum amount of numbered pages to be shown before and after the current one if available.'
			) }
			onChange={ onChange }
			value={ value }
			min={ 0 }
			max={ 10 }
		/>
	);
}
