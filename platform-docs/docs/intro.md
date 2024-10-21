---
sidebar_position: 1
---

# Getting Started

Let's discover how to use the **Gutenberg Block Editor** to build your own block editor in less than 10 minutes.

## What you'll need

-   [Node.js](https://nodejs.org/en/download/) version 20.10 or above.
-   We're going to be using "vite" to setup our single page application (SPA) that contains a block editor. You can use your own setup, and your own application for this.

## Preparing the SPA powered by Vite.

First bootstrap a vite project using `npm create vite@latest` and pick `React` variant and `JavaScript` as a language.

Once done, you can navigate to your application folder, install dependencies
using `npm install` and run it locally using `npm run dev`. Open the displayed local URL in a
browser.

## Installing dependencies

To build a block editor, you need to install the following dependencies:

-   `@wordpress/block-editor`
-   `@wordpress/block-library`
-   `@wordpress/components`

## JSX

We're going to be using JSX to write our UI and components. So one of the first steps we need to do is to configure our build tooling, By default vite supports JSX and and outputs the result as a React pragma. The Block editor uses React so there's no need to configure anything here but if you're using a different bundler/build tool, make sure the JSX transpilation is setup properly.

## Side note: `process.env.IS_GUTENBERG_PLUGIN`

The Gutenberg block editor reads from the `process.env.IS_GUTENBERG_PLUGIN`
variable for example in the `@wordpress/block-library` package. This feature
is used to distinguish the code that is part of the Gutenberg block editor
[plugin](https://wordpress.org/plugins/gutenberg/) and the code that is part of
WordPress Core.

For our purposes, as we're building a standalone block editor that is completely
separate from WordPress, we want to set this variable to `false`.

When using Vite, we can do it by updating the `vite.config.js` file. It should
now look like this:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig( {
	plugins: [ react() ],
	define: {
		'process.env.IS_GUTENBERG_PLUGIN': JSON.stringify( false ),
	},
} );
```

If you are using Webpack, you can use the
[DefinePlugin](https://webpack.js.org/plugins/define-plugin/) to accomplish the
same thing.

## Bootstrap your block editor

It's time to render our first block editor. Update your `main.jsx` file with the following code:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Editor } from './Editor.jsx';

import { registerCoreBlocks } from '@wordpress/block-library';

// Default styles that are needed for the editor.
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';

// Default styles that are needed for the core blocks.
import '@wordpress/block-library/build-style/common.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';

// Register the default core block types.
registerCoreBlocks();

ReactDOM.createRoot( document.getElementById( 'root' ) ).render(
	<React.StrictMode>
		<Editor />
	</React.StrictMode>
);
```

Next, create an `Editor.jsx` file and add the following code:

```jsx
import { useState } from 'react';
import { BlockEditorProvider, BlockCanvas } from '@wordpress/block-editor';

export function Editor() {
	const [ blocks, setBlocks ] = useState( [] );
	return (
		/*
      The BlockEditorProvider is the wrapper of the block editor's state.
      All the UI elements of the block editor need to be rendered within this provider.
    */
		<BlockEditorProvider
			value={ blocks }
			onChange={ setBlocks }
			onInput={ setBlocks }
		>
			{ /*
          The BlockCanvas component renders the block list within an iframe
          and wire up all the necessary events to make the block editor work.
        */ }
			<BlockCanvas height="500px" />
		</BlockEditorProvider>
	);
}
```

You can remove all the other files in the `src` directory, we only need
`main.jsx` and `Editor.jsx`.

That's it! You now have a very basic block editor with several block types
included by default: paragraphs, headings, lists, quotes, images...
