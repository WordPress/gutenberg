<?php
/**
 * Utilities used to fetch and create templates and template parts.
 *
 * @package gutenberg
 */

/**
 * Gets the directories the theme export may copy font files from.
 *
 * @since 24.5.0
 *
 * @return array[] List of directories, each with `url`, `path` and `type` ('font' or 'theme').
 */
function gutenberg_get_export_font_source_dirs() {
	$dirs = array();

	$font_dir = wp_get_font_dir();
	if ( empty( $font_dir['error'] ) ) {
		$dirs[] = array(
			'url'  => $font_dir['url'],
			'path' => $font_dir['path'],
			'type' => 'font',
		);
	}

	// @core-merge: Do not merge this, it is for the legacy wp-content/fonts directory only used in Gutenberg.
	$site_path = '';
	if ( is_multisite() && ! ( is_main_network() && is_main_site() ) ) {
		$site_path = '/sites/' . get_current_blog_id();
	}
	$dirs[] = array(
		'url'  => content_url( 'fonts' ) . $site_path,
		'path' => path_join( WP_CONTENT_DIR, 'fonts' ) . $site_path,
		'type' => 'font',
	);

	$dirs[] = array(
		'url'  => get_stylesheet_directory_uri(),
		'path' => get_stylesheet_directory(),
		'type' => 'theme',
	);

	return array_values(
		array_filter(
			$dirs,
			static function ( $dir ) {
				return is_dir( $dir['path'] );
			}
		)
	);
}

/**
 * Gets the `src` a font face should have in the exported theme.json.
 *
 * Font Library files are added to `$files` so they can be copied into the
 * export's `assets/fonts/` directory. Theme files listed in `$reserved_paths`
 * are pointed at by their relative path. Anything else is returned unchanged.
 *
 * @since 24.5.0
 *
 * @param mixed    $src            Font face src.
 * @param string[] $files          Files to add to the export, keyed by their path in the archive. Passed by reference.
 * @param string[] $reserved_paths Paths of the theme files already in the archive.
 * @return mixed The src to export.
 */
function gutenberg_get_font_face_src_for_export( $src, array &$files, array $reserved_paths = array() ) {
	if ( ! is_string( $src ) || str_starts_with( $src, 'file:./' ) ) {
		return $src;
	}

	$url = set_url_scheme( rawurldecode( preg_replace( '/[?#].*$/', '', $src ) ), 'https' );
	if ( str_contains( $url, "\0" ) ) {
		return $src;
	}

	foreach ( gutenberg_get_export_font_source_dirs() as $dir ) {
		$dir_url = trailingslashit( set_url_scheme( $dir['url'], 'https' ) );
		if ( ! str_starts_with( $url, $dir_url ) ) {
			continue;
		}

		$real_dir  = realpath( $dir['path'] );
		$real_file = realpath( $dir['path'] . '/' . substr( $url, strlen( $dir_url ) ) );
		if ( false === $real_dir || false === $real_file ) {
			return $src;
		}

		$real_dir  = trailingslashit( wp_normalize_path( $real_dir ) );
		$real_file = wp_normalize_path( $real_file );
		if ( ! str_starts_with( $real_file, $real_dir ) || ! is_file( $real_file ) || ! is_readable( $real_file ) ) {
			return $src;
		}

		if ( 'theme' === $dir['type'] ) {
			// Only point at theme files that are copied into the export.
			$relative_path = substr( $real_file, strlen( $real_dir ) );
			return in_array( $relative_path, $reserved_paths, true ) ? 'file:./' . $relative_path : $src;
		}

		$extension = strtolower( pathinfo( $real_file, PATHINFO_EXTENSION ) );
		if ( ! in_array( $extension, array( 'woff2', 'woff', 'ttf', 'otf' ), true ) ) {
			return $src;
		}

		$zip_path = array_search( $real_file, $files, true );
		if ( false === $zip_path ) {
			$name     = pathinfo( $real_file, PATHINFO_FILENAME );
			$suffix   = '.' . pathinfo( $real_file, PATHINFO_EXTENSION );
			$zip_path = 'assets/fonts/' . $name . $suffix;
			for ( $i = 1; isset( $files[ $zip_path ] ) || in_array( $zip_path, $reserved_paths, true ) || file_exists( get_template_directory() . '/' . $zip_path ); $i++ ) {
				$zip_path = 'assets/fonts/' . $name . '-' . $i . $suffix;
			}
			$files[ $zip_path ] = $real_file;
		}

		return 'file:./' . $zip_path;
	}

	return $src;
}

/**
 * Points the font faces in a theme.json array at files in the export.
 *
 * Visits the top-level and per-block `typography.fontFamilies` settings, as
 * returned by `WP_Theme_JSON_Gutenberg::get_data()`.
 *
 * @since 24.5.0
 *
 * @param array    $theme_json_raw Theme.json data.
 * @param string[] $reserved_paths Paths in the archive that are already taken.
 * @return array {
 *     @type array    $theme_json Theme.json data with updated font face sources.
 *     @type string[] $files      Files to add to the export, keyed by their path in the archive.
 * }
 */
