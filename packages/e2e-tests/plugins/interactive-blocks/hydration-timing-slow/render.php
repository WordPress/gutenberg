<?php
/**
 * HTML for testing hydration timing - slow module block.
 *
 * This block's view module will be artificially delayed in the test
 * to simulate a slow network connection. The test verifies that
 * hydration waits for this module to load even when other modules
 * that import @wordpress/interactivity have already been evaluated.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>

<div
	data-wp-interactive="test/hydration-timing"
	<?php echo wp_interactivity_data_wp_context( array( 'slowInitialized' => false ) ); ?>
>
	<p
		data-wp-text="state.slowModuleLoaded"
		data-testid="slow-module-loaded"
	>no</p>

	<p
		data-wp-text="context.slowInitialized"
		data-testid="slow-context-initialized"
	>no</p>

	<div
		data-wp-init="callbacks.slowInit"
		data-testid="slow-hydration-status"
	>
		Slow module hydration test block
	</div>
</div>
