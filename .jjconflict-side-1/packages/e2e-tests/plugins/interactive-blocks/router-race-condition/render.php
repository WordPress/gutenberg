<?php
/**
 * HTML for testing the router hydration race condition.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>
<div
	data-wp-interactive="router-race-condition"
	data-wp-router-region="router-race-condition/buttons"
	data-wp-context='{ "counter": 0 }'
>
	<button
		data-testid="context-counter"
		data-wp-text="context.counter"
		data-wp-on--click="actions.increment"
	>0</button>

	<button
		data-testid="global-counter"
		data-wp-text="state.counter"
		data-wp-on--click="actions.incrementGlobal"
	>0</button>
</div>