function gutenberg_prepare_theme_json_fonts_for_export( array $theme_json_raw, array $reserved_paths = array() ) {
	$files = array();

	$update_font_families = static function ( $font_families ) use ( &$files, $reserved_paths ) {
		if ( ! is_array( $font_families ) ) {
			return $font_families;
		}

		foreach ( $font_families as $family_index => $font_family ) {
			if ( ! isset( $font_family['fontFace'] ) || ! is_array( $font_family['fontFace'] ) ) {
				continue;
			}

			foreach ( $font_family['fontFace'] as $face_index => $font_face ) {
				if ( ! isset( $font_face['src'] ) ) {
					continue;
				}

				if ( is_array( $font_face['src'] ) ) {
					foreach ( $font_face['src'] as $src_index => $src ) {
						$font_families[ $family_index ]['fontFace'][ $face_index ]['src'][ $src_index ] = gutenberg_get_font_face_src_for_export( $src, $files, $reserved_paths );
					}
				} else {
					$font_families[ $family_index ]['fontFace'][ $face_index ]['src'] = gutenberg_get_font_face_src_for_export( $font_face['src'], $files, $reserved_paths );
				}
			}
		}

		return $font_families;
	};

	if ( isset( $theme_json_raw['settings']['typography']['fontFamilies'] ) ) {
		$theme_json_raw['settings']['typography']['fontFamilies'] = $update_font_families( $theme_json_raw['settings']['typography']['fontFamilies'] );
	}

	if ( isset( $theme_json_raw['settings']['blocks'] ) && is_array( $theme_json_raw['settings']['blocks'] ) ) {
		foreach ( $theme_json_raw['settings']['blocks'] as $block_name => $block_settings ) {
			if ( isset( $block_settings['typography']['fontFamilies'] ) ) {
				$theme_json_raw['settings']['blocks'][ $block_name ]['typography']['fontFamilies'] = $update_font_families( $block_settings['typography']['fontFamilies'] );
			}
		}
	}

	return array(
		'theme_json' => $theme_json_raw,
		'files'      => $files,
	);
}

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * @since 5.9.0
 * @since 6.0.0 Adds the whole theme to the export archive.
 * @since 24.5.0 Includes Font Library fonts used by the theme.
 *
 * @global string $wp_version The WordPress version string.
 *
 * @return WP_Error|string Path of the ZIP file or error on failure.
 */
function gutenberg_generate_block_templates_export_file() {
	global $wp_version;

	if ( ! class_exists( 'ZipArchive' ) ) {
		return new WP_Error( 'missing_zip_package', __( 'Zip Export not supported.', 'gutenberg' ) );
	}

	$obscura    = wp_generate_password( 12, false, false );
	$theme_name = basename( get_stylesheet() );
	$filename   = get_temp_dir() . $theme_name . $obscura . '.zip';

	$zip = new ZipArchive();
	if ( true !== $zip->open( $filename, ZipArchive::CREATE | ZipArchive::OVERWRITE ) ) {
		return new WP_Error( 'unable_to_create_zip', __( 'Unable to open export file (archive) for writing.', 'gutenberg' ) );
	}

	$zip->addEmptyDir( 'templates' );
	$zip->addEmptyDir( 'parts' );

	// Get path of the theme.
	$theme_path = wp_normalize_path( get_stylesheet_directory() );

	// Create recursive directory iterator.
	$theme_files = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $theme_path ),
		RecursiveIteratorIterator::LEAVES_ONLY
	);

	// Make a copy of the current theme.
	$theme_file_paths = array();
	foreach ( $theme_files as $file ) {
		// Skip directories as they are added automatically.
		if ( ! $file->isDir() ) {
			// Get real and relative path for current file.
			$file_path     = wp_normalize_path( $file );
			$relative_path = substr( $file_path, strlen( $theme_path ) + 1 );

			if ( ! wp_is_theme_directory_ignored( $relative_path ) ) {
				$zip->addFile( $file_path, $relative_path );
				$theme_file_paths[] = $relative_path;
			}
		}
	}

	// Load templates into the zip file.
	$templates = get_block_templates();
	foreach ( $templates as $template ) {
		$template->content = traverse_and_serialize_blocks(
			parse_blocks( $template->content ),
			'_remove_theme_attribute_from_template_part_block'
		);

		$zip->addFromString(
			'templates/' . $template->slug . '.html',
			$template->content
		);
	}

	// Load template parts into the zip file.
	$template_parts = get_block_templates( array(), 'wp_template_part' );
	foreach ( $template_parts as $template_part ) {
		$zip->addFromString(
			'parts/' . $template_part->slug . '.html',
			$template_part->content
		);
	}

	// Load theme.json into the zip file.
	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data( array(), array( 'with_supports' => false ) );
	// Merge with user data.
	$tree->merge( WP_Theme_JSON_Resolver_Gutenberg::get_user_data() );

	$theme_json_raw = $tree->get_data();

	// Copy the Font Library fonts the theme uses, and point theme.json at the copies.
	$fonts_export   = gutenberg_prepare_theme_json_fonts_for_export( $theme_json_raw, $theme_file_paths );
	$theme_json_raw = $fonts_export['theme_json'];
	foreach ( $fonts_export['files'] as $zip_path => $font_file_path ) {
		$zip->addFile( $font_file_path, $zip_path );
	}
	// If a version is defined, add a schema.
	if ( $theme_json_raw['version'] ) {
		$theme_json_version = 'wp/' . substr( $wp_version, 0, 3 );
		$schema             = array( '$schema' => 'https://schemas.wp.org/' . $theme_json_version . '/theme.json' );
		$theme_json_raw     = array_merge( $schema, $theme_json_raw );
	}

	// Convert to a string.
	$theme_json_encoded = wp_json_encode( $theme_json_raw, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );

	// Replace 4 spaces with a tab.
	$theme_json_tabbed = preg_replace( '~(?:^|\G)\h{4}~m', "\t", $theme_json_encoded );

	// Add the theme.json file to the zip.
	$zip->addFromString(
		'theme.json',
		$theme_json_tabbed
	);

	// Save changes to the zip file.
	$zip->close();

	return $filename;
}
