<?php
/**
 * HTML for testing the negation operator in directives.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="negation-operator">
	<button
		data-wp-on--click="actions.toggle"
		data-testid="toggle active value"
	>
		Toggle Active Value
	</button>

	<div
		data-wp-bind--hidden="!state.active"
		data-testid="add hidden attribute if state is not active"
	></div>

	<div
		data-wp-bind--hidden="!state.isActive"
		data-testid="add hidden attribute if selector is not active"
	></div>
</div>
