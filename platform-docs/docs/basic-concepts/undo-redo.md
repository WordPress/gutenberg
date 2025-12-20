---
sidebar_position: 6
---

# Undo Redo

## Undo/Redo using `useStateWithHistory`

By default, the block editor doesn't enable undo/redo. This is because in most scenarios, the block editor is rendered as part of a larger application that already has its own undo/redo functionality. However, to help you implement undo/redo in your application, the block editor provides a set of APIs that you can use.

The simplest approach is to rely on the `useStateWithHistory` hook provided by the `@wordpress/compose` package. This hook is a wrapper around the `useState` hook that adds undo/redo functionality to the state. 

First, make sure you add the `@wordpress/compose` package to your dependencies, then use the hook like so:

```jsx
import { useStateWithHistory } from '@wordpress/compose';
import { createElement, useState } from "react";
import { createRoot } from 'react-dom/client';
import {
  BlockEditorProvider,
  BlockCanvas,
} from "@wordpress/block-editor";

function Editor() {
	const { value, setValue, hasUndo, hasRedo, undo, redo } =
		useStateWithHistory( { blocks: [] } );

	return (
        <BlockEditorProvider
            value={ value.blocks }
            selection={ value.selection }
            onInput={ ( blocks, { selection } ) =>
                setValue( { blocks, selection }, true )
            }
            onChange={ ( blocks, { selection } ) =>
                setValue( { blocks, selection }, false )
            }
        >
            <div className="undo-redo-toolbar">
                <button onClick={ undo } disabled={ ! hasUndo }>
                    Undo
                </button>
                <button onClick={ redo } disabled={ ! hasRedo }>
                    Redo
                </button>
            </div>
            <BlockCanvas />
        </BlockEditorProvider>
	);
}
```

The `useStateWithHistory` hook returns an object with the following properties:

- `value`: the current value of the state.
- `setValue`: a function that can be used to update the state.
- `hasUndo`: a boolean indicating whether there are any actions that can be undone.
- `hasRedo`: a boolean indicating whether there are any actions that can be redone.
- `undo`: a function that can be used to undo the last action.
- `redo`: a function that can be used to redo the last action.

Notice that in addition to the `blocks` property, the `value` object also tracks a `selection` property. This property is used to store and control the cursor position within the block editor. This allows the editor to restore the right position when undoing or redoing changes.

## Going Further...

Oftentimes, editors allow to track changes across multiple objects and properties. For instance, a basic writing experience might allow editing the title of a post in a normal input and the content of the post in the block editor. Or your editor might allow edits to related objects like categories, tags, etc... In these cases, you might want to implement undo/redo functionality that can be used to track changes across all of these objects and properties.

The `useStateWithHistory` might not always be the right approach in these situations. Consider checking the `@wordpress/undo-manager` package that offers a lower level undo manager that can be adapted more easily to your specific needs.
