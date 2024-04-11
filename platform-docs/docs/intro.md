---
sidebar_position: 1
---

# Getting Started

Let's discover how to use the **Gutenberg Block Editor** to build your own block editor in less than 10 minutes**.


## What you'll need

- [Node.js](https://nodejs.org/en/download/) version 20.10 or above.
- We're going to be using "vite" to setup our single page application (SPA) that contains a block editor. You can use your own setup, and your own application for this.

## Preparing the SPA powered by Vite.

First bootstrap a vite project using `npm create vite@latest` and pick `Vanilla` variant and `JavaScript` as a language.

Once done, you can navigate to your application folder and run it locally using `npm run dev`. Open the displayed local URL in a browser.

## Installing dependencies

To build a block editor, you need to install the following dependencies:

 - `@wordpress/block-editor`
 - `@wordpress/block-library`
 - `@wordpress/components`

## JSX

We're going to be using JSX to write our UI and components. So one of the first steps we need to do is to configure our build tooling, By default vite supports JSX and and outputs the result as a React pragma. The Block editor uses React so there's no need to configure anything here but if you're using a different bundler/build tool, make sure the JSX transpilation is setup properly.

## Bootstrap your block editor

It's time to render our first block editor.

 - Update your `index.jsx` file with the following code:
```jsx
import { createElement, useState } from "react";
import { createRoot } from 'react-dom/client';
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
    /*
      The BlockEditorProvider is the wrapper of the block editor's state.
      All the UI elements of the block editor need to be rendered within this provider.
    */
    <BlockEditorProvider
      value={blocks}
      onChange={setBlocks}
      onInput={setBlocks}
    >
      {/*
          The BlockCanvas component renders the block list within an iframe
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

That's it! You now have a very basic block editor with several block types included by default: paragraphs, headings, lists, quotes, images...
