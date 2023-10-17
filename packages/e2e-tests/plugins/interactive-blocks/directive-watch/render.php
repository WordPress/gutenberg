<?php
/**
 * HTML for testing the directive `data-wp-watch`.
 *
 * @package gutenberg-test-interactive-blocks
 */

?>
<div data-wp-interactive='{ "namespace": "directive-watch" }'>
	<div data-wp-show-mock="state.isOpen">
		<input
			data-testid="input"
			data-wp-watch="effects.elementAddedToTheDOM"
		/>
	</div>

	<div
		data-wp-text="state.elementInTheDOM"
		data-testid="element in the DOM"
	></div>

	<div data-wp-watch="effects.changeFocus"></div>

	<div
		data-testid="short-circuit infinite loops"
		data-wp-watch="effects.infiniteLoop"
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
