<?php
/**
 * HTML for testing the directive `data-wp-each`.
 *
 * @package gutenberg-test-interactive-blocks
 */

gutenberg_enqueue_module( 'directive-each-view' );
?>

<div
	data-wp-interactive='{ "namespace": "directive-each" }'
	data-wp-navigation-id="some-id"
>
</div>
