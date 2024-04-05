<?php
/**
 * HTML for testing scope restoration with generators.
 *
 * @package gutenberg-test-interactive-blocks
 */
?>

<div
	data-wp-interactive="test/deferred-store"
	<?php echo wp_interactivity_data_wp_context( array( 'text' => '!dlrow ,olleH' ) ); ?>
>
	<span data-wp-text="state.reversedText" data-testid="result"></span>
	<span data-wp-text="state.reversedTextGetter" data-testid="result-getter"></span>
</div>
