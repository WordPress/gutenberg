/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { IconButton } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getCurrentPost } from '../selectors';

function PostExternalLink( { link } ) {
	if ( ! link ) {
		return null;
	}

	return (
		<IconButton
			className="editor-post-external-link"
			href={ link }
			target="_blank"
			icon="external"
			title={ __( 'View Post' ) }
		/>
	);
}

export default connect(
	( state ) => ( {
		link: getCurrentPost( state ).link,
	} )
)( PostExternalLink );
