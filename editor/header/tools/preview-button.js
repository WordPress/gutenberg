/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import Dashicon from 'components/dashicon';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import { getEditedPostPreviewLink } from '../../selectors';

function PreviewButton( { link } ) {
	return (
		<Button href={ link } target="_blank">
			<Dashicon icon="visibility" />
			{ wp.i18n._x( 'Preview', 'imperative verb' ) }
		</Button>
	);
}

export default connect(
	( state ) => ( {
		link: getEditedPostPreviewLink( state ),
	} )
)( PreviewButton );
