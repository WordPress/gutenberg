/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ContextMenu from './context-menu';
import ScreenHeader from './header';
import BlockPreviewPanel from './block-preview-panel';

function ScreenBlock( { name } ) {
	const blockType = getBlockType( name );

	return (
		<>
			<ScreenHeader title={ blockType.title } />
			<BlockPreviewPanel name={ name } />
			<ContextMenu
				parentMenu={ '/blocks/' + encodeURIComponent( name ) }
				name={ name }
				blockTitle={ blockType.title }
			/>
		</>
	);
}

export default ScreenBlock;
