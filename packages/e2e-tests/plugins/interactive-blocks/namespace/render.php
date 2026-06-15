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

<div data-wp-interactive="null">
	<a data-wp-bind--href="state.url" data-testid="null namespace"></a>
</div>

<div data-wp-interactive="2">
	<a data-wp-bind--href="state.url" data-testid="number namespace"></a>
</div>

<div data-wp-interactive>
	<a data-wp-bind--href="other::state.url" data-testid="other namespace"></a>
</div>

<div data-wp-interactive="true">
	<a data-wp-bind--href="state.url" data-testid="true namespace"></a>
</div>

<div data-wp-interactive="false">
	<a data-wp-bind--href="state.url" data-testid="false namespace"></a>
</div>
<div data-wp-interactive="[]">
	<a data-wp-bind--href="state.url" data-testid="[] namespace"></a>
</div>
<div data-wp-interactive='"quoted string"'>
	<a data-wp-bind--href="state.url" data-testid="quoted namespace"></a>
</div>
