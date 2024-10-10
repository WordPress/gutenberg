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
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ __( 'Items per page' ) }
			min={ MIN_POSTS_PER_PAGE }
			max={ MAX_POSTS_PER_PAGE }
			onChange={ ( newPerPage ) => {
				if (
					isNaN( newPerPage ) ||
					newPerPage < MIN_POSTS_PER_PAGE ||
					newPerPage > MAX_POSTS_PER_PAGE
				) {
					return;
				}
				onChange( { perPage: newPerPage, offset } );
			} }
			value={ parseInt( perPage, 10 ) }
		/>
	);
};

export default PerPageControl;
