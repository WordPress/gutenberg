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
	_BlockSettingsMenuFirstItem,
	_BlockSettingsMenuPluginsExtension,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';
import { PluginsBlockSettingsMenuGroup } from '../../plugins';

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
			<_BlockSettingsMenuFirstItem>
				{ ( { onClose } ) => <BlockInspectorButton onClick={ onClose } /> }
			</_BlockSettingsMenuFirstItem>
			<_BlockSettingsMenuPluginsExtension>
				{ ( { clientIds, onClose } ) => (
					<PluginsBlockSettingsMenuGroup.Slot fillProps={ { clientIds, onClose } } />
				) }
			</_BlockSettingsMenuPluginsExtension>
		</BlockSelectionClearer>
	);
}

export default VisualEditor;
