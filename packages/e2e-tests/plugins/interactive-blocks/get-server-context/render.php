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
	<div data-testid="parent.prop" data-wp-text="context.prop"></div>
	<div data-testid="parent.nested.prop" data-wp-text="context.nested.prop"></div>
	<div data-testid="parent.newProp" data-wp-text="context.newProp"></div>
	<div data-testid="parent.nested.newProp" data-wp-text="context.nested.newProp"></div>
	<div data-testid="parent.inherited.prop" data-wp-text="context.inherited.prop"></div>
	<div data-testid="parent.inherited.newProp" data-wp-text="context.inherited.newProp"></div>
	<div
		data-wp-watch="callbacks.updateServerContextChild"
		<?php echo wp_interactivity_data_wp_context( $child_ctx ); ?>
	>
		<div data-testid="child.prop" data-wp-text="context.prop"></div>
		<div data-testid="child.nested.prop" data-wp-text="context.nested.prop"></div>
		<div data-testid="child.newProp" data-wp-text="context.newProp"></div>
		<div data-testid="child.nested.newProp" data-wp-text="context.nested.newProp"></div>
		<div data-testid="child.inherited.prop" data-wp-text="context.inherited.prop"></div>
		<div data-testid="child.inherited.newProp" data-wp-text="context.inherited.newProp"></div>

		<button
			data-testid="tryToUpdateServerContext"
			data-wp-on--click="actions.tryToUpdateServerContext"
		>
			try update
		</button>
	</div>
</div>
