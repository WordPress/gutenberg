<?php
/**
 * HTML for testing the directive `data-wp-run`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-run-view' );
?>

<div
	data-wp-interactive='{ "namespace": "directive-run" }'
	data-wp-router-region='test-directive-run'
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
</div>

<div data-wp-interactive='{ "namespace": "directive-run" }' >
	<button data-testid="toggle" data-wp-on--click="actions.toggle">
		Toggle
	</button>

	<button data-testid="increment" data-wp-on--click="actions.increment">
		Increment
	</button>

	<button data-testid="navigate" data-wp-on--click="actions.navigate">
		Navigate
	</button>

	<!-- Hook execution results are stored in this element as attributes. -->
	<div
		data-testid="wp-run hooks results"
		data-wp-show-children="state.isOpen"
		data-init=""
		data-watch=""
	>
		<div
			data-wp-run--mounted="callbacks.updateIsMounted"
			data-wp-run--hooks="callbacks.useHooks"
		>
			Element with wp-run using hooks
		</div>
	</div>
</div>
