/**
 * WordPress dependencies
 */
import { useReducer, createPortal, useMemo } from '@wordpress/element';
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
 * Internal dependencies
 */
import Inspector, { BlockInspectorButton } from '../inspector';
import Header from '../header';
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useInserter from '../inserter/use-inserter';

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

export default function SidebarBlockEditor( { sidebar, inserter } ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );
	const [
		{ open: isInspectorOpened, busy: isInspectorAnimating },
		setInspectorOpenState,
	] = useReducer( inspectorOpenStateReducer, { open: false, busy: false } );
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
					<div hidden={ isInspectorOpened && ! isInspectorAnimating }>
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
					</div>

					{ createPortal(
						<Inspector
							isOpened={ isInspectorOpened }
							isAnimating={ isInspectorAnimating }
							setInspectorOpenState={ setInspectorOpenState }
						/>,
						parentContainer
					) }

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
