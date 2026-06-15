# BlockEditorProvider

BlockEditorProvider is a component which establishes a new block editing context, and serves as the entry point for a new block editor. It is implemented as a [controlled input](https://reactjs.org/docs/forms.html#controlled-components), expected to receive a value of a blocks array, calling `onChange` and/or `onInput` when the user interacts to change blocks in the editor. It is intended to be used as a wrapper component, where its children comprise the user interface through which a user modifies the blocks value, notably via other components made available from this `block-editor` module.

## Props

### `value`

-   **Type:** `Array`
-   **Required** `no`

The current array of blocks.

### `onChange`

-   **Type:** `Function`
-   **Required** `no`

A callback invoked when the blocks have been modified in a persistent manner. Contrasted with `onInput`, a "persistent" change is one which is not an extension of a composed input. Any update to a distinct block or block attribute is treated as persistent.

The distinction between these two callbacks is akin to the [differences between `input` and `change` events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) in the DOM API:

> The input event is fired every time the value of the element changes. **This is unlike the change event, which only fires when the value is committed**, such as by pressing the enter key, selecting a value from a list of options, and the like.

In the context of an editor, an example usage of this distinction is for managing a history of blocks values (an "Undo"/"Redo" mechanism). While value updates should always be reflected immediately (`onInput`), you may only want history entries to reflect change milestones (`onChange`).

### `onInput`

-   **Type:** `Function`
-   **Required** `no`

A callback invoked when the blocks have been modified in a non-persistent manner. Contrasted with `onChange`, a "non-persistent" change is one which is part of a composed input. Any sequence of updates to the same block attribute are treated as non-persistent, except for the first.

### `children`

-   **Type:** `Element`
-   **Required** `no`

Children elements for which the BlockEditorProvider context should apply.
