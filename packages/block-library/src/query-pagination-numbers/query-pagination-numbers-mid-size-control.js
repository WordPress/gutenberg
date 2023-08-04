/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';

export function QueryPaginationNumbersMidSizeControl( { value, onChange } ) {
	return (
		<RangeControl
			label={ __( 'Number of links' ) }
			help={ __(
				'Maximum amount of numbered pages to be shown before and after the current page link if available.'
			) }
			value={ value }
			onChange={ onChange }
			min={ 0 }
			max={ 5 }
			withInputField={ false }
		/>
	);
}
