/**
 * WordPress Dependencies
 */
import { MenuGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import FeatureToggle from '../feature-toggle';

function WritingMenu( { onClose } ) {
	return (
		<MenuGroup
			label={ __( 'View' ) }
			filterName="editPost.MoreMenu.writing"
		>
			<FeatureToggle feature="fixedToolbar" label={ __( 'Unified Toolbar' ) } onToggle={ onClose } />
			<FeatureToggle feature="focusMode" label={ __( 'Spotlight Mode' ) } onToggle={ onClose } />
			<FeatureToggle feature="fullscreenMode" label={ __( 'Fullscreen Mode' ) } onToggle={ onClose } />
		</MenuGroup>
	);
}

export default ifViewportMatches( 'medium' )( WritingMenu );
