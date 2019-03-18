/**
 * External dependencies
 */
import React from 'react';

window.React = React;
/**
 * External dependencies
 */
import '@babel/polyfill';

/**
 * WordPress dependencies
 */
import '@wordpress/editor'; // This shouldn't be necessary

import { render, useState } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockList,
	Inserter,
} from '@wordpress/block-editor';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Styles
 */
/* eslint-disable no-restricted-syntax */
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';
/* eslint-enable no-restricted-syntax */

function App() {
	const [ blocks, updateBlocks ] = useState( [] );

	return (
		<BlockEditorProvider
			value={ blocks } onInput={ updateBlocks } onChange={ updateBlocks }
		>
			<BlockList />
			<Inserter />
		</BlockEditorProvider>
	);
}

registerCoreBlocks();
render(
	<App />,
	document.querySelector( '#app' )
);
