---
sidebar_position: 1
---

# Getting Started

Let's discover how to use the **Gutenberg Block Editor** to build your own block editor in less than 10 minutes.

## What you'll need

- [Node.js](https://nodejs.org/en/download/) version 20.10 or above.
- We're going to be using "Vite" to setup our single page application (SPA) that contains a block editor. You can use your own setup, and your own application for this.

## Preparing the SPA powered by Vite.

First bootstrap a Vite project using `npm create vite@latest` and pick `React` variant and `JavaScript` as a language.

Once done, you can navigate to your application folder and run it locally using `npm run dev`. Open the displayed local URL in a browser.

## Installing dependencies

To build a block editor, you need to install the following dependencies:

 - `@wordpress/block-editor`
 - `@wordpress/block-library`
 - `@wordpress/components`

## JSX

We're going to be using JSX to write our UI and components as the block editor is built with React. Using the Vite bootstrap described above there’s no need to configure anything as it outputs the result as a React pragma. If you're using a different bundler/build tool, you may need to configure the JSX transpilation to do the same.

## Bootstrap your block editor

It's time to render our first block editor. We’ll do this with changes to three files – `index.html`, `src/main.jsx`, and `src/App.jsx`.

First, we’ll add the base styles are for the editor UI. In `index.html` add these styles in the `<head>`:
```html
<link href="node_modules/@wordpress/components/build-style/style.css" rel="stylesheet" vite-ignore/>
<link href="node_modules/@wordpress/block-editor/build-style/style.css" rel="stylesheet" vite-ignore/>
```
:::note

There are more styles needed but can’t be added here because they are for the editor’s content which is in a separate document within an `<iframe>`. We’ll add those styles via the `BlockCanvas` component in a later step.

:::

Next, we’ll add blocks for the editor to work with. In `src/main.jsx` import and call `registerCoreBlocks`:
```js
import { registerCoreBlocks } from '@wordpress/block-library'
registerCoreBlocks();
```

Finally, we’ll put our editor together. In `src/App.jsx` replace the contents with the following code:

```jsx
import { useState } from "react";
import {
  BlockEditorProvider,
  BlockCanvas,
} from "@wordpress/block-editor";

// Base styles for the content within the block canvas iframe.
import componentsStyles from "@wordpress/components/build-style/style.css?raw";
import blockEditorContentStyles from "@wordpress/block-editor/build-style/content.css?raw";
import blocksStyles from "@wordpress/block-library/build-style/style.css?raw";
import blocksEditorStyles from "@wordpress/block-library/build-style/editor.css?raw";

const contentStyles = [
  { css: componentsStyles },
  { css: blockEditorContentStyles },
  { css: blocksStyles },
  { css: blocksEditorStyles },
];

export default function Editor() {
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
        and wires up all the necessary events to make the block editor work.
      */ }
      <BlockCanvas height="500px" styles={ contentStyles } />
    </BlockEditorProvider>
  );
}

```

That's it! You now have a very basic block editor with several block types included by default: paragraphs, headings, lists, quotes, images...
