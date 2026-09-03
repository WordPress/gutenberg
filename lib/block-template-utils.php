<?php
/**
 * Utilities used to fetch and create templates and template parts.
 *
 * @package gutenberg
 */

/**
 * Finds an available path in a ZIP archive by appending a numeric suffix if needed.
 *
 * @since 7.1.0
 * @access private
 *
 * @param ZipArchive $zip  ZIP archive.
 * @param string     $path Desired path in the ZIP archive.
 * @return string Available path in the ZIP archive.
 */
function gutenberg_get_available_zip_path( $zip, $path ) {
	$path       = ltrim( wp_normalize_path( $path ), '/' );
	$path_info  = pathinfo( $path );
	$directory  = ( ! empty( $path_info['dirname'] ) && '.' !== $path_info['dirname'] ) ? trailingslashit( $path_info['dirname'] ) : '';
	$filename   = $path_info['filename'] ?? '';
	$extension  = empty( $path_info['extension'] ) ? '' : '.' . $path_info['extension'];
	$candidate  = $directory . $filename . $extension;
	$file_index = 1;

	while ( false !== $zip->locateName( $candidate ) || false !== $zip->locateName( trailingslashit( $candidate ) ) ) {
		$candidate = $directory . $filename . '-' . $file_index . $extension;
		++$file_index;
	}

	return $candidate;
}

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * @since 5.9.0
 * @since 6.0.0 Adds the whole theme to the export archive.
 * @since 7.1.0 Adds uploaded files to the export archive.
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
	foreach ( $theme_files as $file ) {
		// Skip directories as they are added automatically.
		if ( ! $file->isDir() ) {
			// Get real and relative path for current file.
			$file_path     = wp_normalize_path( $file );
			$relative_path = substr( $file_path, strlen( $theme_path ) + 1 );

			if ( ! wp_is_theme_directory_ignored( $relative_path ) ) {
				$zip->addFile( $file_path, $relative_path );
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
	// If a version is defined, add a schema.
	if ( $theme_json_raw['version'] ) {
		$theme_json_version = 'wp/' . substr( $wp_version, 0, 3 );
		$schema             = array( '$schema' => 'https://schemas.wp.org/' . $theme_json_version . '/theme.json' );
		$theme_json_raw     = array_merge( $schema, $theme_json_raw );
	}

	// Find any uploaded files.
	$uris_to_migrate = WP_Theme_JSON_Resolver_Gutenberg::get_migrated_relative_theme_uris(
		$tree,
		array(
			'relative_path_prefix' => 'file:./assets/',
		)
	);
	if ( ! empty( $uris_to_migrate ) ) {
		$uploads              = wp_upload_dir();
		$uploaded_asset_paths = array();
		foreach ( $uris_to_migrate as $uri ) {
			$relative_file_path = $uri['relative_path'] ?? '';
			if ( ! is_string( $relative_file_path ) || '' === $relative_file_path || validate_file( $relative_file_path ) > 0 ) {
				continue;
			}

			$file = wp_normalize_path( trailingslashit( $uploads['basedir'] ) . $relative_file_path );
			if ( ! is_file( $file ) || ! is_readable( $file ) ) {
				continue;
			}

			if ( ! isset( $uploaded_asset_paths[ $file ] ) ) {
				$file_content = file_get_contents( $file );
				if ( false === $file_content ) {
					continue;
				}

				$asset_path = gutenberg_get_available_zip_path( $zip, 'assets/' . $relative_file_path );
				if ( false === $zip->addFromString( $asset_path, $file_content ) ) {
					continue;
				}

				$uploaded_asset_paths[ $file ] = $asset_path;
			}

			$href   = 'file:./' . $uploaded_asset_paths[ $file ];
			$target = $uri['target'];
			if ( str_ends_with( $target, 'background.backgroundImage.url' ) ) {
				/*
				 * For background images, reset the backgroundImage object
				 * to remove upload "id", "source", and "title".
				 * Done by removing .url from the path to get the target, and setting
				 * href to replace the `background.backgroundImage` object.
				 */
				$target = substr( $target, 0, -strlen( '.url' ) );
				$href   = array(
					'url' => $href,
				);
			}
			$path = explode( '.', $target );
			_wp_array_set( $theme_json_raw, $path, $href );
		}
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
