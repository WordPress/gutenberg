/**
 * WordPress dependencies
 */
import { getBlockType } from '@wordpress/blocks';
import { __experimentalSpacer as Spacer } from '@wordpress/components';

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
			<Spacer paddingX={ 4 }>
				<BlockPreviewPanel name={ name } />
			</Spacer>
			<ContextMenu
				parentMenu={ '/blocks/' + encodeURIComponent( name ) }
				name={ name }
			/>
		</>
	);
}

export default ScreenBlock;
