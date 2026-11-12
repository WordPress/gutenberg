<?php
/**
 * Utilities used to fetch and create templates and template parts.
 *
 * @package gutenberg
 */

/**
 * Gets the target export directory for a template or template part.
 *
 * User-created templates and template parts without a corresponding theme file
 * are routed to 'custom-templates/' or 'custom-parts/'. Unmodified plugin-registered
 * items are omitted from the theme export.
 *
 * @since 24.0.0
 *
 * @param WP_Block_Template $template Block template or template part object.
 * @return string|null Export directory path with a trailing slash, or null to skip exporting.
 */
function gutenberg_get_template_export_directory( $template ) {
	$is_part = 'wp_template_part' === $template->type;

	if ( 'plugin' === $template->source ) {
		return null;
	}

	$is_user_created = 'custom' === $template->source && empty( $template->has_theme_file );

	if ( $is_user_created ) {
		return $is_part ? 'custom-parts/' : 'custom-templates/';
	}

	return $is_part ? 'parts/' : 'templates/';
}

/**
 * Adds templates or template parts to the export archive.
 *
 * @since 24.0.0
 *
 * @param ZipArchive          $zip       Export zip archive instance.
 * @param WP_Block_Template[] $templates Templates or template parts.
 * @param array               $manifest  Custom exports, collected for the README.
 */
function gutenberg_add_templates_to_export_zip( ZipArchive $zip, array $templates, array &$manifest ) {
	foreach ( $templates as $template ) {
		$directory = gutenberg_get_template_export_directory( $template );
		if ( null === $directory ) {
			continue;
		}

		// Parts can contain nested template part blocks with a `theme` attribute.
		$content = traverse_and_serialize_blocks(
			parse_blocks( $template->content ),
			'_remove_theme_attribute_from_template_part_block'
		);

		$path = $directory . $template->slug . '.html';

		$zip->addFromString( $path, $content );

		if ( 'custom-templates/' === $directory || 'custom-parts/' === $directory ) {
			$is_part = 'wp_template_part' === $template->type;

			$manifest[] = array(
				'path'               => $path,
				'title'              => is_string( $template->title ) ? $template->title : $template->slug,
				'slug'               => $template->slug,
				'is_part'            => $is_part,
				'area'               => $is_part && ! empty( $template->area ) ? $template->area : '',
				// Default template types (404, archive, ...) are matched by the
				// template hierarchy, so only the rest need a "customTemplates" entry.
				'needs_registration' => ! $is_part && ! empty( $template->is_custom ),
			);
		}
	}
}

/**
 * Builds the README placed at the root of the export when custom files exist.
 *
 * @since 24.0.0
 *
 * @param array $manifest Entries collected while exporting.
 * @return string README contents.
 */
function gutenberg_get_custom_export_readme( array $manifest ) {
	$lines   = array();
	$lines[] = 'CUSTOM TEMPLATES AND TEMPLATE PARTS';
	$lines[] = '===================================';
	$lines[] = '';
	$lines[] = 'The files in custom-templates/ and custom-parts/ were created in the Site Editor';
	$lines[] = 'and do not exist in your theme. WordPress does not load them from these folders;';
	$lines[] = 'they are here for review.';
	$lines[] = '';
	$lines[] = 'To adopt a template, move it to templates/. To adopt a template part, move it to parts/.';
	$lines[] = '';
	$lines[] = 'Templates marked "needs a customTemplates entry" must also be added to';
	$lines[] = '"customTemplates" in theme.json so they can be selected in the editor. Set';
	$lines[] = '"postTypes" explicitly: when omitted it defaults to "page", and the editor does not';
	$lines[] = 'export which post types a newly created template was meant for.';
	$lines[] = '';
	$lines[] = 'Template parts can optionally be listed under "templateParts" in theme.json,';
	$lines[] = 'with the "area" shown below.';
	$lines[] = '';
	$lines[] = 'FILES';
	$lines[] = '-----';

	foreach ( $manifest as $entry ) {
		if ( $entry['is_part'] ) {
			$note = '' !== $entry['area']
				? sprintf( 'new template part (area: %s)', $entry['area'] )
				: 'new template part';
		} elseif ( $entry['needs_registration'] ) {
			$note = sprintf( 'new template, needs a customTemplates entry (name: "%s")', $entry['slug'] );
		} else {
			$note = 'new template';
		}

		$lines[] = sprintf( '%s  -  "%s"  -  %s', $entry['path'], $entry['title'], $note );
	}

	return implode( "\n", $lines ) . "\n";
}

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * Templates and template parts created by the user that do not exist in the
 * theme are placed in `custom-templates/` and `custom-parts/`, and documented
 * in a README at the archive root.
 *
 * @since 5.9.0
 * @since 6.0.0 Adds the whole theme to the export archive.
 * @since 24.0.0 Exports user created templates and parts to custom directories.
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

	// Custom exports, listed in the README.
	$manifest = array();

	// Load templates into the zip file.
	gutenberg_add_templates_to_export_zip( $zip, get_block_templates(), $manifest );

	// Load template parts into the zip file.
	gutenberg_add_templates_to_export_zip( $zip, get_block_templates( array(), 'wp_template_part' ), $manifest );

	// Explain the custom directories.
	if ( ! empty( $manifest ) ) {
		$zip->addFromString( 'CUSTOM-TEMPLATES-README.txt', gutenberg_get_custom_export_readme( $manifest ) );
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
