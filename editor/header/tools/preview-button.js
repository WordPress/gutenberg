/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { IconButton } from '@wordpress/components';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getEditedPostPreviewLink } from '../../selectors';

function PreviewButton( { link, postId } ) {
	return (
		<IconButton
			href={ link }
			target={ `wp-preview-${ postId }` }
			icon="visibility"
			disabled={ ! link }
		>
			{ _x( 'Preview', 'imperative verb' ) }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		postId: state.currentPost.id,
		link: getEditedPostPreviewLink( state ),
	} )
)( PreviewButton );
