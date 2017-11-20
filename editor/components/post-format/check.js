/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../state/selectors';

function PostFormatCheck( { postType, children } ) {
	if ( ! get( postType.data, [ 'supports', 'post-formats' ] ) ) {
		return null;
	}

	return children;
}

export default flowRight( [
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
