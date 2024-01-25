<?php
/**
 * HTML for testing the directive `data-wp-watch`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-watch-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-watch" }'>
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

	<button data-testid="toggle" data-wp-on--click="actions.toggle">
		Update
	</button>

	<button data-testid="increment" data-wp-on--click="actions.increment">
		Increment
	</button>
</div>
