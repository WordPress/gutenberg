<?php
/**
 * HTML for testing the `store` function.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="test/store">
	<div data-wp-text="state.0" data-testid="state-0"></div>
	<div
		data-testid="non-plain object"
		data-wp-text="state.isNotProxified"
		data-wp-init="callbacks.init"
	></div>
</div>
