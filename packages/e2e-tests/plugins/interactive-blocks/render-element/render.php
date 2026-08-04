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
	<button
		data-wp-on--click="actions.loadBefore"
		data-testid="load-before"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/before' ) ); ?>"
	>
		Load before fragment
	</button>
	<button
		data-wp-on--click="actions.loadAfter"
		data-testid="load-after"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/after' ) ); ?>"
	>
		Load after fragment
	</button>
	<button
		data-wp-on--click="actions.loadOuter"
		data-testid="load-outer"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/outer' ) ); ?>"
	>
		Load outer fragment
	</button>
	<button
		data-wp-on--click="actions.loadWatch"
		data-testid="load-watch"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/watch' ) ); ?>"
	>
		Load watch fragment
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
	<p data-testid="hydrated" data-wp-text="state.isHydrated">no</p>
</div>
