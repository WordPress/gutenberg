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

	return array_map(
		function ( $path ) {
			return [
				"slug" => basename( $path, '.html' ),
				"content" => [
					"raw" => file_get_contents( $path )
				]
			];
		},
		$block_template_files
	);
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
