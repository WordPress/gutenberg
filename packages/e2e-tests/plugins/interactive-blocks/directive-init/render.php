<?php
/**
 * HTML for testing the directive `data-wp-init`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-init-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-init" }'>
	<div
		data-testid="single init"
		data-wp-context='{"isReady":[false],"calls":[0]}'
		data-wp-init="actions.initOne"
	>
		<p data-wp-text="state.isReady" data-testid="isReady">false</p>
		<p data-wp-text="state.calls" data-testid="calls">0</p>
		<button data-wp-on--click="actions.reset">reset</button>
	</div>
	<div
		data-testid="multiple inits"
		data-wp-context='{"isReady":[false,false],"calls":[0,0]}'
		data-wp-init--one="actions.initOne"
		data-wp-init--two="actions.initTwo"
	>
		<p data-wp-text="state.isReady" data-testid="isReady">false,false</p>
		<p data-wp-text="state.calls" data-testid="calls">0,0</p>
	</div>
	<div
		data-testid="init show"
		data-wp-context='{"isVisible":true,"isMounted":false}'
	>
		<div data-wp-show-mock="context.isVisible" data-testid="show">
			<span data-wp-init="actions.initMount">Initially visible</span>
		</div>
		<button data-wp-on--click="actions.toggle" data-testid="toggle">
			toggle
		</button>
		<p data-wp-text="state.isMounted" data-testid="isMounted">
			true
		</p>
	</div>
</div>
