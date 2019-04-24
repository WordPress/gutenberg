/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';
import {
	BlockEditorProvider,
	BlockList,
} from '@wordpress/block-editor';
import { useState } from '@wordpress/element';

function WidgetArea( { title, initialOpen } ) {
	const [ blocks, updateBlocks ] = useState( [] );

	return (
		<Panel>
			<PanelBody
				title={ title }
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

export default WidgetArea;
