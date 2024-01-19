<?php
/**
 * HTML for testing the directive `data-wp-on`.
 *
 * @package gutenberg-test-interactive-blocks
 */

gutenberg_enqueue_module( 'with-scope-view' );
?>

<div data-wp-interactive='{ "namespace": "with-scope" }' data-wp-context='{"counter": 0}' data-wp-async-mock='callbacks.sampleAsyncFunction'>
		<p data-wp-text="context.counter" data-testid="counter">0</p>
</div>
