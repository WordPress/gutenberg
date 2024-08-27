<?php
/**
 * HTML for testing the `store` function.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="test/get-element">
	<div
		data-testid="read from attributes"
		data-some-value="Initial value"
		data-wp-bind--data-some-value="state.dataSomeValue"
		data-wp-text="state.someValue"
	></div>
	<button
		data-testid="mutate DOM"
 		data-wp-on-async--click="actions.mutateDOM"
	>
		Mutate via DOM manipulation
	</button>
	<button
		data-testid="mutate prop"
 		data-wp-on-async--click="actions.mutateProp"
	>
		Mutate via data-wp-bind
	</button>
</div>
