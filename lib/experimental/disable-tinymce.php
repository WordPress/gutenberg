<?php
/**
 * Experiment to disable the Classic block.
 *
 * @package gutenberg
 */

/**
 * Render a variable that we'll use to declare that the editor will need the classic block.
 */
function gutenberg_declare_classic_block_necessary() {
	if ( ! gutenberg_classic_block_supports_inserter() ) {
		return;
	}
	echo '<script type="text/javascript">window.wp.needsClassicBlock = true;</script>';
}
add_action( 'admin_print_footer_scripts', 'gutenberg_declare_classic_block_necessary', 20 );

/**
 * Whether the Classic block should be available in the inserter.
 *
 * @return bool True if the Classic block should be in the inserter.
 */
function gutenberg_classic_block_supports_inserter() {
	$post = null;
	if (
		is_admin() &&
		! empty( $_GET['post'] ) &&
		! empty( $_GET['action'] ) &&
		'edit' === $_GET['action']
	) {
		$post = get_post( absint( $_GET['post'] ) );
	}

	/**
	 * Filters whether the Classic block should be available in the inserter.
	 *
	 * Defaults to false. Use this filter to opt in (globally or per post).
	 *
	 * @param bool         $supports_inserter Whether the Classic block is available in the inserter.
	 * @param WP_Post|null $post              The post being edited, or null if not in the post editor.
	 */
	return (bool) apply_filters( 'gutenberg_classic_block_supports_inserter', false, $post );
}
