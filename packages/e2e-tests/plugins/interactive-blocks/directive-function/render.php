<?php
/**
 * HTML for testing the directive function.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-function">
	<button
		data-testid="async directive"
		style="background-color:white"
		data-wp-async-bg-color="state.colors"
	>Click me!</button>

	<button
		data-testid="async directive with others"
		style="background-color:white"
		data-wp-async-bg-color="state.colors"
		data-wp-context='{"count": 0}'
		data-wp-text="context.count"
		data-wp-on--click="actions.updateCount"
	>0</button>

	<button
		data-testid="load async directive"
		data-wp-on--click="actions.loadAsyncDirective"
	>Load async directive</button>
</div>
