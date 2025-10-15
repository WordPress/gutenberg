<?php
/**
 * HTML for testing the getServerContext() function.
 *
 * @package gutenberg-test-interactive-blocks
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */

$link1      = $attributes['links']['modified'];
$link2      = $attributes['links']['newProps'];
$parent_ctx = $attributes['parentContext'];
$child_ctx  = $attributes['childContext'];
?>

<nav
	data-testid="navigate"
	data-wp-interactive="test/get-server-context"
	data-wp-on--click="actions.navigate"
>
	<a data-testid="modified" href="<?php echo esc_url( $link1 ); ?>">modified</a>
	<a data-testid="newProps" href="<?php echo esc_url( $link2 ); ?>">newProps</a>
</nav>

<div
	data-wp-interactive="test/get-server-context"
	data-wp-router-region="server-context"
	data-wp-watch="callbacks.updateServerContextParent"
	<?php echo wp_interactivity_data_wp_context( $parent_ctx ); ?>
>
	<div
		data-wp-watch---server-context-child="callbacks.updateServerContextChild"
		data-wp-watch---non-changing="callbacks.updateNonChanging"
		data-wp-watch---only-in-main="callbacks.updateOnlyInMain"
		data-wp-watch---only-in-modified="callbacks.updateOnlyInModified"
		<?php echo wp_interactivity_data_wp_context( $child_ctx ); ?>
	>
		<div data-testid="prop" data-wp-text="context.prop"></div>
		<div data-testid="nested.prop" data-wp-text="context.nested.prop"></div>
		<div data-testid="newProp" data-wp-text="context.newProp"></div>
		<div data-testid="nested.newProp" data-wp-text="context.nested.newProp"></div>
		<div data-testid="inherited.prop" data-wp-text="context.inherited.prop"></div>
		<div data-testid="inherited.newProp" data-wp-text="context.inherited.newProp"></div>
		<div data-testid="nonChanging" data-wp-text="context.nonChanging"></div>
		<div data-testid="onlyInMain" data-wp-text="context.onlyInMain"></div>
		<div data-testid="onlyInModified" data-wp-text="context.onlyInModified"></div>

		<button
			data-testid="tryToModifyServerContext"
			<?php echo wp_interactivity_data_wp_context( array( 'result' => 'modify' ) ); ?>
			data-wp-on--click="actions.attemptModification"
			data-wp-text="context.result">
		>
			modify
		</button>

		<button
			data-testid="updateNonChanging"
			data-wp-on--click="actions.updateNonChanging"
		>
			update non-changing prop
		</button>
	</div>
</div>
