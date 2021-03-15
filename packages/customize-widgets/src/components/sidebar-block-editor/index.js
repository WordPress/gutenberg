/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockList,
	BlockSelectionClearer,
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
 * External dependencies
 */
import { useDialogState } from 'reakit/Dialog';

/**
 * Internal dependencies
 */
import Inspector, { BlockInspectorButton } from '../inspector';
import useSidebarBlockEditor from './use-sidebar-block-editor';

export default function SidebarBlockEditor( { sidebar } ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );
	const inserter = useDialogState( {
		modal: false,
		animated: 150,
	} );
	const [ isInspectorOpened, setIsInspectorOpened ] = useState( false );
	const [ isInspectorAnimating, setIsInspectorAnimating ] = useState( false );
	const settings = useMemo(
		() => ( {
			__experimentalSetIsInserterOpened: inserter.setVisible,
		} ),
		[ inserter.setVisible ]
	);
	const closeInspector = useCallback(
		() => setIsInspectorOpened( false ),
		[]
	);

	return (
		<>
			<BlockEditorKeyboardShortcuts.Register />
			<SlotFillProvider>
				<DropZoneProvider>
					<div hidden={ isInspectorOpened && ! isInspectorAnimating }>
						<BlockEditorProvider
							value={ blocks }
							onInput={ onInput }
							onChange={ onChange }
							settings={ settings }
							useSubRegistry={ false }
						>
							<BlockEditorKeyboardShortcuts />

							<BlockSelectionClearer>
								<WritingFlow>
									<ObserveTyping>
										<BlockList />
									</ObserveTyping>
								</WritingFlow>
							</BlockSelectionClearer>
						</BlockEditorProvider>

						<Popover.Slot name="block-toolbar" />
						<Popover.Slot />
					</div>

					<Inspector
						isOpened={ isInspectorOpened }
						isAnimating={ isInspectorAnimating }
						setIsAnimating={ setIsInspectorAnimating }
						close={ closeInspector }
					/>

					<__experimentalBlockSettingsMenuFirstItem>
						{ ( { onClose } ) => (
							<BlockInspectorButton
								onClick={ () => {
									// Open the inspector,
									setIsInspectorOpened( true );
									// Then close the dropdown menu.
									onClose();
								} }
							/>
						) }
					</__experimentalBlockSettingsMenuFirstItem>
				</DropZoneProvider>
			</SlotFillProvider>
		</>
	);
}
