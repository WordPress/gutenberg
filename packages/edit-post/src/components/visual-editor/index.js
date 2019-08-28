/**
 * WordPress dependencies
 */
import {
	PostTitle,
	VisualEditorGlobalKeyboardShortcuts,
} from '@wordpress/editor';
import {
	WritingFlow,
	Typewriter,
	ObserveTyping,
	BlockList,
	CopyHandler,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
	__experimentalBlockSettingsMenuFirstItem,
	__experimentalBlockSettingsMenuPluginsExtension,
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
			<Typewriter>
				<WritingFlow>
					<ObserveTyping>
						<CopyHandler>
							<PostTitle />
							<BlockList />
						</CopyHandler>
					</ObserveTyping>
				</WritingFlow>
			</Typewriter>
			<__experimentalBlockSettingsMenuFirstItem>
				{ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } /> }
			</__experimentalBlockSettingsMenuFirstItem>
			<__experimentalBlockSettingsMenuPluginsExtension>
				{ ( { clientIds, onClose } ) => <PluginBlockSettingsMenuGroup.Slot fillProps={ { clientIds, onClose } } /> }
			</__experimentalBlockSettingsMenuPluginsExtension>
		</BlockSelectionClearer>
	);
}

export default VisualEditor;
