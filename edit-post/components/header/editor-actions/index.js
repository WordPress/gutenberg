/**
 * WordPress dependencies
 */
import { MenuItemsGroup } from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

export default function EditorActions() {
	const tools = applyFilters( 'editor.EditorActions.tools', [] );
	return tools.length ? (
		<MenuItemsGroup key="tools"
			className="edit-post-actions"
			label={ __( 'Tools' ) }
		>
			{ tools }
		</MenuItemsGroup>
	) : null;
}
