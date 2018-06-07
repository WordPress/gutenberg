/**
 * WordPress dependencies
 */
import {
	BlockList,
	CopyHandler,
	PostTitle,
	WritingFlow,
	ObserveTyping,
	EditorGlobalKeyboardShortcuts,
	BlockSelectionClearer,
	MultiSelectScrollIntoView,
	PluginBlockSettingsMenu,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';

function VisualEditor() {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<CopyHandler />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<ObserveTyping>
					<PostTitle />
					<BlockList />
				</ObserveTyping>
			</WritingFlow>
			<PluginBlockSettingsMenu>
				{ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } role="menuitem" /> }
			</PluginBlockSettingsMenu>
		</BlockSelectionClearer>
	);
}

export default VisualEditor;
