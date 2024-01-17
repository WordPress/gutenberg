<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */

gutenberg_enqueue_module( 'directive-on-window-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-on-window" }'>
	<div data-wp-on-window--resize="callbacks.resizeHandler">
		<p data-wp-text="state.counter" data-testid="counter">0</p>
	</div>
</div>
