<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.0.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

/**
 * Filters theme files and folders that should be ignored during export.
 *
 * @since 6.0.0
 *
 * @param string $path The path of the file in the theme.
 * @return Bool Whether this file or directory is ignored.
 */
function gutenberg_is_theme_directory_ignored( $path ) {
	$ignore_list = array( '.DS_Store', '.svn', '.git', '.hg', '.bzr', 'node_modules', 'vendor' );
	foreach ( $ignore_list as $ignored ) {
		if ( str_starts_with( $path, $ignored ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * @since 5.9.0
 * @since 6.0.0 Adds theme.json to the export archive.
 *
 * @return WP_Error|string Path of the ZIP file or error on failure.
 */
function gutenberg_generate_block_templates_export_file() {
	if ( ! class_exists( 'ZipArchive' ) ) {
		return new WP_Error( 'missing_zip_package', __( 'Zip Export not supported.', 'gutenberg' ) );
	}

	$obscura    = wp_generate_password( 12, false, false );
	$theme_name = wp_get_theme()->get( 'TextDomain' );
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

			if ( ! gutenberg_is_theme_directory_ignored( $relative_path ) ) {
				$zip->addFile( $file_path, $relative_path );
			}
		}
	}

	// Load templates into the zip file.
	$templates = gutenberg_get_block_templates();
	foreach ( $templates as $template ) {
		$template->content = _remove_theme_attribute_in_block_template_content( $template->content );

		$zip->addFromString(
			'templates/' . $template->slug . '.html',
			$template->content
		);
	}

	// Load template parts into the zip file.
	$template_parts = gutenberg_get_block_templates( array(), 'wp_template_part' );
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
		global $wp_version;
		$theme_json_version = 'wp/' . substr( $wp_version, 0, 3 );
		if ( defined( 'IS_GUTENBERG_PLUGIN' ) ) {
			$theme_json_version = 'trunk';
		}
		$schema         = array( '$schema' => 'https://schemas.wp.org/' . $theme_json_version . '/theme.json' );
		$theme_json_raw = array_merge( $schema, $theme_json_raw );
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
