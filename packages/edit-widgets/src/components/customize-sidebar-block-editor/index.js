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
import useCustomizeSidebarBlockEditor from './use-customize-sidebar-block-editor';

export default function CustomizeSidebarBlockEditor( { sidebar } ) {
	const [ blocks, onInput, onChange ] = useCustomizeSidebarBlockEditor(
		sidebar
	);

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
