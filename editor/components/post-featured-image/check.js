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

function PostFeaturedImageCheck( { postType, children } ) {
	const supportFeaturedImage = get( postType, [ 'data', 'supports', 'thumbnail' ], false );

	if ( ! supportFeaturedImage ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => {
		return {
			postTypeName: getCurrentPostType( state ),
		};
	}
);

const applyWithAPIData = withAPIData( ( { postTypeName } ) => {
	return {
		postType: postTypeName ? `/wp/v2/types/${ postTypeName }?context=edit` : undefined,
	};
} );

export default compose(
	applyConnect,
	applyWithAPIData,
)( PostFeaturedImageCheck );
