/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { registerCoreBlocks } from '@wordpress/block-library';
import {
	BlockEditorProvider,
	BlockCanvas,
	BlockToolbar,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { editorStyles, blockLibraryContentStyles } from '../editor-styles';
import './style.css';

const contentStyles = [ ...blockLibraryContentStyles, ...editorStyles ];

export default function EditorBox() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="editor-box"
			onKeyDown={ ( event ) => event.stopPropagation() }
		>
			<BlockEditorProvider
				value={ blocks }
				onInput={ updateBlocks }
				onChange={ updateBlocks }
				settings={ {
					hasFixedToolbar: true,
				} }
			>
				<BlockToolbar hideDragHandle />
				<BlockCanvas height="500px" styles={ contentStyles } />
			</BlockEditorProvider>
		</div>
	);
}
