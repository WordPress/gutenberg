/**
 * WordPress dependencies
 */
import { useReducer, useMemo } from '@wordpress/element';
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

const inspectorOpenStateReducer = ( state, action ) => {
	switch ( action ) {
		case 'OPEN':
			return {
				open: true,
				busy: true,
			};
		case 'TRANSITION_END':
			return {
				...state,
				busy: false,
			};
		case 'CLOSE':
			return {
				open: false,
				busy: true,
			};
		default:
			throw new Error( 'Unexpected action' );
	}
};

export default function SidebarBlockEditor( { sidebar } ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );
	const inserter = useDialogState( {
		modal: false,
		animated: 150,
	} );
	const [
		{ open: isInspectorOpened, busy: isInspectorAnimating },
		setInspectorOpenState,
	] = useReducer( inspectorOpenStateReducer, { open: false, busy: false } );
	const settings = useMemo(
		() => ( {
			__experimentalSetIsInserterOpened: inserter.setVisible,
		} ),
		[ inserter.setVisible ]
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
						setInspectorOpenState={ setInspectorOpenState }
					/>

					<__experimentalBlockSettingsMenuFirstItem>
						{ ( { onClose } ) => (
							<BlockInspectorButton
								onClick={ () => {
									// Open the inspector,
									setInspectorOpenState( 'OPEN' );
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
