/**
 * WordPress dependencies
 */
import '@wordpress/editor'; // This shouldn't be necessary

import { useState } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import {
	Button,
	Popover,
	SlotFillProvider,
	DropZoneProvider,
} from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
// import './style.scss';

/* eslint-disable no-restricted-syntax */
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';
import '@wordpress/format-library/build-style/style.css';
/* eslint-enable no-restricted-syntax */

// TODO: Find a way to include those fonts.
// <link href="https://fonts.googleapis.com/css?family=Noto+Serif:400,700" rel="stylesheet">

function App() {
	const [ blocks, updateBlocks ] = useState( [] );

	return (
		<>
			<div className="playground__header">
				<h1 className="playground__logo">Gutenberg Playground</h1>
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

export default {
	title: 'Playground|Block Editor',
};

export const _default = () => {
	registerCoreBlocks();

	return <App />;
};
