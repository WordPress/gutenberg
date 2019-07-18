<?php
/**
 * Register Gutenberg core block editor templates.
 *
 * @package gutenberg
 */

/**
 * Registers Gutenberg core block editor templates.
 */
function gutenberg_register_templates() {
	register_post_type(
		'wp_template',
		array(
			'labels'       => array(
				'name' => __( 'Templates', 'gutenberg' ),
			),
			'show_in_rest' => true,
		)
	);

	$template_query = new WP_Query(
		array(
			'post_type' => 'wp_template',
			'name'      => 'single-post',
		)
	);

	$template;
	if ( ! $template_query->have_posts() ) {
		$template_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'single-post',
				'post_content' => '<!-- wp:post-title /--><!-- wp:post-content --><!-- wp:paragraph --><p></p><!-- /wp:paragraph --><!-- /wp:post-content -->',
			)
		);
		$template    = get_post( $template_id );
	} else {
		$template = $template_query->get_posts();
		$template = $template[0];
	}

	if ( isset( $_GET['gutenberg-demo'] ) ) {
		ob_start();
		echo '<!-- wp:post-title /--><!-- wp:post-content -->';
		include gutenberg_dir_path() . 'post-content.php';
		echo '<!-- /wp:post-content -->';
		$template->post_content = ob_get_clean();
	}

	$post_type_object                = get_post_type_object( 'post' );
	$post_type_object->template_post = $template;
}
add_action( 'init', 'gutenberg_register_templates' );

/**
 * Filters the block editor settings object to add the post's template post.
 *
 * @param array    $editor_settings The block editor settings object.
 * @param \WP_Post $post            The post object.
 *
 * @return array The maybe modified block editor settings object.
 */
function gutenberg_filter_block_editor_settings( $editor_settings, $post ) {
	$post_type_object = get_post_type_object( get_post_type( $post ) );
	if ( ! empty( $post_type_object->template_post ) ) {
		$editor_settings['templatePost'] = $post_type_object->template_post;
	}
	return $editor_settings;
}
add_filter( 'block_editor_settings', 'gutenberg_filter_block_editor_settings', 10, 2 );

/**
 * Filters template inclusion in pages to hijack the `single.php` template
 * and load the Gutenberg editable counterpart instead.
 *
 * @param string $template The included template file name.
 *
 * @return string The passed in file name unless the process is hijacked.
 */
function gutenberg_filter_template_include( $template ) {
	if ( ! preg_match( '/single\.php$/', $template ) ) {
		return $template;
	}

	$template_query = new WP_Query(
		array(
			'post_type' => 'wp_template',
			'name'      => 'single-post',
		)
	);
	$template       = $template_query->get_posts();
	$template       = $template[0];
	echo wp_head() . apply_filters( 'the_content', $template->post_content ) . wp_footer();
	exit;
}
add_filter( 'template_include', 'gutenberg_filter_template_include' );
