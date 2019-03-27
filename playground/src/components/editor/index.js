
/**
 * WordPress dependencies
 */
import '@wordpress/editor'; // This shouldn't be necessary

import { useEffect, useState } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockList,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/* eslint-disable no-restricted-syntax */
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';
import '@wordpress/format-library/build-style/style.css';
/* eslint-enable no-restricted-syntax */

function Editor() {
	const [ blocks, updateBlocks ] = useState( [] );
	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
		<div className="editor">
			<BlockEditorProvider
				value={ blocks }
				onInput={ updateBlocks }
				onChange={ updateBlocks }
			>
				<div className="editor-styles-wrapper">
					<WritingFlow>
						<ObserveTyping>
							<BlockList />
						</ObserveTyping>
					</WritingFlow>
				</div>
				<Popover.Slot />
			</BlockEditorProvider>
		</div>
	);
}

export default Editor;
