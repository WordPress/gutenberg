/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../store/selectors';

function PostFormatCheck( { postType, children } ) {
	if ( ! get( postType.data, [ 'supports', 'post-formats' ] ) ) {
		return null;
	}

	return children;
}

export default compose( [
	connect(
		( state ) => {
			return {
				postTypeSlug: getCurrentPostType( state ),
			};
		},
	),
	withAPIData( ( props ) => {
		const { postTypeSlug } = props;

		return {
			postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
		};
	} ),
] )( PostFormatCheck );
