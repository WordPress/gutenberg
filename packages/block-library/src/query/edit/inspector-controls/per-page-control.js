/**
 * WordPress dependencies
 */
import { RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const MIN_POSTS_PER_PAGE = 1;
const MAX_POSTS_PER_PAGE = 100;

const PerPageControl = ( { perPage, offset = 0, onChange } ) => {
	return (
		<RangeControl
			label={ __( 'Posts Per Page' ) }
			min={ MIN_POSTS_PER_PAGE }
			max={ MAX_POSTS_PER_PAGE }
			onChange={ ( newPerPage ) => {
				onChange( { perPage: newPerPage, offset } );
			} }
			value={ perPage }
		/>
	);
};

export default PerPageControl;
