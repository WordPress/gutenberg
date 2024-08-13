<?php
/**
 * HTML for testing scope restoration with generators.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div
	data-wp-interactive="test/generator-scope"
	<?php echo wp_interactivity_data_wp_context( array( 'result' => '' ) ); ?>
>
	<input readonly data-wp-bind--value="context.result" data-testid="result" />
	<button type="button" data-wp-on--click="callbacks.resolve" data-testid="resolve">Async resolve</button>
	<button type="button" data-wp-on--click="callbacks.reject" data-testid="reject">Async reject</button>
</div>
