/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import {
	BlockList,
	BlockEditorKeyboardShortcuts,
	BlockSelectionClearer,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';

export default function WidgetAreasBlockEditorContent() {
	return (
		<div className="edit-widgets-block-editor editor-styles-wrapper">
			<KeyboardShortcuts />
			<BlockEditorKeyboardShortcuts />
			<Notices />
			<Popover.Slot name="block-toolbar" />
			<BlockSelectionClearer>
				<WritingFlow>
					<ObserveTyping>
						<BlockList className="edit-widgets-main-block-list" />
					</ObserveTyping>
				</WritingFlow>
			</BlockSelectionClearer>
		</div>
	);
}
