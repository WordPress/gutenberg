<?php
/**
 * Adds support for the __rtc_compatible_meta_box flag in add_meta_box().
 *
 * Plugin authors can mark their meta boxes as compatible with real-time
 * collaboration by passing '__rtc_compatible_meta_box' => true in the
 * $callback_args parameter of add_meta_box(). Users can also add this
 * flag to third-party meta boxes via the filter_block_editor_meta_boxes hook.
 *
 * @package gutenberg
 */

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
	global $current_screen;

	if ( ! $current_screen || ! wp_is_collaboration_enabled() ) {
		return $wp_meta_boxes;
	}

	$screen_id = $current_screen->id;

	if ( ! isset( $wp_meta_boxes[ $screen_id ] ) ) {
		return $wp_meta_boxes;
	}

	$meta_boxes_per_location = array();

	foreach ( $wp_meta_boxes[ $screen_id ] as $location => $priorities ) {
		foreach ( $priorities as $priority_boxes ) {
			foreach ( (array) $priority_boxes as $meta_box ) {
				if ( false === $meta_box || ! $meta_box['title'] ) {
					continue;
				}

				if ( empty( $meta_box['args']['__rtc_compatible_meta_box'] ) ) {
					continue;
				}

				if ( ! isset( $meta_boxes_per_location[ $location ] ) ) {
					$meta_boxes_per_location[ $location ] = array();
				}

				$meta_boxes_per_location[ $location ][] = array(
					'id'               => $meta_box['id'],
					'title'            => $meta_box['title'],
					'__rtc_compatible' => true,
				);
			}
		}
	}

	if ( ! empty( $meta_boxes_per_location ) ) {
		// Meta boxes are registered during admin_head, which fires after
		// admin_enqueue_scripts where the editor instance is created. This
		// means the compatibility data cannot be added to editor settings
		// directly. Instead, we inject an inline script that dispatches
		// into the store once the block editor has finished loading. The
		// existing entries are merged by id, so this re-flags meta boxes
		// already registered by WordPress core.
		$script = 'window._wpLoadBlockEditor.then( function() {
			wp.data.dispatch( \'core/edit-post\' ).setAvailableMetaBoxesPerLocation( ' . wp_json_encode( $meta_boxes_per_location, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ' );
		} );';

		wp_add_inline_script( 'wp-edit-post', $script );

		// If wp-edit-post is output earlier in <head>, the inline script
		// needs to be manually printed. This mirrors the same fallback
		// used by WordPress core for setAvailableMetaBoxesPerLocation.
		if ( wp_script_is( 'wp-edit-post', 'done' ) ) {
			printf( "<script>\n%s\n</script>\n", trim( $script ) );
		}
	}

	return $wp_meta_boxes;
}
add_filter( 'filter_block_editor_meta_boxes', 'gutenberg_inject_rtc_compatible_meta_boxes', 100 );
