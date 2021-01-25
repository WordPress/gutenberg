<?php
/**
 * Server-side rendering of the `core/template-part` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/template-part` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The render.
 */
function render_block_core_template_part( $attributes ) {
	static $seen_content = array();

	$content = null;
	$area    = WP_TEMPLATE_PART_AREA_UNCATEGORIZED;

	if ( ! empty( $attributes['postId'] ) && get_post_status( $attributes['postId'] ) ) {
		// If we have a post ID and the post exists, which means this template part
		// is user-customized, render the corresponding post content.
		$content = get_post( $attributes['postId'] )->post_content;
	} elseif ( isset( $attributes['theme'] ) && wp_get_theme()->get_stylesheet() === $attributes['theme'] ) {
		$template_part_query = new WP_Query(
			array(
				'post_type'      => 'wp_template_part',
				'post_status'    => 'publish',
				'post_name__in'  => array( $attributes['slug'] ),
				'tax_query'      => array(
					array(
						'taxonomy' => 'wp_theme',
						'field'    => 'slug',
						'terms'    => $attributes['theme'],
					),
				),
				'posts_per_page' => 1,
				'no_found_rows'  => true,
			)
		);
		$template_part_post  = $template_part_query->have_posts() ? $template_part_query->next_post() : null;
		if ( $template_part_post ) {
			// A published post might already exist if this template part was customized elsewhere
			// or if it's part of a customized template.
			$content    = $template_part_post->post_content;
			$area_terms = get_the_terms( $template_part_post, 'wp_template_part_area' );
			if ( ! is_wp_error( $area_terms ) && false !== $area_terms ) {
				$area = $area_terms[0]->name;
			}
		} else {
			// Else, if the template part was provided by the active theme,
			// render the corresponding file content.
			$template_part_file_path = get_stylesheet_directory() . '/block-template-parts/' . $attributes['slug'] . '.html';
			if ( 0 === validate_file( $attributes['slug'] ) && file_exists( $template_part_file_path ) ) {
				$content = file_get_contents( $template_part_file_path );
			}
		}
	}

	if ( is_null( $content ) ) {
		return 'Template Part Not Found';
	}

	if ( in_array( $content, $seen_content, true ) ) {
		if ( ! is_admin() ) {
			trigger_error(
				sprintf(
					// translators: %s is the user-provided title of the reusable block.
					__( 'Could not render Template Part with the slug <strong>%s</strong>: blocks cannot be rendered inside themselves.' ),
					$attributes['slug']
				),
				E_USER_WARNING
			);
		}

		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = defined( 'WP_DEBUG' ) && WP_DEBUG &&
			defined( 'WP_DEBUG_DISPLAY' ) && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	$seen_content[] = $content;

	// Run through the actions that are typically taken on the_content.
	$content = do_blocks( $content );
	$content = wptexturize( $content );
	$content = convert_smilies( $content );
	$content = wpautop( $content );
	$content = shortcode_unautop( $content );
	if ( function_exists( 'wp_filter_content_tags' ) ) {
		$content = wp_filter_content_tags( $content );
	} else {
		$content = wp_make_content_images_responsive( $content );
	}
	$content = do_shortcode( $content );

	if ( empty( $attributes['tagName'] ) ) {
		$area_tags = array(
			WP_TEMPLATE_PART_AREA_HEADER        => 'header',
			WP_TEMPLATE_PART_AREA_FOOTER        => 'footer',
			WP_TEMPLATE_PART_AREA_UNCATEGORIZED => 'div',
		);
		$html_tag  = null !== $area && isset( $area_tags[ $area ] ) ? $area_tags[ $area ] : $area_tags[ WP_TEMPLATE_PART_AREA_UNCATEGORIZED ];
	} else {
		$html_tag = esc_attr( $attributes['tagName'] );
	}
	$wrapper_attributes = get_block_wrapper_attributes();

	return "<$html_tag $wrapper_attributes>" . str_replace( ']]>', ']]&gt;', $content ) . "</$html_tag>";
}

/**
 * Registers the `core/template-part` block on the server.
 */
function register_block_core_template_part() {
	register_block_type_from_metadata(
		__DIR__ . '/template-part',
		array(
			'render_callback' => 'render_block_core_template_part',
		)
	);
}
add_action( 'init', 'register_block_core_template_part' );
