<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */

gutenberg_enqueue_module( 'directive-on-window-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-on-window" }' data-wp-context='{"isVisible":true}'>
	<button data-wp-on--click="actions.visibilityHandler" data-testid="visibility">Switch visibility</button>
	<div data-wp-show-mock="context.isVisible">
		<div data-wp-on-window--resize="callbacks.resizeHandler">
			<p data-wp-text="state.counter" data-testid="counter">0</p>
		</div>
	</div>
</div>
