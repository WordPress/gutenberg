/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

function ManagePatternsMenuItem() {
	const url = useSelect( ( select ) => {
		const { canUser } = select( coreStore );
		const { getEditorSettings } = select( editorStore );

		const isBlockTheme = getEditorSettings().__unstableIsBlockBasedTheme;
		const defaultUrl = addQueryArgs( 'edit.php', {
			post_type: 'wp_block',
		} );
		const patternsUrl = addQueryArgs( 'site-editor.php', {
			path: '/patterns',
		} );

		// The site editor and templates both check whether the user has
		// edit_theme_options capabilities. We can leverage that here and not
		// display the manage patterns link if the user can't access it.
		return canUser( 'read', 'templates' ) && isBlockTheme
			? patternsUrl
			: defaultUrl;
	}, [] );

	return (
		<MenuItem role="menuitem" href={ url }>
			{ __( 'Manage patterns' ) }
		</MenuItem>
	);
}

export default ManagePatternsMenuItem;
