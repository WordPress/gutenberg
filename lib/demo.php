<?php
/**
 * Supports for populating the Gutenberg demo content new post.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Redirects the demo page to edit a new post.
 */
function gutenberg_redirect_demo() {
	global $pagenow;

	if ( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'gutenberg' === $_GET['page'] ) {
		wp_safe_redirect( admin_url( 'post-new.php?gutenberg-demo' ) );
		exit;
	}
}
add_action( 'admin_init', 'gutenberg_redirect_demo' );

/**
 * Assigns the default content for the Gutenberg demo post.
 *
 * @param string  $content Default post content.
 * @param WP_Post $post    Post object.
 *
 * @return string Demo content if creating a new Gutenberg demo post, or the
 *                default content otherwise.
 */
function gutenberg_default_demo_content( $content, $post ) {
	$is_new_post = 'auto-draft' === $post->post_status;
	$is_demo     = $is_new_post && isset( $_GET['gutenberg-demo'] );

	if ( $is_demo ) {
		// Prepopulate with some test content in demo.
		ob_start();
		include gutenberg_dir_path() . 'post-content.php';
		return ob_get_clean();

		$initial_edits = array(
			'title'   => __( 'Welcome to the Gutenberg Editor', 'gutenberg' ),
			'content' => $demo_content,
		);

	}

	return $content;
}
add_filter( 'default_content', 'gutenberg_default_demo_content', 10, 2 );

/**
 * Assigns the default title for the Gutenberg demo post.
 *
 * @param string  $title Default post title.
 * @param WP_Post $post  Post object.
 *
 * @return string Demo title if creating a new Gutenberg demo post, or the
 *                default title otherwise.
 */
function gutenberg_default_demo_title( $title, $post ) {
	$is_new_post = 'auto-draft' === $post->post_status;
	$is_demo     = $is_new_post && isset( $_GET['gutenberg-demo'] );

	if ( $is_demo ) {
		return __( 'Welcome to the Gutenberg Editor', 'gutenberg' );
	}

	return $title;
}
add_filter( 'default_title', 'gutenberg_default_demo_title', 10, 2 );
