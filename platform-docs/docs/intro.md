---
sidebar_position: 1
---

# Getting Started

Let's discover how to use the **Gutenberg Block Editor** to build your own block editor in less than 10 minutes**.


## What you'll need

- [Node.js](https://nodejs.org/en/download/) version 20.10 or above.
- We're going to be using "Vite" to setup our single page application (SPA) that contains a block editor. You can use your own setup, and your own application for this.

## Preparing the SPA powered by Vite.

First bootstrap a Vite project using `npm create vite@latest` and pick `React` variant and `JavaScript` as a language.

Once done, you can navigate to your application folder and run it locally using `npm run dev`. Open the displayed local URL in a browser.

## Installing dependencies

To build a block editor, you need to install the following dependencies:

 - `@wordpress/blocks`
 - `@wordpress/block-editor`
 - `@wordpress/block-library`
 - `@wordpress/components`

## Appease package expectations

The package `@wordpress/block-library` expects an env variable `IS_GUTENBERG_PLUGIN` to be defined. The quickest way to meet this requirement is to add it with `define` to the Vite config in `vite.config.js`. If using another bundler/build tool refer to its documentation for how to do this.

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // highlight-next-line
  define: { 'process.env.IS_GUTENBERG_PLUGIN': false },
  plugins: [react()],
})
```

## JSX

We're going to be using JSX to write our UI and components as the block editor is built with React. Using the Vite bootstrap described above there’s no need to configure anything as it outputs the result as a React pragma. If you're using a different bundler/build tool, you may need to configure the JSX transpilation to do the same.

## Bootstrap your block editor

It's time to render our first block editor. Update your `src/App.jsx` file with the following code:

```jsx
import { useState } from "react";
import {
  BlockEditorProvider,
  BlockCanvas,
} from "@wordpress/block-editor";
import { registerCoreBlocks } from "@wordpress/block-library";
import { getBlockTypes } from "@wordpress/blocks";

// Default styles that are needed for the editor.
import componentsStyles from "@wordpress/components/build-style/style.css?raw";
import blockEditorStyles from "@wordpress/block-editor/build-style/style.css?raw";
import blockEditorContentStyles from "@wordpress/block-editor/build-style/content.css?raw";

// Default styles that are needed for the core blocks.
import blocksCommonStyles from "@wordpress/block-library/build-style/common.css?raw";
import blocksStyles from "@wordpress/block-library/build-style/style.css?raw";
import blocksEditorStyles from "@wordpress/block-library/build-style/editor.css?raw";

const styles = `
  ${ componentsStyles }
  ${ blockEditorStyles }
  ${ blockEditorContentStyles }
  ${ blocksCommonStyles }
  ${ blocksStyles }
  ${ blocksEditorStyles }
`;

const registeredBlockTypes = getBlockTypes();
// Registers the default core block types, avoiding doing so again during HMR.
if (
  ! registeredBlockTypes.length ||
  ! registeredBlockTypes.some((blockType) => blockType.name.startsWith('core/'))
) registerCoreBlocks();

export default function Editor() {
  const [blocks, setBlocks] = useState([]);
  return (
    <>
      <style>{ styles }</style>
      {/*
        The BlockEditorProvider is the wrapper of the block editor's state.
        All the UI elements of the block editor need to be rendered within this provider.
      */}
      <BlockEditorProvider
        value={blocks}
        onChange={setBlocks}
        onInput={setBlocks}
      >
        {/*
          The BlockCanvas component renders the block list within an iframe
          and wires up all the necessary events to make the block editor work.
        */}
        <BlockCanvas height="500px" styles={ [ { css: styles } ] }/>
      </BlockEditorProvider>
    </>
  );
}
```

That's it! You now have a very basic block editor with several block types included by default: paragraphs, headings, lists, quotes, images...
