<?php
/**
 * HTML for testing the directive `data-wp-bind`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="test/store">
	<div
		data-testid="non-plain object"
		data-wp-text="state.isNotProxified"
		data-wp-init="callbacks.init"
	></div>
</div>
