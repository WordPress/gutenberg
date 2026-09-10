<?php
/**
 * HTML for testing hydration timing - async import block.
 *
 * This block's view module dynamically imports @wordpress/interactivity
 * on DOMContentLoaded, simulating a lazy-loading scenario. The test verifies
 * that hydration still occurs even when the library is loaded after
 * DOMContentLoaded has fired.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>

<div
	data-wp-interactive="test/hydration-timing-async"
	<?php echo wp_interactivity_data_wp_context( array( 'hydrated' => false ) ); ?>
>
	<p
		data-wp-text="state.asyncModuleLoaded"
		data-testid="async-module-loaded"
	>no</p>

	<p
		data-wp-text="context.hydrated"
		data-testid="async-hydrated"
	>no</p>

	<div
		data-wp-init="callbacks.init"
		data-testid="async-hydration-status"
	>
		Async import hydration test block
	</div>
</div>
