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
				>
					<BlockList />
				</BlockEditorProvider>
			</PanelBody>
		</Panel>
	);
}

export default compose( [
	withSelect( ( select, { widgetAreaId } ) => {
		const {
			getBlocksFromWidgetArea,
			getWidgetArea,
		} = select( 'core/edit-widgets' );
		const blocks = getBlocksFromWidgetArea( widgetAreaId );
		const widgetAreaName = ( getWidgetArea( widgetAreaId ) || {} ).name;
		return {
			blocks,
			widgetAreaName,
		};
	} ),
	withDispatch( ( dispatch, { widgetAreaId } ) => {
		return {
			updateBlocks( blocks ) {
				const { updateBlocksInWidgetArea } = dispatch( 'core/edit-widgets' );
				updateBlocksInWidgetArea( widgetAreaId, blocks );
			},
		};
	} ),
] )( WidgetArea );
