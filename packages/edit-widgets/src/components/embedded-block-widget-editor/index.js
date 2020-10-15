/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__unstableEditorStyles as EditorStyles,
	BlockEditorKeyboardShortcuts,
	BlockList,
	BlockEditorProvider,
	ObserveTyping,
	WritingFlow,
} from '@wordpress/block-editor';
import {
	DropZoneProvider,
	FocusReturnProvider,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import KeyboardShortcuts from '../keyboard-shortcuts';
import Notices from '../notices';

export default function EmbeddedBlockWidgetEditor( {
	initialBlocks,
	settings,
	onUpdateBlocks,
} ) {
	const [ blocks, setBlocks ] = useState( initialBlocks );
	const updateBlocks = ( newBlocks ) => {
		setBlocks( newBlocks );
		onUpdateBlocks( newBlocks );
	};
	const { clearSelectedBlock } = useDispatch( 'core/block-editor' );
	return (
		<>
			<EditorStyles styles={ settings.styles } />
			<BlockEditorKeyboardShortcuts.Register />
			<KeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<FocusReturnProvider>
						<BlockEditorProvider
							value={ blocks }
							onInput={ updateBlocks }
							onChange={ updateBlocks }
							settings={ settings }
						>
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
						</BlockEditorProvider>
					</FocusReturnProvider>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
