/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

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
	const className = 'editor-preview-button';

	return (
		<IconButton
			href={ link }
			target={ `wp-preview-${ postId }` }
			icon="visibility"
			disabled={ ! link }
			className={ className }
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
