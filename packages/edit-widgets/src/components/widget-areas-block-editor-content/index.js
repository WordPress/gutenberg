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
		<BlockSelectionClearer>
			<div
				className="edit-widgets-block-editor editor-styles-wrapper"
				onFocus={ ( event ) => {
					// Stop propagation of the focus event to avoid the parent
					// widget layout component catching the event and removing the selected area.
					event.stopPropagation();
					event.preventDefault();
				} }
			>
				<KeyboardShortcuts />
				<BlockEditorKeyboardShortcuts />
				<Notices />
				<Popover.Slot name="block-toolbar" />
				<WritingFlow>
					<ObserveTyping>
						<BlockList className="edit-widgets-main-block-list" />
					</ObserveTyping>
				</WritingFlow>
			</div>
		</BlockSelectionClearer>
	);
}
