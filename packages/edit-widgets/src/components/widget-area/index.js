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

function WidgetArea( {
	blockEditorSettings,
	blocks,
	initialOpen,
	updateBlocks,
	widgetAreaName,
} ) {
	return (
		<Panel className="edit-widgets-widget-area">
			<PanelBody
				title={ widgetAreaName }
				initialOpen={ initialOpen }
			>
				<BlockEditorProvider
					value={ blocks }
					onInput={ updateBlocks }
					onChange={ updateBlocks }
					settings={ blockEditorSettings }
				>
					<BlockList />
				</BlockEditorProvider>
			</PanelBody>
		</Panel>
	);
}

export default compose( [
	withSelect( ( select, { id } ) => {
		const {
			getBlocksFromWidgetArea,
			getWidgetArea,
		} = select( 'core/edit-widgets' );
		const blocks = getBlocksFromWidgetArea( id );
		const widgetAreaName = ( getWidgetArea( id ) || {} ).name;
		return {
			blocks,
			widgetAreaName,
		};
	} ),
	withDispatch( ( dispatch, { id } ) => {
		return {
			updateBlocks( blocks ) {
				const { updateBlocksInWidgetArea } = dispatch( 'core/edit-widgets' );
				updateBlocksInWidgetArea( id, blocks );
			},
		};
	} ),
] )( WidgetArea );
