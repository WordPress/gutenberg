# Autocomplete

<p class="callout callout-alert">This component is deprecated and no longer provides autocompletion: it renders its children as they are. In the block editor, pass completers to the `RichText` component through its `autocompleters` prop.</p>

This component is used to provide autocompletion support for a child input component.

## Props

The following props are used to control the behavior of the component.

### record

The rich text value object the autocompleter is being applied to.

-   Required: Yes
-   Type: `RichTextValue`

### onChange

A function to be called when an option is selected to insert into the existing text.

-   Required: Yes
-   Type: `( value: string ) => void`

### onReplace

A function to be called when an option is selected to replace the existing text.

-   Required: Yes
-   Type: `( values: RichTextValue[] ) => void`

### completers

An array of all of the completers to apply to the current element.

-   Required: Yes
-   Type: `Array< WPCompleter >`

### contentRef

A ref containing the editable element that will serve as the anchor for `Autocomplete`'s `Popover`.

-   Required: Yes
-   `MutableRefObject< HTMLElement | undefined >`

### children

A function that returns nodes to be rendered within the Autocomplete.

-   Required: Yes
-   Type: `Function`

### isSelected

Whether or not the Autocomplete component is selected, and if its `Popover` should be displayed.

- Required: Yes
- Type: `Boolean`

## Usage

The `Autocomplete` component is not currently intended to be used as a standalone component. It is used by other packages to provide autocompletion support for the block editor.

The block editor provides a separate, wrapped version of `Autocomplete` that supports the addition of custom completers via a filter.

To implement your own completer in the block editor you will:
1. Define the completer
2. Write a callback that will add your completer to the list of existing completers
3. Add a filter to the `editor.Autocomplete.completers` hook that will call your callback

The following example will add a contrived "fruits" autocompleter to the block editor. Note that in the callback it's possible to limit this new completer to a specific block type. In this case, our "fruits" completer will only be available from the "core/paragraph" block type.

```js
( function () {
	// Define the completer
	const fruits = {
		name: 'fruit',
		// The prefix that triggers this completer
		triggerPrefix: '~',
		// The option data
		options: [
			{ visual: '🍎', name: 'Apple', id: 1 },
			{ visual: '🍊', name: 'Orange', id: 2 },
			{ visual: '🍇', name: 'Grapes', id: 3 },
			{ visual: '🥭', name: 'Mango', id: 4 },
			{ visual: '🍓', name: 'Strawberry', id: 5 },
			{ visual: '🫐', name: 'Blueberry', id: 6 },
			{ visual: '🍒', name: 'Cherry', id: 7 },
		],
		// Returns a label for an option like "🍊 Orange"
		getOptionLabel: ( option ) => `${ option.visual } ${ option.name }`,
		// Declares that options should be matched by their name
		getOptionKeywords: ( option ) => [ option.name ],
		// Declares that the Grapes option is disabled
		isOptionDisabled: ( option ) => option.name === 'Grapes',
		// Declares completions should be inserted as abbreviations
		getOptionCompletion: ( option ) => option.visual,
	};

	// Define a callback that will add the custom completer to the list of completers
	function appendTestCompleters( completers, blockName ) {
		return blockName === 'core/paragraph'
			? [ ...completers, fruits ]
			: completers;
	}

	// Trigger our callback on the `editor.Autocomplete.completers` hook
	wp.hooks.addFilter(
		'editor.Autocomplete.completers',
		'fruit-test/fruits',
		appendTestCompleters,
		11
	);
} )();
```

Finally, enqueue your JavaScript file as you would any other, as in the following plugin example:

```php
<?php
/**
 * Plugin Name: Fruit Autocompleter
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 */

/**
 * Registers a custom script for the plugin.
 */
function enqueue_fruit_autocompleter_plugin_script() {
	wp_enqueue_script(
		'fruit-autocompleter',
		plugins_url( '/index.js', __FILE__ ),
		array(
			'wp-hooks',
		),
	);
}

add_action( 'init', 'enqueue_fruit_autocompleter_plugin_script' );
```
