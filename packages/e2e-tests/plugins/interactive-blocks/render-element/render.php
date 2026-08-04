<?php
/**
 * Block for testing the `renderElement()` API.
 *
 * @package e2e-interactivity
 */
?>
<div
	data-wp-interactive="test/render-element"
	data-wp-context='{ "count": 0 }'
>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment' ) ); ?>"
	>
		Load fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-list"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/list' ) ); ?>"
	>
		Load list fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-lifecycle"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/lifecycle' ) ); ?>"
	>
		Load lifecycle fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-region"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/region' ) ); ?>"
	>
		Load region fragment
	</button>
	<button
		data-wp-on--click="actions.reloadFragment"
		data-testid="reload"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment?v=2' ) ); ?>"
	>
		Reload fragment
	</button>
	<button
		data-wp-on--click="actions.loadIslandFragment"
		data-testid="load-island"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/island' ) ); ?>"
	>
		Load island fragment
	</button>
	<?php if ( ! empty( $attributes['next'] ) ) : ?>
		<a
			data-wp-on--click="actions.navigate"
			data-testid="nav-region"
			href="<?php echo esc_url( $attributes['next'] ); ?>"
		>
			Next
		</a>
	<?php endif; ?>
	<div data-testid="target"></div>
	<p data-testid="block-count" data-wp-text="context.count">0</p>
	<p data-testid="hydrated" data-wp-bind--hidden="!state.hydrated" hidden>
		hydrated
	</p>
</div>
