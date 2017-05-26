/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import IconButton from 'components/icon-button';

/**
 * Internal dependencies
 */
import { getEditedPostPreviewLink } from '../../selectors';

function PreviewButton( { link } ) {
	return (
		<IconButton
			href={ link }
			target="_blank"
			icon="visibility"
			disabled={ ! link }
		>
			{ wp.i18n._x( 'Preview', 'imperative verb' ) }
		</IconButton>
	);
}

export default connect(
	( state ) => ( {
		link: getEditedPostPreviewLink( state ),
	} )
)( PreviewButton );
