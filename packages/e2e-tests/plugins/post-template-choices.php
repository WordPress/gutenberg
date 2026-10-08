<?php
/**
 * Plugin Name: Gutenberg Test Post Template Choices
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-post-template-choices
 */

add_action(
	'init',
	static function () {
		$templates = array(
			'standard-page' => 'Standard page',
			'landing-page'  => 'Landing page',
		);
		foreach ( $templates as $slug => $title ) {
			register_block_template(
				'gutenberg-test//' . $slug,
				array(
					'title'      => $title,
					'content'    => '<!-- wp:post-content /-->',
					'post_types' => array( 'page' ),
				)
			);
		}
	}
);

add_filter(
	'get_block_templates',
	static function ( $templates, $query, $template_type ) {
		if (
			'wp_template' !== $template_type ||
			'page' !== ( $query['post_type'] ?? null ) ||
			'landing-page' !== ( $query['slug'] ?? null )
		) {
			return $templates;
		}
		return wp_filter_object_list( $templates, array( 'slug' => 'landing-page' ) );
	},
	10,
	3
);
