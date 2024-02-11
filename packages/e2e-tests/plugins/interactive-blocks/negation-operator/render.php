<?php
/**
 * HTML for testing the negation operator in directives.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'negation-operator-view' );
?>

<div data-wp-interactive='{ "namespace": "negation-operator" }'>
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
