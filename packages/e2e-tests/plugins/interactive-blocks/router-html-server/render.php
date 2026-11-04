<?php
/**
 * HTML for testing kept HTML elements whose value the server renders.
 *
 * @package gutenberg-test-interactive-blocks
 */

$attributes = get_defined_vars()['attributes'];
$page       = $attributes['page'];
$html       = '<p>' . esc_html( ucfirst( $attributes['label'] ?? $page ) ) . '</p>';
// The value that data-wp-watch callbacks copy from this page's server data.
// The server doesn't render a context value into its element, so the context
// element holds this page's HTML in its markup.
$synced = empty( $attributes['syncedNull'] ) ? wp_interactivity_as_dangerous_html( $html ) : null;

wp_interactivity_state(
	'router-html-server',
	array(
		'html'     => wp_interactivity_as_dangerous_html( $html ),
		/**
		 * Supplies this page's HTML as derived state the client doesn't define.
		 *
		 * @return WP_Interactivity_Dangerous_HTML The page's HTML.
		 */
		'late'     => function () use ( $html ) {
			return wp_interactivity_as_dangerous_html( $html );
		},
		'same'     => wp_interactivity_as_dangerous_html( '<p>Same</p>' ),
		/**
		 * Supplies HTML shared by every page as derived state the client
		 * doesn't define.
		 *
		 * @return WP_Interactivity_Dangerous_HTML The shared HTML.
		 */
		'sameLate' => function () {
			return wp_interactivity_as_dangerous_html( '<p>Same</p>' );
		},
		'synced'   => $synced,
	)
);
?>

<div data-wp-interactive="router-html-server">
	<div data-wp-interactive="router-html-server" data-wp-router-region="router-html-server" data-wp-watch="callbacks.syncState">
		<p data-testid="page-content">content from <?php echo esc_html( $page ); ?></p>
		<div data-testid="state-html" data-wp-html="state.html"></div>
		<div data-testid="pending-html" data-wp-html="state.late"></div>
		<div data-testid="same-html" data-wp-html="state.same"></div>
		<div data-testid="same-pending-html" data-wp-html="state.sameLate"></div>
		<div data-testid="synced-state-html" data-wp-html="state.synced"></div>
		<div <?php echo wp_interactivity_data_wp_context( array( 'synced' => $synced ) ); ?> data-wp-watch="callbacks.syncContext">
			<div data-testid="synced-context-html" data-wp-html="context.synced"><?php echo wp_kses_post( $html ); ?></div>
		</div>
		<p data-testid="hydrated" data-wp-text="state.hydrated">no</p>
		<?php if ( ! empty( $attributes['next'] ) ) : ?>
			<a href="<?php echo esc_url( $attributes['next'] ); ?>" data-wp-on--click="actions.navigate">Next</a>
		<?php endif; ?>
		<button data-wp-on--click="actions.refresh">Refresh</button>
	</div>
</div>
