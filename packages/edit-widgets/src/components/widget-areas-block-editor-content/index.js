/**
 * WordPress dependencies
 */
import {
	BlockList,
	BlockTools,
	BlockEditorKeyboardShortcuts,
	BlockSelectionClearer,
	WritingFlow,
	ObserveTyping,
	__unstableEditorStyles as EditorStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';

export default function WidgetAreasBlockEditorContent( {
	blockEditorSettings,
} ) {
	return (
		<div className="edit-widgets-block-editor editor-styles-wrapper">
			<EditorStyles styles={ blockEditorSettings.styles } />
			<KeyboardShortcuts />
			<BlockEditorKeyboardShortcuts />
			<Notices />
			<BlockTools>
				<BlockSelectionClearer>
					<WritingFlow>
						<ObserveTyping>
							<BlockList className="edit-widgets-main-block-list" />
						</ObserveTyping>
					</WritingFlow>
				</BlockSelectionClearer>
			</BlockTools>
		</div>
	);
}
