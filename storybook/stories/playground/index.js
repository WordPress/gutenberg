/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import {
	Popover,
	SlotFillProvider,
	__experimentalSlotFillProvider as SlotFillProvider2,
	DropZoneProvider,
} from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
import './style.scss';

function App() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
		<div className="playground">
			<SlotFillProvider>
				<SlotFillProvider2>
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
				</SlotFillProvider2>
			</SlotFillProvider>
		</div>
	);
}

export default {
	title: 'Playground/Block Editor',
};

export const _default = () => {
	return <App />;
};
