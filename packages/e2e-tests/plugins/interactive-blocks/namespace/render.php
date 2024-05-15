<?php
/**
 * HTML for testing the directive `data-wp-bind`.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div data-wp-interactive="">
	<a data-wp-bind--href="state.url" data-testid="empty namespace"></a>
</div>

<div data-wp-interactive="namespace">
	<a data-wp-bind--href="state.url" data-testid="correct namespace"></a>
</div>

<div data-wp-interactive="{}">
	<a data-wp-bind--href="state.url" data-testid="object namespace"></a>
</div>

<div data-wp-interactive>
	<a data-wp-bind--href="other::state.url" data-testid="other namespace"></a>
</div>
