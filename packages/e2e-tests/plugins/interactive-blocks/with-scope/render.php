<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'with-scope-view' );
?>

<div data-wp-interactive='{ "namespace": "with-scope" }' data-wp-context='{"asyncCounter": 0, "syncCounter": 0}' data-wp-init--a='callbacks.asyncInit' data-wp-init--b='callbacks.syncInit'>
		<p data-wp-text="context.asyncCounter" data-testid="asyncCounter">0</p>
		<p data-wp-text="context.syncCounter" data-testid="syncCounter">0</p>
</div>
