<?php
/**
 * HTML for testing priorities between directives.
 *
 * @package gutenberg-test-interactive-blocks
 */

wp_enqueue_script_module( 'directive-priorities-view' );
?>

<div data-wp-interactive='{ "namespace": "directive-priorities" }'>
	<pre data-testid="execution order"></pre>

	<!-- Element with test directives -->
	<div
		data-testid="test directives"
		data-wp-test-attribute
		data-wp-test-children
		data-wp-test-text
		data-wp-test-context
	></div>
</div>

<div data-testid="non-existent-directives">
	<!-- WARNING: the `div` with `data-wp-non-existent-directive` should remain
		inline (i.e., without new line or blank characters in between) to
		ensure it is the only child node. Otherwise, tests could fail. -->
	<div data-wp-interactive='{ "namespace": "directive-priorities" }'><div data-wp-non-existent-directive></div></div>
</div>
