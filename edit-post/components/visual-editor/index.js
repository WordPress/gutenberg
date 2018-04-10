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
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockInspectorButton from './block-inspector-button';

function VisualEditorBlockMenu( { children, onClose } ) {
	return (
		<Fragment>
			<BlockInspectorButton onClick={ onClose } role="menuitem" />
			{ children }
		</Fragment>
	);
}

function VisualEditor() {
	return (
		<BlockSelectionClearer className="edit-post-visual-editor">
			<EditorGlobalKeyboardShortcuts />
			<CopyHandler />
			<MultiSelectScrollIntoView />
			<WritingFlow>
				<ObserveTyping>
					<PostTitle />
					<BlockList renderBlockMenu={ VisualEditorBlockMenu } />
				</ObserveTyping>
			</WritingFlow>
		</BlockSelectionClearer>
	);
}

export default VisualEditor;
