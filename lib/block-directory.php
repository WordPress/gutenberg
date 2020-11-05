<?php
/**
 * Block directory functions.
 *
 * @package gutenberg
 */

if (
	! has_action( 'admin_enqueue_scripts', 'enqueue_block_editor_assets_block_directory' )
) {
	/**
	 * Function responsible for enqueuing the assets required
	 * for the block directory functionality in the editor.
	 *
	 * This filter can be removed when plugin support requires WordPress 5.5.0+.
	 *
	 * @see https://core.trac.wordpress.org/ticket/50321
	 * @see https://core.trac.wordpress.org/changeset/48242
	 */
	function gutenberg_enqueue_block_editor_assets_block_directory() {
		wp_enqueue_script( 'wp-block-directory' );
		wp_enqueue_style( 'wp-block-directory' );
	}
	add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_block_editor_assets_block_directory' );

	/**
	 * Add data attribute of handle to all script tags output in the wp-admin.
	 *
	 * This filter can be removed when plugin support requires WordPress 5.5.0+.
	 *
	 * @see https://core.trac.wordpress.org/ticket/48654
	 * @see https://core.trac.wordpress.org/changeset/48295
	 *
	 * @param string $tag     The `<script>` tag for the enqueued script.
	 * @param string $handle  The script's registered handle.
	 * @param string $esc_src The script's pre-escaped registered src.
	 *
	 * @return string  Filtered script tag.
	 */
	function gutenberg_change_script_tag( $tag, $handle, $esc_src ) {
		if ( ! is_admin() ) {
			return $tag;
		}

		$tag = str_replace(
			sprintf( "<script src='%s'></script>", $esc_src ),
			sprintf( "<script data-handle='%s' src='%s'></script>", esc_attr( $handle ), $esc_src ),
			$tag
		);

		return $tag;
	}
	add_filter( 'script_loader_tag', 'gutenberg_change_script_tag', 1, 3 );
}
