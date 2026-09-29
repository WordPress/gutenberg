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
		foreach ( array( 'current', 'alternative' ) as $name ) {
			register_block_template(
				'gutenberg-test//filtered-' . $name,
				array(
					'title'      => 'Filtered ' . $name,
					'content'    => '<!-- wp:paragraph --><p>Rendering filtered ' . $name . '</p><!-- /wp:paragraph --><!-- wp:post-content /-->',
					'post_types' => array( 'post', 'page' ),
				)
			);
		}
	}
);

add_filter(
	'get_block_templates',
	static function ( $templates, $query, $template_type ) {
		if ( 'wp_template' !== $template_type || ! isset( $query['slug'], $query['post_type'] ) ) {
			return $templates;
		}
		if ( 'filtered-empty' === $query['slug'] ) {
			return array();
		}
		if ( 'filtered-choices' === $query['slug'] ) {
			return array_values(
				array_filter(
					$templates,
					static function ( $template ) {
						return 'filtered-alternative' === $template->slug;
					}
				)
			);
		}
		return $templates;
	},
	10,
	3
);

add_action(
	'wp_after_insert_post',
	static function ( $post_id, $post, $update ) {
		if ( ! $update && 'auto-draft' === $post->post_status && 'post' === $post->post_type && ! metadata_exists( 'post', $post_id, '_wp_page_template' ) ) {
			update_post_meta( $post_id, '_wp_page_template', 'filtered-current' );
		}
	},
	10,
	3
);
