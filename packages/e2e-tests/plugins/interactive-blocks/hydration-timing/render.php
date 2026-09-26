<?php
/**
 * HTML for testing hydration timing with delayed module loading.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>

<div
	data-wp-interactive="test/hydration-timing"
	<?php echo wp_interactivity_data_wp_context( array( 'initialized' => false ) ); ?>
>
	<p
		data-wp-text="state.moduleLoaded"
		data-testid="module-loaded"
	>no</p>

	<p
		data-wp-text="context.initialized"
		data-testid="context-initialized"
	>no</p>

	<div
		data-wp-init="callbacks.init"
		data-testid="hydration-status"
	>
		Hydration test block
	</div>
</div>
