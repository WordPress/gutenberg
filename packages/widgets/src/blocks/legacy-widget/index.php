<?php
/**
 * Server-side rendering of the `core/legacy-widget` block.
 *
 * @package WordPress
 */

/**
 * Renders the 'core/legacy-widget' block.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered block.
 */
function render_block_core_legacy_widget( $attributes ) {
	global $wp_widget_factory;

	if ( isset( $attributes['id'] ) ) {
		$sidebar_id = wp_find_widgets_sidebar( $attributes['id'] );
		return wp_render_widget( $attributes['id'], $sidebar_id );
	}

	if ( ! isset( $attributes['idBase'] ) ) {
		return '';
	}

	$id_base    = $attributes['idBase'];
	$widget_key = '';
	if ( method_exists( $wp_widget_factory, 'get_widget_key' ) ) {
		$widget_key = $wp_widget_factory->get_widget_key( $id_base );
	}

	/**
	 * Filters the widget key value.
	 *
	 * @since 5.8.0
	 *
	 * @param string $widget_key The key of the array from wp_widget_factory for the WP_Widget instanse.
	 * @param string $id_base Widget base id from the WP_Widget class.
	 * @param array  $attributes The block attributes..
	 */
	$widget_key = apply_filters( 'wp_get_widget_key', $widget_key, $id_base, $id_base );
	if ( ! $widget_key ) {
		return '';
	}

	if ( isset( $attributes['instance']['encoded'], $attributes['instance']['hash'] ) ) {
		$serialized_instance = base64_decode( $attributes['instance']['encoded'] );
		if ( wp_hash( $serialized_instance ) !== $attributes['instance']['hash'] ) {
			return '';
		}
		$instance = unserialize( $serialized_instance );
	} else {
		$instance = array();
	}

	ob_start();
	the_widget( $widget_key, $instance );
	return ob_get_clean();
}

/**
 * Registers the 'core/legacy-widget' block.
 */
function register_block_core_legacy_widget() {
	register_block_type_from_metadata(
		__DIR__ . '/legacy-widget',
		array(
			'render_callback' => 'render_block_core_legacy_widget',
		)
	);
}

add_action( 'init', 'register_block_core_legacy_widget' );

/**
 * Intercepts any request with legacy-widget-preview in the query param and, if
 * set, renders a page containing a preview of the requested Legacy Widget
 * block.
 */
function handle_legacy_widget_preview_iframe() {
	if ( empty( $_GET['legacy-widget-preview'] ) ) {
		return;
	}

	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return;
	}

	define( 'IFRAME_REQUEST', true );

	?>
	<!doctype html>
	<html <?php language_attributes(); ?>>
	<head>
		<meta charset="<?php bloginfo( 'charset' ); ?>" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="profile" href="https://gmpg.org/xfn/11" />
		<?php wp_head(); ?>
		<style>
			/* Reset theme styles */
			html, body, #page, #content {
				padding: 0 !important;
				margin: 0 !important;
			}
		</style>
	</head>
	<body <?php body_class(); ?>>
		<div id="page" class="site">
			<div id="content" class="site-content">
				<?php
				$registry = WP_Block_Type_Registry::get_instance();
				$block    = $registry->get_registered( 'core/legacy-widget' );
				echo $block->render( $_GET['legacy-widget-preview'] );
				?>
			</div><!-- #content -->
		</div><!-- #page -->
		<?php wp_footer(); ?>
	</body>
	</html>
	<?php

	exit;
}

// Use admin_init instead of init to ensure get_current_screen function is already available.
// This isn't strictly required, but enables better compatibility with existing plugins.
// See: https://github.com/WordPress/gutenberg/issues/32624.
add_action( 'admin_init', 'handle_legacy_widget_preview_iframe', 20 );
