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
				'Specify how many links can appear before and after the current page number. Links to the first, current and last page are always visible.'
			) }
			value={ value }
			onChange={ onChange }
			min={ 0 }
			max={ 5 }
			withInputField={ false }
		/>
	);
}
