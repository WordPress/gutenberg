/**
 * WordPress dependencies
 */
import { createPortal, useMemo } from '@wordpress/element';
import {
	BlockEditorProvider,
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
import Header from '../header';
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useInserter from '../inserter/use-inserter';

export default function SidebarBlockEditor( { sidebar, inserter, inspector } ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );
	const parentContainer = document.getElementById(
		'customize-theme-controls'
	);
	const [ isInserterOpened, setIsInserterOpened ] = useInserter( inserter );
	const settings = useMemo(
		() => ( {
			__experimentalSetIsInserterOpened: setIsInserterOpened,
		} ),
		[]
	);

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<BlockEditorProvider
						value={ blocks }
						onInput={ onInput }
						onChange={ onChange }
						settings={ settings }
						useSubRegistry={ false }
					>
						<BlockEditorKeyboardShortcuts />

						<Header
							inserter={ inserter }
							isInserterOpened={ isInserterOpened }
							setIsInserterOpened={ setIsInserterOpened }
						/>

						<BlockSelectionClearer>
							<WritingFlow>
								<ObserveTyping>
									<BlockList />
								</ObserveTyping>
							</WritingFlow>
						</BlockSelectionClearer>
					</BlockEditorProvider>

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
