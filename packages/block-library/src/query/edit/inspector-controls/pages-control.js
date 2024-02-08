/**
 * WordPress dependencies
 */
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const PagesControl = ( { pages, onChange } ) => {
	return (
		<NumberControl
			label={ __( 'Max Pages to Show' ) }
			value={ pages }
			min={ 0 }
			onChange={ ( newPages ) => {
				onChange( { pages: newPages } );
			} }
			help={ __(
				'Limit the pages you want to show, even if the query has more results. To show all pages use 0 (zero).'
			) }
		/>
	);
};

export default PagesControl;
