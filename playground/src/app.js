/**
 * External dependencies
 */
import { hot } from 'react-hot-loader';

/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockInspector,
	BlockList,
	ObserveTyping,
	WritingFlow,
} from '@wordpress/block-editor';
import {
	Button,
	DropZoneProvider,
	Popover,
	SlotFillProvider,
} from '@wordpress/components';
import { useState } from '@wordpress/element';

function App() {
	const [ blocks, updateBlocks ] = useState( [] );
	return (
		<>
			<div className="playground__header">
				<h1 className="playground__logo">Gutenberg Playground</h1>
				<Button isLarge href="design-system/components" target="_blank">
					Design System Components
				</Button>
			</div>
			<div className="playground__body">
				<SlotFillProvider>
					<DropZoneProvider>
						<BlockEditorProvider
							value={ blocks }
							onInput={ updateBlocks }
							onChange={ updateBlocks }
						>
							<div className="playground__sidebar">
								<BlockInspector />
							</div>
							<div className="editor-styles-wrapper">
								<BlockEditorKeyboardShortcuts />
								<WritingFlow>
									<ObserveTyping>
										<BlockList />
									</ObserveTyping>
								</WritingFlow>
							</div>
							<Popover.Slot />
						</BlockEditorProvider>
					</DropZoneProvider>
				</SlotFillProvider>
			</div>
		</>
	);
}
export default hot( module )( App );
