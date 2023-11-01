/**
 * WordPress dependencies
 */
import { BlockInspector } from '@wordpress/block-editor';
import { privateApis as editPatternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import TemplatePartConverter from '../template-part-converter';
import { SidebarInspectorFill } from '../sidebar-edit-mode';
import SiteEditorCanvas from './site-editor-canvas';
import BlockEditorProvider from './block-editor-provider';

import { unlock } from '../../lock-unlock';
const { PatternsMenuItems } = unlock( editPatternsPrivateApis );
export default function BlockEditor() {
	return (
		<BlockEditorProvider>
			<TemplatePartConverter />
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>
			<SiteEditorCanvas />
			<PatternsMenuItems />
		</BlockEditorProvider>
	);
}
