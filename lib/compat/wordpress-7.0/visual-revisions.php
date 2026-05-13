<?php
/**
 * Disables the in-editor visual revisions mode when classic meta boxes are
 * registered.
 *
 * Visual revisions only restore values held by the editor's REST-based save
 * flow. Classic meta box values are persisted through a separate admin-ajax
 * form submission that the in-editor restore does not drive, so a restored
 * revision would silently leave those values untouched. When any classic
 * meta box is registered for the current screen, the editor falls back to
 * the classic `revision.php` admin screen instead.
 *
 * @package gutenberg
 */

/**
 * Adds `disableVisualRevisions` to the block editor settings when any
 * classic meta box is registered for the current screen.
 *
 * Hooks into `block_editor_settings_all`, which in the post editor runs
 * after `register_and_do_post_meta_boxes()` has fired the `add_meta_boxes`
 * action. The `$wp_meta_boxes` global is therefore populated when this
 * filter runs.
 *
 * @param array                   $settings Default editor settings.
 * @param WP_Block_Editor_Context $context  Block editor context.
 * @return array Filtered settings.
 */
function gutenberg_disable_visual_revisions_for_meta_boxes( $settings, $context ) {
	if ( empty( $context->post ) ) {
		return $settings;
	}

	global $current_screen, $wp_meta_boxes;

	if ( ! $current_screen || empty( $wp_meta_boxes[ $current_screen->id ] ) ) {
		return $settings;
	}

	foreach ( $wp_meta_boxes[ $current_screen->id ] as $location_boxes ) {
		foreach ( (array) $location_boxes as $priority_boxes ) {
			foreach ( (array) $priority_boxes as $meta_box ) {
				if ( false === $meta_box || empty( $meta_box['title'] ) ) {
					continue;
				}

				// Back-compat placeholders aren't rendered, so don't count them.
				if ( ! empty( $meta_box['args']['__back_compat_meta_box'] ) ) {
					continue;
				}

				$settings['disableVisualRevisions'] = true;
				return $settings;
			}
		}
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_disable_visual_revisions_for_meta_boxes', 10, 2 );
