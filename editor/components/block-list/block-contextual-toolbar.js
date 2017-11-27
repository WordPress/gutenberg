/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import NavigableToolbar from '../navigable-toolbar';
import { BlockToolbar } from '../';

function BlockContextualToolbar( { onShowInspector } ) {
	return (
		<NavigableToolbar
			className="editor-block-contextual-toolbar"
			aria-label={ __( 'Block Toolbar' ) }
		>
			<BlockToolbar onShowInspector={ onShowInspector } />
		</NavigableToolbar>
	);
}

export default BlockContextualToolbar;
