/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Panel, PanelBody } from '@wordpress/components';
import {
	BlockEditorProvider,
	BlockList,
} from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';

function WidgetArea( { area, initialOpen, blocks, updateBlocks } ) {
	return (
		<Panel>
			<PanelBody
				title={ area.name }
				initialOpen={ initialOpen }
			>
				<BlockEditorProvider
					value={ blocks }
					onInput={ updateBlocks }
					onChange={ updateBlocks }
				>
					<BlockList />
				</BlockEditorProvider>
			</PanelBody>
		</Panel>
	);
}

export default compose( [
	withSelect( ( select, { area } ) => {
		const { getBlocksFromWidgetArea } = select( 'core/edit-widgets' );
		const blocks = getBlocksFromWidgetArea( area.id );
		return {
			blocks,
		};
	} ),
	withDispatch( ( dispatch, { area } ) => {
		return {
			updateBlocks( blocks ) {
				const { updateBlocksInWidgetArea } = dispatch( 'core/edit-widgets' );
				updateBlocksInWidgetArea( area.id, blocks );
			},
		};
	} ),
] )( WidgetArea );
