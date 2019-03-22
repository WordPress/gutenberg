/**
 * WordPress dependencies
 */
import {
	PostTitle,
	VisualEditorGlobalKeyboardShortcuts,
} from '@wordpress/editor';
import {
	WritingFlow,
	ObserveTyping,
	BlockList,
	CopyHandler,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
	_BlockSettingsMenuFirstItem,
	_BlockSettingsMenuPluginsExtension,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import PluginBlockSettingsMenuGroup from '../block-settings-menu/plugin-block-settings-menu-group';

function VisualEditor() {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor editor-styles-wrapper">
			<VisualEditorGlobalKeyboardShortcuts />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<ObserveTyping>
					<CopyHandler>
						<PostTitle />
						<BlockList />
					</CopyHandler>
				</ObserveTyping>
			</WritingFlow>
			<_BlockSettingsMenuFirstItem>
				{ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } /> }
			</_BlockSettingsMenuFirstItem>
			<_BlockSettingsMenuPluginsExtension>
				{ ( { clientIds, onClose } ) => <PluginBlockSettingsMenuGroup.Slot fillProps={ { clientIds, onClose } } /> }
			</_BlockSettingsMenuPluginsExtension>
		</BlockSelectionClearer>
	);
}

export default VisualEditor;
