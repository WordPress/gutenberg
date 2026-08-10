<?php
/**
 * Block for testing the `renderHTML()` API.
 *
 * Renders the fragment-loader UI, the overlapping re-render slots, and —
 * when the `region` attribute is set — a router region with server content
 * (the navigation target for the region-swap test).
 *
 * @package e2e-interactivity
 *
 * @phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
 */
?>
<?php if ( ! empty( $attributes['region'] ) ) : ?>
	<div data-wp-interactive="test/render-html" data-wp-router-region="test/region">
		<p data-testid="region-server">server content</p>
	</div>
<?php else : ?>
<div
	data-wp-interactive="test/render-html"
	data-wp-context='{ "count": 0 }'
>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment' ) ); ?>"
	>
		Load fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-region"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/region' ) ); ?>"
	>
		Load region fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="reload"
		data-mode="inner"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment?v=2' ) ); ?>"
	>
		Reload fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-island"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/island' ) ); ?>"
	>
		Load island fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-mixed"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/mixed' ) ); ?>"
	>
		Load mixed fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-listener"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/listener' ) ); ?>"
	>
		Load listener fragment
	</button>
	<button
		data-wp-on--click="actions.loadListenerIntoRegion"
		data-testid="load-listener-region"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/listener' ) ); ?>"
	>
		Load listener into region
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-prepend"
		data-mode="prepend"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/mixed' ) ); ?>"
	>
		Prepend mixed fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-before"
		data-mode="before"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/mixed' ) ); ?>"
	>
		Insert mixed fragment before target
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-after"
		data-mode="after"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/mixed' ) ); ?>"
	>
		Insert mixed fragment after target
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-replace"
		data-mode="replace"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/mixed' ) ); ?>"
	>
		Replace target with mixed fragment
	</button>
	<button
		data-wp-on--click="actions.loadFragment"
		data-testid="load-nested"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-html/v1/fragment/nested' ) ); ?>"
	>
		Load nested island fragment
	</button>
	<button
		data-wp-on--click="actions.renderIntoNested"
		data-testid="render-into-nested"
	>
		Render into nested island container
	</button>
	<button
		data-wp-on--click="actions.loadTwo"
		data-testid="load-two"
	>
		Load two
	</button>
	<button
		data-wp-on--click="actions.shrink"
		data-testid="shrink"
	>
		Re-render slot A
	</button>
	<button
		data-wp-on--click="actions.loadOne"
		data-testid="load-one"
	>
		Load one
	</button>
	<button
		data-wp-on--click="actions.grow"
		data-testid="grow"
	>
		Grow to two
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
	<div data-testid="array-target">
		<div data-testid="slot-a"></div>
		<div data-testid="slot-b"></div>
	</div>
	<p data-testid="block-count" data-wp-text="context.count">0</p>
	<p data-testid="hydrated" data-wp-text="state.isHydrated">no</p>
	<p data-testid="resize-count" data-wp-text="state.resizeCount">0</p>
</div>
<?php endif; ?>
