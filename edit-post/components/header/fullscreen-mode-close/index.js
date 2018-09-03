/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';
import { IconButton, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function FullscreenModeClose( { isActive, returnURL } ) {
	if ( ! isActive || ! returnURL ) {
		return null;
	}

	return (
		<Toolbar className="edit-post-fullscreen-mode-close__toolbar">
			<IconButton
				icon="no-alt"
				href={ returnURL }
				label={ __( 'Close' ) }
			/>
		</Toolbar>
	);
}

export default withSelect( ( select ) => ( {
	isActive: select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' ),
	returnURL: select( 'core/editor' ).getEditorSettings().returnURL,
} ) )( FullscreenModeClose );
