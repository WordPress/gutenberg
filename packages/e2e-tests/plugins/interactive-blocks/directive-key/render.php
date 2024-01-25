<?php
/**
 * HTML for testing the directive `data-wp-key`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-key-view' );
?>

<div
	data-wp-interactive='{ "namespace": "directive-key" }'
	data-wp-router-region="some-id"
>
	<ul>
		<li data-wp-key="id-2" data-testid="first-item">2</li>
		<li data-wp-key="id-3">3</li>
	</ul>
	<button data-testid="navigate" data-wp-on--click="actions.navigate">
		Navigate
	</button>
</div>
