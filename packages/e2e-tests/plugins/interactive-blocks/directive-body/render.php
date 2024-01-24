<?php
/**
 * HTML for testing the directive `data-wp-body`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-body-view' );
?>

<div
	data-wp-interactive='{ "namespace":"directive-body" }'
	data-wp-context='{"text":"text-1"}'
>
	<div data-testid="container">
		<aside data-wp-body data-testid="element with data-wp-body">
			<p data-wp-text="context.text" data-testid="text">initial</p>
		</aside>
	</div>
	<button
		data-wp-on--click="actions.toggleText"
		data-testid="toggle text"
	>toggle text</button>
</div>
