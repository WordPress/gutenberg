if ( ! function_exists( 'gutenberg_inject_rtc_compatible_meta_boxes' ) ) {
	/**
	 * Reads the __rtc_compatible_meta_box flag from registered meta boxes
	 * and injects the compatibility data into the block editor via inline script.
	 *
	 * Hooks into filter_block_editor_meta_boxes at a late priority so that it
	 * runs after any developer filters that add the flag to third-party meta boxes.
	 *
	 * @param array $wp_meta_boxes Global meta box state.
	 * @return array Unmodified meta box state.
	 */
	function gutenberg_inject_rtc_compatible_meta_boxes( $wp_meta_boxes ) {
		if ( ! $current_screen || ! wp_is_collaboration_enabled() ) {
	add_filter( 'filter_block_editor_meta_boxes', 'gutenberg_inject_rtc_compatible_meta_boxes', 100 );
