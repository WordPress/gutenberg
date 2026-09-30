<?php
/**
 * HTML for testing the directive `data-wp-watch`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="directive-watch">
	<div data-wp-show-mock="state.isOpen">
		<input
			data-testid="input"
			data-wp-watch="callbacks.elementAddedToTheDOM"
		/>
	</div>

	<div
		data-wp-text="state.elementInTheDOM"
		data-testid="element in the DOM"
	></div>

	<div data-wp-watch="callbacks.changeFocus"></div>

	<div
		data-testid="short-circuit infinite loops"
		data-wp-watch="callbacks.infiniteLoop"
		data-wp-text="state.counter"
	>
		0
	</div>

	<div
		data-testid="multiple watches"
		data-wp-watch--one="callbacks.watch1"
		data-wp-watch---two="callbacks.watch2"
		data-wp-bind--data-watch-one="state.watch1"
		data-wp-bind--data-watch-two="state.watch2"
	></div>

	<button data-testid="toggle" data-wp-on--click="actions.toggle">
		Update
	</button>

	<button data-testid="increment" data-wp-on--click="actions.increment">
		Increment
	</button>
</div>
