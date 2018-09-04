/**
 * WordPress Dependencies
 */
import { withSelect } from '@wordpress/data';
import { IconButton, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './style.scss';

function FullscreenModeClose( { isActive, postType } ) {
	if ( ! isActive ) {
		return null;
	}

	return (
		<Toolbar className="edit-post-fullscreen-mode-close__toolbar">
			<IconButton
				icon="no-alt"
				href={ addQueryArgs( 'edit.php', { post_type: postType } ) }
				label={ __( 'Close' ) }
			/>
		</Toolbar>
	);
}

export default withSelect( ( select ) => ( {
	isActive: select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' ),
	postType: select( 'core/editor' ).getCurrentPostType(),
} ) )( FullscreenModeClose );
