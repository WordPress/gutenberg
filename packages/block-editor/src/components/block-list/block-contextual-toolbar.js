/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import { BlockToolbar } from '../';

function BlockContextualToolbar( { focusOnMount } ) {
	return (
		<NavigableToolbar
			focusOnMount={ focusOnMount }
			className="editor-block-contextual-toolbar block-editor-block-contextual-toolbar"
			/* translators: accessibility text for the block toolbar */
			aria-label={ __( 'Block tools' ) }
		>
			<BlockToolbar />
		</NavigableToolbar>
	);
}

export default BlockContextualToolbar;
