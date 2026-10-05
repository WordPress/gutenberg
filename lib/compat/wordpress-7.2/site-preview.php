<?php
/**
 * Site preview context for the interactive Site Editor home canvas.
 *
 * @package gutenberg
 */

/**
 * Whether the current front-end request is the Site Editor site preview iframe.
 *
 * @return bool
 */
function gutenberg_is_site_preview_request() {
	return isset( $_GET['wp_site_preview'] ) &&
		1 === (int) $_GET['wp_site_preview'] &&
		current_user_can( 'edit_theme_options' );
}

/**
 * Public URL of the current request, without the site-preview query flag.
 *
 * @return string
 */
function gutenberg_get_site_preview_public_url() {
	return remove_query_arg( 'wp_site_preview', home_url( add_query_arg( array() ) ) );
}

/**
 * Post the current view renders as editable content, if any.
 *
 * The posts page is left out: its only editable content is the title, so it
 * is treated as the template that renders it.
 *
 * @return WP_Post|null
 */
function gutenberg_get_site_preview_content_post() {
	if ( ! is_singular() || is_home() || is_attachment() ) {
		return null;
	}

	$post = get_queried_object();
	if ( ! $post instanceof WP_Post ) {
		return null;
	}

	$post_type = get_post_type_object( $post->post_type );
	if (
		! $post_type ||
		! $post_type->show_in_rest ||
		! is_post_type_viewable( $post_type ) ||
		! current_user_can( 'edit_post', $post->ID )
	) {
		return null;
	}

	return $post;
}

/**
 * Context the Site Editor home canvas reads after each iframe navigation.
 *
 * Singular views of a post type carry both the post and the template that
 * renders it. Everything else (latest-posts home, the posts page, archives,
 * search, 404) carries the template only.
 *
 * @return array{url: string, postType: string, postTypeLabel: string, postId: string, postTitle: string, templateId: string, templateTitle: string}
 */
function gutenberg_get_site_preview_context() {
	global $_wp_current_template_id;

	$template_id    = is_string( $_wp_current_template_id ) ? $_wp_current_template_id : '';
	$template       = $template_id ? get_block_template( $template_id ) : null;
	$template_title = '';

	if ( $template ) {
		$template_title = $template->title ? $template->title : $template->slug;
	}

	$context = array(
		'url'           => gutenberg_get_site_preview_public_url(),
		'postType'      => '',
		'postTypeLabel' => '',
		'postId'        => '',
		'postTitle'     => '',
		'templateId'    => $template_id,
		'templateTitle' => $template_title,
	);

	$post = gutenberg_get_site_preview_content_post();
	if ( $post ) {
		$context['url']           = (string) get_permalink( $post );
		$context['postType']      = $post->post_type;
		$context['postTypeLabel'] = get_post_type_object( $post->post_type )->labels->singular_name;
		$context['postId']        = (string) $post->ID;
		$context['postTitle']     = html_entity_decode(
			wp_strip_all_tags( get_the_title( $post ) ),
			ENT_QUOTES,
			get_bloginfo( 'charset' )
		);
	}

	return $context;
}

/**
 * Prints a JSON blob the parent frame reads on each load.
 */
function gutenberg_print_site_preview_context() {
	if ( ! gutenberg_is_site_preview_request() ) {
		return;
	}

	printf(
		'<script type="application/json" id="wp-site-preview-context">%s</script>',
		wp_json_encode( gutenberg_get_site_preview_context() )
	);
}
add_action( 'wp_footer', 'gutenberg_print_site_preview_context' );
