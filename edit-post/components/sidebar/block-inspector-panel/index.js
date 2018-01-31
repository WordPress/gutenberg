/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';
import { BlockInspector } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import './style.scss';

function BlockInspectorPanel() {
	return (
		<Panel>
			<PanelBody className="edit-post-block-inspector-panel">
				<BlockInspector />
			</PanelBody>
		</Panel>
	);
}

export default BlockInspectorPanel;
