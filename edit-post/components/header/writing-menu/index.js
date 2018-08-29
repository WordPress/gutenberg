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
			label={ __( 'Writing' ) }
			filterName="editPost.MoreMenu.writing"
		>
			<FeatureToggle feature="fixedToolbar" label={ __( 'Fix Toolbar To Top' ) } onToggle={ onClose } />
			<FeatureToggle feature="focusMode" label={ __( 'Focus Mode' ) } onToggle={ onClose } />
		</MenuGroup>
	);
}

export default ifViewportMatches( 'medium' )( WritingMenu );
