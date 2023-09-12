/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	BlockCanvas,
	BlockEditorProvider,
	BlockTools,
	BlockInspector,
} from '@wordpress/block-editor';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */
import styles from './style.lazy.scss';
import { editorStyles } from './editor-styles';

function App() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	// Ensures that the CSS intended for the playground (especially the style resets)
	// are only loaded for the playground and don't leak into other stories.
	useEffect( () => {
		styles.use();

		return styles.unuse;
	} );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="playground"
			onKeyDown={ ( event ) => event.stopPropagation() }
		>
			<BlockEditorProvider
				value={ blocks }
				onInput={ updateBlocks }
				onChange={ updateBlocks }
			>
				<div className="playground__sidebar">
					<BlockInspector />
				</div>
				<BlockTools className="playground__content">
					<BlockCanvas height="100%" styles={ editorStyles } />
				</BlockTools>
			</BlockEditorProvider>
		</div>
	);
}

export default {
	title: 'Playground/Block Editor',
	parameters: {
		sourceLink: 'storybook/stories/playground',
	},
};

export const _default = () => {
	return <App />;
};

function EditorBox() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="editor-box"
			style={ { border: '1px solid #eee' } }
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
				<BlockTools />
				<BlockCanvas height="100%" styles={ editorStyles } />
			</BlockEditorProvider>
		</div>
	);
}

export const Box = () => {
	return <EditorBox />;
};
