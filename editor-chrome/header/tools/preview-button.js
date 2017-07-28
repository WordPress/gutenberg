/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import { _x } from 'i18n';
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
