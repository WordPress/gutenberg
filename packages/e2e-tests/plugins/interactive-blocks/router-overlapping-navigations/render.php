<?php
/**
 * HTML for testing what reaches the page when client-side navigations
 * overlap: the router region, the document title, the stylesheets, the
 * server state and context, and the scroll to a URL fragment. Its in-page
 * link and its readouts of `core/router`'s URL and lifecycle test what an
 * in-page link click does to a navigation in flight.
 *
 * @package gutenberg-test-interactive-blocks
 */

$attributes = get_defined_vars()['attributes'];
$page       = $attributes['page'] ?? '';

// A stylesheet that only the pages with the `stylesheet` attribute carry.
if ( ! empty( $attributes['stylesheet'] ) ) {
	add_action(
		'wp_enqueue_scripts',
		function () {
			wp_register_style( 'test-router-overlapping-navigations', false );
			wp_enqueue_style( 'test-router-overlapping-navigations' );
			wp_add_inline_style(
				'test-router-overlapping-navigations',
				'.router-overlapping-navigations-styled { color: rgb(255, 0, 0); }'
			);
		}
	);
}

wp_interactivity_state(
	'router-overlapping-navigations',
	array( 'page' => $page )
);
?>
<div data-wp-interactive="router-overlapping-navigations">
	<p data-testid="server state" data-wp-text="state.serverStatePage"></p>
	<p data-testid="resolved" data-wp-text="state.resolved"></p>
	<p data-testid="router url" data-wp-text="state.routerUrl"></p>
	<p data-testid="lifecycle" data-wp-text="state.lifecycle"></p>
	<a data-testid="in-page link" href="#target">in-page link</a>
	<p data-testid="styled" class="router-overlapping-navigations-styled">styled</p>

	<div
		data-wp-interactive="router-overlapping-navigations"
		data-wp-router-region="router-overlapping-navigations"
		<?php echo wp_interactivity_data_wp_context( array( 'page' => $page ) ); ?>
	>
		<p data-testid="page"><?php echo esc_html( $page ); ?></p>
		<p data-testid="server context" data-wp-text="state.serverContextPage"></p>
		<?php if ( isset( $attributes['link'] ) ) : ?>
			<a
				data-testid="link"
				data-wp-on--click="actions.navigate"
				href="<?php echo esc_url( $attributes['link'] ); ?>"
			>link</a>
		<?php endif; ?>
	</div>

	<?php // Leaves the fragment target below the fold, so scrolling to it shows. ?>
	<div style="height: 200vh"></div>
	<p id="target" data-testid="target">target</p>
</div>
