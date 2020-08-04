/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import {
	BlockEditorKeyboardShortcuts,
	WritingFlow,
	ObserveTyping,
	BlockList,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Notices from '../notices';
import KeyboardShortcuts from '../keyboard-shortcuts';

export default function WidgetAreasBlockEditorContent() {
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );
	return (
		<>
			<KeyboardShortcuts />
			<BlockEditorKeyboardShortcuts />
			<Notices />
			<Popover.Slot name="block-toolbar" />
			<div tabIndex="-1" onFocus={ clearSelectedBlock }>
				<div
					className="editor-styles-wrapper"
					onFocus={ ( event ) => {
						// Stop propagation of the focus event to avoid the parent
						// widget layout component catching the event and removing the selected area.
						event.stopPropagation();
						event.preventDefault();
					} }
				>
					<WritingFlow>
						<ObserveTyping>
							<BlockList className="edit-widgets-main-block-list" />
						</ObserveTyping>
					</WritingFlow>
				</div>
			</div>
		</>
	);
}
