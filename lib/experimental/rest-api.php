<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Registers the Block editor settings REST API routes.
 */
function gutenberg_register_block_editor_settings() {
	$editor_settings = new WP_REST_Block_Editor_Settings_Controller();
	$editor_settings->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_block_editor_settings' );


/**
 * Shim for get_sample_permalink() to add support for auto-draft status.
 *
 * This function filters the return from get_sample_permalink() and essentially
 * re-runs the same logic minus the filters, but pretends a status of auto-save
 * is actually publish in order to return the future permalink format.
 *
 * This is a temporary fix until we can patch get_sample_permalink()
 *
 * @see https://core.trac.wordpress.org/ticket/46266
 *
 * @param array  $permalink Array containing the sample permalink with placeholder for the post name, and the post name.
 * @param int    $id        ID of the post.
 * @param string $title     Title of the post.
 * @param string $name      Slug of the post.
 * @param object $post      WP_Post object.
 *
 * @return array Array containing the sample permalink with placeholder for the post name, and the post name.
 */
function gutenberg_auto_draft_get_sample_permalink( $permalink, $id, $title, $name, $post ) {
	if ( 'auto-draft' !== $post->post_status ) {
		return $permalink;
	}
	$ptype = get_post_type_object( $post->post_type );

	$original_status = $post->post_status;
	$original_date   = $post->post_date;
	$original_name   = $post->post_name;

	// Hack: get_permalink() would return ugly permalink for drafts, so we will fake that our post is published.
	$post->post_status = 'publish';
	$post->post_name   = sanitize_title( $post->post_name ? $post->post_name : $post->post_title, $post->ID );

	// If the user wants to set a new name -- override the current one.
	// Note: if empty name is supplied -- use the title instead, see #6072.
	if ( ! is_null( $name ) ) {
		$post->post_name = sanitize_title( $name ? $name : $title, $post->ID );
	}

	$post->post_name = wp_unique_post_slug( $post->post_name, $post->ID, $post->post_status, $post->post_type, $post->post_parent );

	$post->filter = 'sample';

	$permalink = get_permalink( $post, true );

	// Replace custom post_type Token with generic pagename token for ease of use.
	$permalink = str_replace( "%$post->post_type%", '%pagename%', $permalink );

	// Handle page hierarchy.
	if ( $ptype->hierarchical ) {
		$uri = get_page_uri( $post );
		if ( $uri ) {
			$uri = untrailingslashit( $uri );
			$uri = strrev( stristr( strrev( $uri ), '/' ) );
			$uri = untrailingslashit( $uri );
		}

		if ( ! empty( $uri ) ) {
			$uri .= '/';
		}
		$permalink = str_replace( '%pagename%', "{$uri}%pagename%", $permalink );
	}

	$permalink         = array( $permalink, $post->post_name );
	$post->post_status = $original_status;
	$post->post_date   = $original_date;
	$post->post_name   = $original_name;
	unset( $post->filter );

	return $permalink;
}
add_filter( 'get_sample_permalink', 'gutenberg_auto_draft_get_sample_permalink', 10, 5 );

/**
 * Registers the scripts and styles area REST API routes.
 */
function gutenberg_register_script_style() {
 	// Scripts.
 	$controller = new WP_REST_Scripts_Controller();
 	$controller->register_routes();

 	// Styles.
 	$controller = new WP_REST_Styles_Controller();
 	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_script_style' );

/**
 * Adds style/script links to Block Types API endpoint response.
 *
 * @param \WP_REST_Response $response   API response.
 * @param \WP_Block_Type    $block_type Block type.
 *
 * @return \WP_REST_Response Modified API response.
 */
function gutenberg_add_assets_links_to_block_type( $response, $block_type ) {
	$links   = array();
	$scripts = array( 'editor_script', 'script' );
	foreach ( $scripts as $script ) {
		if ( ! isset( $block_type->$script ) ) {
			continue;
		}
		$expected_handle = $block_type->$script;
		if ( wp_script_is( $expected_handle, 'registered' ) ) {
			$links[ 'https://api.w.org/' . $script ] = array(
				'href'       => rest_url( sprintf( '%s/%s/%s', '__experimental', 'scripts', $expected_handle ) ),
				'embeddable' => true,
			);
		}
	}

	$styles = array( 'editor_style', 'style' );
	foreach ( $styles as $style ) {
		if ( ! isset( $block_type->$style ) ) {
			continue;
		}
		$expected_handle = $block_type->$style;
		if ( wp_style_is( $expected_handle, 'registered' ) ) {
			$links[ 'https://api.w.org/' . $style ] = array(
				'href'       => rest_url( sprintf( '%s/%s/%s', '__experimental', 'styles', $expected_handle ) ),
				'embeddable' => true,
			);
		}
	}

	if ( ! empty( $links ) ) {
		$response->add_links( $links );
	}

	return $response;
}
add_filter( 'rest_prepare_block_type', 'gutenberg_add_assets_links_to_block_type', 10, 2 );
