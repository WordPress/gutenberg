<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 6.0.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

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

	$obscura  = wp_generate_password( 12, false, false );
	$filename = get_temp_dir() . 'edit-site-export-' . $obscura . '.zip';

	$zip = new ZipArchive();
	if ( true !== $zip->open( $filename, ZipArchive::CREATE | ZipArchive::OVERWRITE ) ) {
		return new WP_Error( 'unable_to_create_zip', __( 'Unable to open export file (archive) for writing.', 'gutenberg' ) );
	}

	$theme_name = wp_get_theme()->get('TextDomain');

	$zip->addEmptyDir( $theme_name );
	$zip->addEmptyDir( $theme_name . '/templates' );
	$zip->addEmptyDir( $theme_name . '/parts' );

	// Get path of the theme.
	$theme_path = wp_normalize_path( get_stylesheet_directory() );

	// Create recursive directory iterator.
	$theme_files = new RecursiveIteratorIterator(
		new RecursiveDirectoryIterator( $theme_path ),
		RecursiveIteratorIterator::LEAVES_ONLY
	);

	// Make a copy of the current theme.
	foreach ($theme_files as $name => $file ) {
		// Skip directories as they are added automatically.
		if ( ! $file->isDir() ) {
			// Get real and relative path for current file.
			$file_path = wp_normalize_path( $file->getRealPath() );
			$relative_path = substr( $file_path, strlen( $theme_path) + 1 );

			$zip->addFile( $file_path, $theme_name . '/' . $relative_path );
		}
	}

	// Load templates into the zip file.
	$templates = gutenberg_get_block_templates();
	foreach ( $templates as $template ) {
		$template->content = _remove_theme_attribute_in_block_template_content( $template->content );

		$zip->addFromString(
			$theme_name . '/templates/' . $template->slug . '.html',
			$template->content
		);
	}

	// Load template parts into the zip file.
	$template_parts = gutenberg_get_block_templates( array(), 'wp_template_part' );
	foreach ( $template_parts as $template_part ) {
		$zip->addFromString(
			$theme_name . '/parts/' . $template_part->slug . '.html',
			$template_part->content
		);
	}

	// Load theme.json into the zip file.
	$tree = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();
	$tree->merge( WP_Theme_JSON_Resolver_Gutenberg::get_user_data() );

	$zip->addFromString(
		$theme_name . '/theme.json',
		wp_json_encode( $tree->get_data(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
	);

	$zip->addFile(
		wp_normalize_path( get_stylesheet_directory() ) . '/index.php',
		'theme/index.php'
	);

	$zip->addFile(
		wp_normalize_path( get_stylesheet_directory() ) . '/style.css',
		'theme/style.css'
	);

	// Save changes to the zip file.
	$zip->close();

	return $filename;
}
