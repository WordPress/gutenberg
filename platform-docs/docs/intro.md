---
sidebar_position: 1
---

# Getting Started

Let's discover **Gutenberg as a Platform in less than 10 minutes**.


## What you'll need

- [Node.js](https://nodejs.org/en/download/) version 16.14 or above.
- We're going to be using "vite" to setup our SPA that contains a block editor. You can use your own setup, and your own application for this.

## Preparing the SPA powered by Vite.

First bootstrap a vite project using `npm create vite@latest` and pick `Vanilla` variant and `JavaScript` as a language.

Once done, you should be able to navigate to your application folder and run it locally using `npm run dev` and opening the displayed local URL in the browser.

## Installing dependencies

To build a block editor, you need to install the following dependencies

 - `@wordpress/block-editor`
 - `@wordpress/element`
 - `@wordpress/block-library`
 - `@wordpress/components`

## Setup vite to use JSX and @wordpress/element as a pragma

We're going to be using JSX to write our UI and components. So one of the first step we need to do is to configure our build tooling properly to be able to do so.

If you're using vite, you can create a `vite.config.js` file at the root of your application and paste the following content:

```js
// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
  },
  define: {
    // This is not necessary to make JSX work 
    // but it's a requirement for some @wordpress packages.
    'process.env': {}
  },
})
```

With the config above, you should be able to write JSX in your `*.jsx` files, just make sure you import createElement and Fragment at the top of each of your files: `import { createElement, Fragment } from '@wordpress/element';`

We can now check that everything is working as expected:

 - Remove the default content created by vite: `main.js` and `counter.js` files.
 - Create an `index.jsx` file at the root of your application containing some JSX, example:
```jsx
import { createRoot, createElement } from '@wordpress/element';

// Render your React component instead
const root = createRoot(document.getElementById('app'));
root.render(<h1>Hello, world</h1>);
```
 - Update the script file in your `index.html` to `index.jsx` instead of `main.js`.

After restarting your local build (aka `npm run dev`), you should see the Hello world heading appearing in your browser.

## Bootstrap your block editor

It's time to render our first block editor.

 - Update your `index.jsx` file with the following code:
```jsx
import { createRoot, createElement, useState } from "@wordpress/element";
import {
  BlockEditorProvider,
  BlockCanvas,
} from "@wordpress/block-editor";
import { registerCoreBlocks } from "@wordpress/block-library";

// Default styles that are needed for the editor.
import "@wordpress/components/build-style/style.css";
import "@wordpress/block-editor/build-style/style.css";

// Default styles that are needed for the core blocks.
import "@wordpress/block-library/build-style/common.css";
import "@wordpress/block-library/build-style/style.css";
import "@wordpress/block-library/build-style/editor.css";

// Register the default core block types.
registerCoreBlocks();

function Editor() {
  const [blocks, setBlocks] = useState([]);
  return (
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
          The BlockCanvas component render the block list within an iframe
          and wire up all the necessary events to make the block editor work.
        */}
      <BlockCanvas height="500px" />
    </BlockEditorProvider>
  );
}

// Render your React component instead
const root = createRoot(document.getElementById("app"));
root.render(<Editor />);
```

That's it, you now have a very basic block editor with several block types included by default: paragraphs, headings, lists, quotes, images...