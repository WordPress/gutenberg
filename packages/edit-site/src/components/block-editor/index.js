/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { BlockInspector } from '@wordpress/block-editor';

import { ReusableBlocksMenuItems } from '@wordpress/reusable-blocks';

/**
 * Internal dependencies
 */

import TemplatePartConverter from '../template-part-converter';
import { SidebarInspectorFill } from '../sidebar-edit-mode';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { DisableNonPageContentBlocks } from '../page-content-focus';
import SiteEditorCanvas from './site-editor-canvas';
import DefaultBlockEditorProvider from './providers/default-block-editor-provider';

export default function BlockEditor() {
	const { hasPageContentFocus } = useSelect( ( select ) => {
		const { hasPageContentFocus: _hasPageContentFocus } = unlock(
			select( editSiteStore )
		);

		return {
			hasPageContentFocus: _hasPageContentFocus(),
		};
	}, [] );

	return (
		<DefaultBlockEditorProvider>
			{ hasPageContentFocus && <DisableNonPageContentBlocks /> }
			<TemplatePartConverter />
			<SidebarInspectorFill>
				<BlockInspector />
			</SidebarInspectorFill>

			<SiteEditorCanvas />

			<ReusableBlocksMenuItems />
		</DefaultBlockEditorProvider>
	);
}
