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
 * Resolves the file a meta box render callback was declared in.
 *
 * @param callable|string|array $callback Meta box render callback.
 * @return string|null Normalized path, or null when it cannot be reflected.
 */
function gutenberg_get_rtc_meta_box_callback_file( $callback ) {
	try {
		if ( is_array( $callback ) ) {
			$reflection = new ReflectionMethod( $callback[0], $callback[1] );
		} elseif ( is_string( $callback ) && str_contains( $callback, '::' ) ) {
			$reflection = new ReflectionMethod( $callback );
		} else {
			$reflection = new ReflectionFunction( $callback );
		}
	} catch ( ReflectionException $e ) {
		return null;
	}

	if ( $reflection->isInternal() ) {
		return null;
	}

	$filename = $reflection->getFileName();

	if ( ! is_string( $filename ) || '' === $filename ) {
		return null;
	}

	return wp_normalize_path( $filename );
}

/**
 * Reads a usable display name out of a plugin's header data.
 *
 * @param array|null $plugin_data Plugin header data.
 * @return string|null Plugin name, or null when there is none to show.
 */
function gutenberg_get_rtc_plugin_display_name( $plugin_data ) {
	if ( ! isset( $plugin_data['Name'] ) || ! is_string( $plugin_data['Name'] ) || '' === $plugin_data['Name'] ) {
		return null;
	}

	return $plugin_data['Name'];
}

/**
 * Resolves the display name of the plugin that registered a meta box.
 *
 * Meta boxes record no reference to whoever registered them, so the render
 * callback is the only link back to the originating code. Reflecting on the
 * callback gives the file it was declared in, and that file's location
 * identifies the plugin. Core reaches a similar answer in
 * _get_plugin_from_callback(), which it uses to name the plugin behind a meta
 * box that is incompatible with the block editor.
 *
 * Three layouts are recognised, because a name the reader can act on is the
 * whole point of the exercise: a must-use plugin, a single-file plugin sitting
 * directly in the plugins directory, and the usual plugin in a directory of
 * its own. Core's helper only recognises the last of those.
 *
 * Where Core matches the first installed plugin sharing a directory, this
 * refuses to guess: naming an innocent plugin is worse than naming none, so an
 * ambiguous directory resolves to nothing and the caller falls back to the
 * meta box title. The same fallback covers meta boxes from a theme or from
 * Core itself, which belong to no plugin at all.
 *
 * @param array $meta_box Registered meta box.
 * @return string|null Plugin name, or null when it cannot be resolved unambiguously.
 */
function gutenberg_get_rtc_meta_box_plugin_name( $meta_box ) {
	if ( empty( $meta_box['callback'] ) || ! function_exists( 'get_plugins' ) ) {
		return null;
	}

	$filename = gutenberg_get_rtc_meta_box_callback_file( $meta_box['callback'] );

	if ( null === $filename ) {
		return null;
	}

	// Must-use plugins load from their own directory, keyed by file name.
	if ( defined( 'WPMU_PLUGIN_DIR' ) && function_exists( 'get_mu_plugins' ) ) {
		$mu_plugin_dir = wp_normalize_path( WPMU_PLUGIN_DIR );

		if ( str_starts_with( $filename, $mu_plugin_dir . '/' ) ) {
			$mu_relative = substr( $filename, strlen( $mu_plugin_dir ) + 1 );
			$mu_plugins  = get_mu_plugins();

			return gutenberg_get_rtc_plugin_display_name( $mu_plugins[ $mu_relative ] ?? null );
		}
	}

	$plugin_dir = wp_normalize_path( WP_PLUGIN_DIR );

	if ( ! str_starts_with( $filename, $plugin_dir . '/' ) ) {
		return null;
	}

	$relative = substr( $filename, strlen( $plugin_dir ) + 1 );
	$plugins  = get_plugins();

	// A single-file plugin is keyed by its file name alone.
	if ( ! str_contains( $relative, '/' ) ) {
		return gutenberg_get_rtc_plugin_display_name( $plugins[ $relative ] ?? null );
	}

	// Otherwise the directory the file sits in identifies the plugin.
	$directory = substr( $relative, 0, strpos( $relative, '/' ) + 1 );
	$matches   = array();

	foreach ( $plugins as $plugin_file => $plugin_data ) {
		if ( str_starts_with( $plugin_file, $directory ) ) {
			$matches[] = $plugin_data;
		}
	}

	if ( 1 !== count( $matches ) ) {
		return null;
	}

	return gutenberg_get_rtc_plugin_display_name( $matches[0] );
}

/**
 * Reads the __rtc_compatible_meta_box flag from registered meta boxes
 * and injects the compatibility data into the block editor via inline script.
 *
 * Hooks into filter_block_editor_meta_boxes at a late priority so that it
 * runs after any developer filters that add the flag to third-party meta boxes.
 *
 * @global WP_Screen $current_screen WordPress current screen object.
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

	/*
	 * Mirrors the locations and priorities the block editor itself collects,
	 * so this never reports a meta box the editor does not render.
	 */
	$locations  = array( 'side', 'normal', 'advanced' );
	$priorities = array( 'high', 'sorted', 'core', 'default', 'low' );

	foreach ( $locations as $location ) {
		foreach ( $priorities as $priority ) {
			if ( ! isset( $wp_meta_boxes[ $screen_id ][ $location ][ $priority ] ) ) {
				continue;
			}

			$priority_boxes = (array) $wp_meta_boxes[ $screen_id ][ $location ][ $priority ];

			foreach ( $priority_boxes as $meta_box ) {
				if ( false === $meta_box || ! $meta_box['title'] ) {
					continue;
				}

				/*
				 * A meta box kept only for back compat never reaches the
				 * block editor, so it neither withdraws collaboration nor
				 * belongs among the names shown to the reader. This is the
				 * same exclusion the editor applies when it collects them.
				 */
				if ( ! empty( $meta_box['args']['__back_compat_meta_box'] ) ) {
					continue;
				}

				$entry = array(
					'id'    => $meta_box['id'],
					'title' => $meta_box['title'],
				);

				if ( ! empty( $meta_box['args']['__rtc_compatible_meta_box'] ) ) {
					$entry['__rtc_compatible'] = true;
				} else {
					/*
					 * An incompatible meta box is what switches collaboration
					 * off, so the editor needs to be able to name the plugin
					 * responsible. Meta boxes carry no record of who
					 * registered them; the render callback is the only link
					 * back to the originating file.
					 */
					$plugin_name = gutenberg_get_rtc_meta_box_plugin_name( $meta_box );

					if ( null === $plugin_name ) {
						/*
						 * Nothing to add. The editor already holds this meta
						 * box's id and title from core and falls back to the
						 * title on its own, so repeating it here would only
						 * restate what is already known.
						 */
						continue;
					}

					$entry['plugin'] = $plugin_name;
				}

				if ( ! isset( $meta_boxes_per_location[ $location ] ) ) {
					$meta_boxes_per_location[ $location ] = array();
				}

				$meta_boxes_per_location[ $location ][] = $entry;
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
