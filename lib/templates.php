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

	$post_type_object           = get_post_type_object( 'post' );
	$post_type_object->template = $template;
}
add_action( 'init', 'gutenberg_register_templates' );
