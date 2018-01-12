/**
 * WordPress dependencies
 */
import { MenuItemsGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CopyContentButton from '../copy-content-button';

export default function EditorActions() {
	return (
		<MenuItemsGroup className="editor-actions"
			label={ __( 'Tools' ) }
		>
			<CopyContentButton />
		</MenuItemsGroup>
	);
}
