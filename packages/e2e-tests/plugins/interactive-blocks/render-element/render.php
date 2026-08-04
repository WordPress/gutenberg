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
		data-wp-on--click="actions.loadIslandFragment"
		data-testid="load-island"
		data-fragment-url="<?php echo esc_url( rest_url( 'test/render-element/v1/fragment/island' ) ); ?>"
	>
		Load island fragment
	</button>
	<div data-testid="target"></div>
	<p data-testid="block-count" data-wp-text="context.count">0</p>
	<p data-testid="hydrated" data-wp-bind--hidden="!state.hydrated" hidden>
		hydrated
	</p>
</div>
