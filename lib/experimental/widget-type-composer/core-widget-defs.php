<?php
/**
 * Widget Type Composer: the widget definitions Gutenberg ships.
 *
 * Registered on `init` before the resolver runs at priority 30, so they reach
 * `WP_Widget_Type_Registry` alongside the build-discovered widget types.
 *
 * @package gutenberg
 */

/**
 * Returns the composition for the Composition Demo definition.
 *
 * Core blocks only: none of them has an admin (React) component, so every one
 * resolves through the SSR fallback. That is the path this exercises.
 *
 * A `core/cover` filling the tile, which pairs with `full-bleed`: the host
 * paints no chrome and the composition owns the surface edge to edge.
 *
 * Structural CSS is inline because the dashboard does not enqueue
 * `wp-block-library`, so the `wp-block-cover` classes resolve to nothing.
 *
 * @return string Block markup.
 */
function gutenberg_get_composition_demo_content() {
	/* Public-domain (CC0) photo from the WordPress.org photo directory. */
	$image_url = 'https://pd.w.org/2026/08/946a703630b14924.41406734.jpg';
	$image_alt = __( 'A grey dove drinking from a pool among mossy rocks.', 'gutenberg' );

	/* Cover attributes, and the markup core saves for each: `focalPoint`
		becomes the image's `object-position`, `customOverlayColor` and
		`dimRatio` become the background layer. */
	$focal_x    = 0.5;
	$focal_y    = 1;
	$overlay    = '#3858e9';
	$dim_ratio  = 60;
	$object_pos = ( $focal_x * 100 ) . '% ' . ( $focal_y * 100 ) . '%';

	/* `height` fills the tile, `min-height` is the floor when the surface is
		content-driven. `position` anchors the background layers to the cover
		itself, not to whatever positioned ancestor the host happens to have. */
	$cover_style = 'position:relative;display:flex;align-items:center;justify-content:center;height:100%;min-height:220px;overflow:hidden;';
	/* Explicit stacking: core's cover CSS layers these, and the dashboard does
		not load it, so without z-index the image would paint over the overlay. */
	$image_style = 'position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;object-position:' . $object_pos . ';';
	$dim_style   = 'position:absolute;inset:0;z-index:1;background-color:' . $overlay . ';opacity:' . ( $dim_ratio / 100 ) . ';';
	$inner_style = 'position:relative;z-index:2;padding:24px;text-align:center;';
	/* Set on each element: wp-admin styles headings explicitly, and an explicit
		rule beats an inherited colour from the container. */
	$text_style = 'color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.4);';

	return '<!-- wp:cover ' . wp_json_encode(
		array(
			'url'                => $image_url,
			'alt'                => $image_alt,
			'customOverlayColor' => $overlay,
			'dimRatio'           => $dim_ratio,
			'focalPoint'         => array(
				'x' => $focal_x,
				'y' => $focal_y,
			),
			'minHeight'          => 220,
			'isDark'             => true,
		)
	) . ' -->' .
		'<div class="wp-block-cover" style="' . esc_attr( $cover_style ) . '">' .
		'<span aria-hidden="true" class="wp-block-cover__background has-background-dim-' . (int) $dim_ratio . ' has-background-dim" style="' . esc_attr( $dim_style ) . '"></span>' .
		'<img class="wp-block-cover__image-background" src="' . esc_url( $image_url ) . '" alt="' . esc_attr( $image_alt ) . '" data-object-fit="cover" style="' . esc_attr( $image_style ) . '"/>' .
		'<div class="wp-block-cover__inner-container" style="' . esc_attr( $inner_style ) . '">' .
		'<!-- wp:heading {"textAlign":"center","level":3} -->' .
		'<h3 class="wp-block-heading has-text-align-center" style="' . esc_attr( 'margin:0 0 8px;' . $text_style ) . '">' .
		esc_html__( 'Composed of blocks', 'gutenberg' ) .
		'</h3><!-- /wp:heading -->' .
		'<!-- wp:paragraph {"align":"center"} -->' .
		'<p class="has-text-align-center" style="' . esc_attr( 'margin:0;' . $text_style ) . '">' .
		esc_html__( 'No render module. Declared in PHP, rendered on the server, mounted in the admin.', 'gutenberg' ) .
		'</p><!-- /wp:paragraph -->' .
		'</div></div>' .
		'<!-- /wp:cover -->';
}

/**
 * Returns the composition for the Site Health Overview definition.
 *
 * A paragraph, the `widget-def/site-health-counts` dynamic block, and a
 * `core-admin/link` to the Site Health page. Paragraph and counts resolve
 * through the SSR fallback; the counts block reads the cached Site Health
 * results on the server at render time, so the composition carries backend
 * data while staying declarative. The link renders client-side, where the
 * host's `links` capability upgrades it to a router link.
 *
 * Spacing is inline because the dashboard does not enqueue
 * `wp-block-library`, so the block classes resolve to nothing.
 *
 * @return string Block markup.
 */
function gutenberg_get_site_health_overview_content() {
	$review_link = wp_json_encode(
		array(
			'href'  => 'admin.php?page=dashboard-wp-admin&p=/site-health',
			'label' => __( 'Review all results', 'gutenberg' ),
		)
	);

	return '<!-- wp:paragraph -->' .
		'<p style="margin:0 0 12px;">' .
		esc_html__( 'WordPress runs periodic health checks covering performance and security.', 'gutenberg' ) .
		'</p><!-- /wp:paragraph -->' .
		'<!-- wp:widget-def/site-health-counts /-->' .
		'<!-- wp:core-admin/link ' . $review_link . ' /-->';
}

/**
 * Registers the widget definitions Gutenberg ships.
 */
function gutenberg_register_core_widget_defs() {
	gutenberg_register_widget_def(
		'core/composition-demo',
		array(
			'title'        => __( 'Composition demo', 'gutenberg' ),
			'description'  => __( 'A widget type whose body is a composition of core blocks, rendered on the server.', 'gutenberg' ),
			'category'     => 'dashboard',
			'presentation' => 'full-bleed',
			'actions'      => array(
				array(
					'id'           => 'composition-demo-photo',
					'label'        => __( 'View the photo', 'gutenberg' ),
					'icon'         => 'core/external',
					'href'         => 'https://pd.w.org/2026/08/946a703630b14924.41406734.jpg',
					'openInNewTab' => true,
				),
			),
			'content'      => gutenberg_get_composition_demo_content(),
		)
	);

	gutenberg_register_widget_def(
		'core/site-health-overview',
		array(
			'title'        => __( 'Site Health Overview', 'gutenberg' ),
			'description'  => __( 'A composed overview of the site health checks, linking to the full results.', 'gutenberg' ),
			'icon'         => 'core/shield',
			'category'     => 'site',
			'presentation' => 'framed',
			'actions'      => array(
				array(
					'id'        => 'site-health-overview-details',
					'label'     => __( 'Details', 'gutenberg' ),
					'icon'      => 'core/chart-bar',
					'relevance' => 'high',
					'href'      => 'admin.php?page=dashboard-wp-admin&p=/site-health',
				),
				array(
					'id'        => 'site-health-overview-status',
					'label'     => __( 'Status', 'gutenberg' ),
					'icon'      => 'dashboard-widgets/seen',
					'relevance' => 'medium',
					'href'      => 'site-health.php',
				),
			),
			'content'      => gutenberg_get_site_health_overview_content(),
		)
	);
}
add_action( 'init', 'gutenberg_register_core_widget_defs' );
