/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Dashicon, ClipboardButton } from 'components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostAttribute } from '../selectors';

function PostPermalink( { link } ) {
	if ( ! link ) {
		return null;
	}

	return (
		<div className="editor-post-permalink">
			<Dashicon icon="admin-links" />
			<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>
			<span className="editor-post-permalink__link">{ link }</span>
			<ClipboardButton className="button" text={ link }>
				{ __( 'Copy' ) }
			</ClipboardButton>
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			link: getEditedPostAttribute( state, 'link' ),
		};
	}
)( PostPermalink );

