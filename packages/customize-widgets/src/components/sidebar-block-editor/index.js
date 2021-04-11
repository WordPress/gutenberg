/**
 * WordPress dependencies
 */
import { createPortal } from '@wordpress/element';
import {
	BlockList,
	BlockSelectionClearer,
	BlockInspector,
	ObserveTyping,
	WritingFlow,
	BlockEditorKeyboardShortcuts,
	__experimentalBlockSettingsMenuFirstItem,
} from '@wordpress/block-editor';
import {
	DropZoneProvider,
	SlotFillProvider,
	Popover,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import BlockInspectorButton from '../block-inspector-button';
import SidebarEditorProvider from './sidebar-editor-provider';

export default function SidebarBlockEditor( { sidebar, inserter, inspector } ) {
	const parentContainer = document.getElementById(
		'customize-theme-controls'
	);

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<SidebarEditorProvider
						sidebar={ sidebar }
						inserter={ inserter }
					>
						<BlockSelectionClearer>
							<WritingFlow>
								<ObserveTyping>
									<BlockList />
								</ObserveTyping>
							</WritingFlow>
						</BlockSelectionClearer>
					</SidebarEditorProvider>

					<Popover.Slot name="block-toolbar" />

					{ createPortal(
						// This is a temporary hack to prevent button component inside <BlockInspector>
						// from submitting form when type="button" is not specified.
						<form onSubmit={ ( event ) => event.preventDefault() }>
							<BlockInspector />
						</form>,
						inspector.contentContainer[ 0 ]
					) }

					<__experimentalBlockSettingsMenuFirstItem>
						{ ( { onClose } ) => (
							<BlockInspectorButton
								inspector={ inspector }
								closeMenu={ onClose }
							/>
						) }
					</__experimentalBlockSettingsMenuFirstItem>

					{
						// We have to portal this to the parent of both the editor and the inspector,
						// so that the popovers will appear above both of them.
						createPortal( <Popover.Slot />, parentContainer )
					}
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
