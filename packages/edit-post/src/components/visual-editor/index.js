/**
 * WordPress dependencies
 */
import {
	BlockList,
	CopyHandler,
	PostTitle,
	WritingFlow,
	ObserveTyping,
	VisualEditorGlobalKeyboardShortcuts,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
	_BlockSettingsMenuFirstItem,
	_BlockSettingsMenuPluginsExtension,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import BlockInspectorButton from './block-inspector-button';
import PluginBlockSettingsMenuGroup from '../block-settings-menu/plugin-block-settings-menu-group';

function VisualEditor() {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor editor-styles-wrapper">
			<VisualEditorGlobalKeyboardShortcuts />
			<CopyHandler />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<ObserveTyping>
					<PostTitle />
					<BlockList />
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
