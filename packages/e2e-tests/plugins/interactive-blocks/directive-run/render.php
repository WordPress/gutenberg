<?php
/**
 * HTML for testing the directive `data-wp-run`.
 *
 * @package gutenberg-test-interactive-blocks
 */

gutenberg_enqueue_module( 'directive-run-view' );
?>

<div
	data-wp-interactive='{ "namespace": "directive-run" }'
	data-wp-navigation-id='test-directive-run'
>
	<div data-testid="hydrated" data-wp-text="state.isHydrated"></div>
	<div data-testid="mounted" data-wp-text="state.isMounted"></div>
	<div data-testid="renderCount" data-wp-text="state.renderCount"></div>
	<div data-testid="navigated">no</div>

	<div
		data-wp-run--hydrated="callbacks.updateIsHydrated"
		data-wp-run--renderCount="callbacks.updateRenderCount"
		data-wp-text="state.clickCount"
	></div>

	<div data-wp-show-mock="state.isOpen">
		<div
			data-wp-run="callbacks.updateIsMounted"
			data-wp-run--hooks="callbacks.runHooks"
		></div>
	</div>

	<button data-testid="toggle" data-wp-on--click="actions.toggle">
		Toggle
	</button>

	<button data-testid="increment" data-wp-on--click="actions.increment">
		Increment
	</button>

	<button data-testid="navigate" data-wp-on--click="actions.navigate">
		Navigate
	</button>
</div>
