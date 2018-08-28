/**
 * WordPress Dependencies
 */
import { MenuGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ifViewportMatches } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import FixedToolbarToggle from '../fixed-toolbar-toggle';

function WritingMenu( { onClose } ) {
	return (
		<MenuGroup
			label={ __( 'Writing' ) }
			filterName="editPost.MoreMenu.writing"
		>
			<FixedToolbarToggle onToggle={ onClose } />
		</MenuGroup>
	);
}

export default ifViewportMatches( 'medium' )( WritingMenu );
