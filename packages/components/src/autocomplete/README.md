# Autocomplete

This component is used to provide autocompletion support for a child input component.

## Props

The following props are used to control the behavior of the component.

### record

The rich text value object the autocomleter is being applied to.

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

Whether or not the Autocomplte componenet is selected, and if its `Popover` should be displayed.

- Required: Yes
- Type: `Boolean`

## Autocompleters

Autocompleters enable us to offer users options for completing text input. For example, Gutenberg includes a user autocompleter that provides a list of user names and completes a selection with a user mention like `@mary`.

Each completer declares:

-   Its name.
-   The text prefix that should trigger the display of completion options.
-   Raw option data.
-   How to render an option's label.
-   An option's keywords, words that will be used to match an option with user input.
-   What the completion of an option looks like, including whether it should be inserted in the text or used to replace the current block.

In addition, a completer may optionally declare:

-   A class name to be applied to the completion menu.
-   Whether it should apply to a specified text node.
-   Whether the completer applies in a given context, defined via a Range before and a Range after the autocompletion trigger and query.

### The Completer Interface

#### name

The name of the completer. Useful for identifying a specific completer to be overridden via extensibility hooks.

-   Type: `String`
-   Required: Yes

#### options

The raw options for completion. May be an array, a function that returns an array, or a function that returns a promise for an array.

Options may be of any type or shape. The completer declares how those options are rendered and what their completions should be when selected.

-   Type: `Array|Function`
-   Required: Yes

#### triggerPrefix

The string prefix that should trigger the completer. For example, Gutenberg's block completer is triggered when the '/' character is entered.

-   Type: `String`
-   Required: Yes

#### getOptionLabel

A function that returns the label for a given option. A label may be a string or a mixed array of strings, elements, and components.

-   Type: `Function`
-   Required: Yes

#### getOptionKeywords

A function that returns the keywords for the specified option.

-   Type: `Function`
-   Required: No

#### isOptionDisabled

A function that returns whether or not the specified option should be disabled. Disabled options cannot be selected.

-   Type: `Function`
-   Required: No

#### getOptionCompletion

A function that takes an option and responds with how the option should be completed. By default, the result is a value to be inserted in the text. However, a completer may explicitly declare how a completion should be treated by returning an object with `action` and `value` properties. The `action` declares what should be done with the `value`.

There are currently two supported actions:

-   "insert-at-caret" - Insert the `value` into the text (the default completion action).
-   "replace" - Replace the current block with the block specified in the `value` property.

#### allowContext

A function that takes a Range before and a Range after the autocomplete trigger and query text and returns a boolean indicating whether the completer should be considered for that context.

-   Type: `Function`
-   Required: No

#### className

A class name to apply to the autocompletion popup menu.

-   Type: `String`
-   Required: No

#### isDebounced

Whether to apply debouncing for the autocompleter. Set to true to enable debouncing.

-   Type: `Boolean`
-   Required: No

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
