/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';

import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import { SidebarInspectorFill } from '../sidebar-edit-mode';
import SiteEditorCanvas from './site-editor-canvas';
import useBlockEditorProvider from './use-block-editor-provider';

export default function BlockEditor() {
	const BlockEditorProvider = useBlockEditorProvider();
	return (
		<BlockEditorProvider>
			<TemplatePartConverter />
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			<SiteEditorCanvas />
			<ReusableBlocksMenuItems />
		</BlockEditorProvider>
	);
}
