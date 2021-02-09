/**
 * WordPress dependencies
 */
import {
	BlockEditorProvider,
	BlockList,
	BlockSelectionClearer,
	ObserveTyping,
	WritingFlow,
} from '@wordpress/block-editor';
import {
	DropZoneProvider,
	FocusReturnProvider,
	SlotFillProvider,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import useSidebarBlockEditor from './use-sidebar-block-editor';

export default function SidebarBlockEditor( { sidebar } ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );

	return (
		<SlotFillProvider>
			<DropZoneProvider>
				<FocusReturnProvider>
					<BlockEditorProvider
						value={ blocks }
						onInput={ onInput }
						onChange={ onChange }
					>
						<BlockSelectionClearer>
							<WritingFlow>
								<ObserveTyping>
									<BlockList />
								</ObserveTyping>
							</WritingFlow>
						</BlockSelectionClearer>
					</BlockEditorProvider>
				</FocusReturnProvider>
			</DropZoneProvider>
		</SlotFillProvider>
	);
}
