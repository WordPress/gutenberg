/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { BlockInspector } from '../../../components';

function BlockInspectorPanel() {
	return (
		<Panel>
			<PanelBody className="editor-block-inspector-panel">
				<BlockInspector />
			</PanelBody>
		</Panel>
	);
}

export default BlockInspectorPanel;
