<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-on-window-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-on-window" }'>
	<button
		data-wp-on--click="actions.visibilityHandler"
		data-testid="visibility">
		Switch visibility
	</button>
	<div data-wp-text="state.isEventAttached" data-testid="isEventAttached">no</div>
	<div data-wp-show-mock="state.isVisible">
		<div
			data-wp-on-window--resize="callbacks.resizeHandler"
			data-wp-init="callbacks.init"
		>
			<p data-wp-text="state.counter" data-testid="counter">0</p>
		</div>
	</div>
</div>
