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
			'show_ui' => true,
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
		$footer_template_part_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template',
				'post_title'   => 'Footer',
				'post_name'    => 'footer-template-part',
				'post_content' => "<!-- wp:paragraph -->\n<p>Template part</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:categories /-->",
			)
		);

		$template_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'single-post',
				'post_content' => '<!-- wp:navigation-menu {"align":"wide"} -->
				<nav class="wp-block-navigation-menu alignwide"><!-- wp:navigation-menu-item {"label":"Home","destination":"http://yah.local/"} -->
				<a href="http://yah.local/" class="wp-block-navigation-menu-item">Home</a>
				<!-- /wp:navigation-menu-item -->

				<!-- wp:navigation-menu-item {"label":"My best posts","destination":"http://yah.local/best"} -->
				<a href="http://yah.local/best" class="wp-block-navigation-menu-item">My best posts</a>
				<!-- /wp:navigation-menu-item --></nav>
				<!-- /wp:navigation-menu -->

				<!-- wp:columns {"align":"wide"} -->
				<div class="wp-block-columns alignwide"><!-- wp:column {"width":66.66} -->
				<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:post-title /-->

				<!-- wp:post-date {"format":"datetime"} /-->

				<!-- wp:post-content /--></div>
				<!-- /wp:column -->

				<!-- wp:column {"width":33.34} -->
				<div class="wp-block-column" style="flex-basis:33.34%"><!-- wp:group {"backgroundColor":"very-dark-gray"} -->
				<div class="wp-block-group has-very-dark-gray-background-color has-background"><div class="wp-block-group__inner-container"><!-- wp:paragraph {"textColor":"very-light-gray"} -->
				<p class="has-text-color has-very-light-gray-color">This is a <strong>Sidebar</strong>.</p>
				<!-- /wp:paragraph -->

				<!-- wp:paragraph {"textColor":"very-light-gray"} -->
				<p class="has-text-color has-very-light-gray-color">With some block widgets.</p>
				<!-- /wp:paragraph -->

				<!-- wp:tag-cloud /-->

				<!-- wp:paragraph -->
				<p><strong>You are now reading post:</strong></p>
				<!-- /wp:paragraph -->

				<!-- wp:post-title /-->

				<!-- wp:spacer {"height":223} -->
				<div style="height:223px" aria-hidden="true" class="wp-block-spacer"></div>
				<!-- /wp:spacer --></div></div>
				<!-- /wp:group --></div>
				<!-- /wp:column --></div>
				<!-- /wp:columns -->
				<!-- wp:template-part {"id":' . $footer_template_part_id . ',"name":"Footer"} /-->',
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
 * Returns an array of paths to template parts that should be preloaded, based on what template part blocks exist in the blocks passed.
 *
 * @param array $blocks Array of block objects.
 *
 * @return array Array of paths to template parts posts.
 */
function get_template_part_preload_paths( $blocks ) {
	if ( empty( $blocks ) ) {
		return array();
	}
	$parts = array();
	foreach ( $blocks as $block ) {
		if ( 'core/template-part' === $block['blockName'] &&
			isset( $block['attrs']['id'] )
		) {
			$parts[] = sprintf( '/wp/v2/wp_template/%s?context=edit', $block['attrs']['id'] );
		}
		$parts = array_merge(
			$parts,
			get_template_part_preload_paths( $block['innerBlocks'] )
		);
	}
	return $parts;
}

/**
 * Filter the  preload_paths to include paths to template part posts referenced in the current post template.
 *
 * @param array $preload_paths Array of paths to preload.
 *
 * @return array Array of paths to preload with template part paths added.
 */
function gutenberg_preload_template_parts( $preload_paths ) {
	global $post;
	$post_type_object = get_post_type_object( get_post_type( $post ) );
	if ( ! empty( $post_type_object->template_post ) ) {
		$blocks = parse_blocks( $post_type_object->template_post->post_content );
		return array_merge(
			$preload_paths,
			get_template_part_preload_paths( $blocks )
		);
	}
	return $preload_paths;
}

add_filter( 'block_editor_preload_paths', 'gutenberg_preload_template_parts' );

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
