<?php
/**
 * HTML for testing the directive `data-wp-style`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-style-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-style" }'>
	<button
		data-wp-on--click="actions.toggleColor"
		data-testid="toggle color"
	>
		Toggle Color
	</button>

	<button
		data-wp-on--click="actions.switchColorToFalse"
		data-testid="switch color to false"
	>
		Switch Color to False
	</button>

	<div
		style="color: red; background: green;"
		data-wp-style--color="state.color"
		data-testid="dont change style if callback returns same value on hydration"
	>Don't change style if callback returns same value on hydration</div>

	<div
		style="color: blue; background: green;"
		data-wp-style--color="state.falseValue"
		data-testid="remove style if callback returns falsy value on hydration"
	>Remove style if callback returns falsy value on hydration</div>

	<div
		style="color: blue; background: green;"
		data-wp-style--color="state.color"
		data-testid="change style if callback returns a new value on hydration"
	>Change style if callback returns a new value on hydration</div>

	<div
		style="color: blue; background: green; border: 1px solid black"
		data-wp-style--color="state.falseValue"
		data-wp-style--background="state.color"
		data-wp-style--border="state.border"
		data-testid="handles multiple styles and callbacks on hydration"
	>Handles multiple styles and callbacks on hydration</div>

	<div
		data-wp-style--color="state.color"
		data-testid="can add style when style attribute is missing on hydration"
	>Can add style when style attribute is missing on hydration</div>

	<div
		style="color: red;"
		data-wp-style--color="state.color"
		data-testid="can toggle style"
	>Can toggle style</div>

	<div
		style="color: red;"
		data-wp-style--color="state.color"
		data-testid="can remove style"
	>Can remove style</div>

	<div
		style="color: blue; background: green; border: 1px solid black;"
		data-wp-style--background="state.color"
		data-testid="can toggle style in the middle"
	>Can toggle style in the middle</div>

	<div
		style="background-color: green;"
		data-wp-style--background-color="state.color"
		data-testid="handles styles names with hyphens"
	>Handles styles names with hyphens</div>

	<div data-wp-context='{ "color": "blue" }'>
		<div
			style="color: blue;"
			data-wp-style--color="context.color"
			data-testid="can use context values"
		></div>
		<button
			data-wp-on--click="actions.toggleContext"
			data-testid="toggle context"
		>
			Toggle context
		</button>
	</div>
</div>
