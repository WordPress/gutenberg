<?php
/**
 * REST endpoint for exposing theme's templates.
 *
 * @package gutenberg
 */

function gutenberg_edit_site_get_page_templates() {
	$block_template_files = glob( get_stylesheet_directory() . '/block-templates/*.html' );
	$block_template_files = is_array( $block_template_files ) ? $block_template_files : array();
	if ( is_child_theme() ) {
		$child_block_template_files = glob( get_template_directory() . '/block-templates/*.html' );
		$child_block_template_files = is_array( $child_block_template_files ) ? $child_block_template_files : array();
		$block_template_files       = array_merge( $block_template_files, $child_block_template_files );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-full-site-editing-demo' ) ) {
		$demo_block_template_files = glob( dirname( __FILE__ ) . '/demo-block-templates/*.html' );
		$demo_block_template_files = is_array( $demo_block_template_files ) ? $demo_block_template_files : array();
		$block_template_files      = array_merge( $block_template_files, $demo_block_template_files );
	}

	$slugs = array_map(
		function ( $path ) {
			return basename( $path, '.html' );
		},
		$block_template_files
	);

	return $slugs;
}

function gutenberg_edit_site_edit_page_template() {
	$current_template_post = gutenberg_find_template_post_and_parts( $_GET['wp_template'] );

	if ( $current_template_post->post_name === $_GET['wp_template'] ) {
		return $current_template_post;
	}

	$template_query        = new WP_Query(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => 'auto-draft',
			'name'           => $post_name,
			'posts_per_page' => 1,
			'no_found_rows'  => true,
		)
	);
	$current_template_post = $template_query->have_posts() ? $template_query->next_post() : null;
	if ( $current_template_post !== null ) {
		return $current_template_post;
	}

	$theme_file          = get_template_directory() . '/block-templates/' + $_GET['wp_template'] + '.html';
	$theme_file_contents = '';
	if ( file_exists( $theme_file ) ) {
		$theme_file_contents = file_get_contents( $theme_file );
	}
	$current_template_post = array(
		'post_title'   => $_GET['wp_template'],
		'post_status'  => 'auto-draft',
		'post_type'    => 'wp_template',
		'post_name'    => $_GET['wp_template'],
		'post_content' => $theme_file_contents,
	);
	$current_template_post = get_post(
		wp_insert_post( $current_template_post )
	);

	return $current_template_post;
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'__experimental/edit-site/v1',
			'/page-templates',
			array(
				'methods'             => 'GET',
				'callback'            => 'gutenberg_edit_site_get_page_templates',
				'permission_callback' => function () {
					return current_user_can( 'edit_theme_options' );
				},
			)
		);
	}
);

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'__experimental/edit-site/v1',
			'/edit-page-template',
			array(
				'methods'             => 'GET',
				'callback'            => 'gutenberg_edit_site_edit_page_template',
				'permission_callback' => function () {
					return current_user_can( 'edit_theme_options' );
				},
			)
		);
	}
);

