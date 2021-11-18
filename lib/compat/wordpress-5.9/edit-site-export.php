<?php
/**
 * Edit Site utility methods.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'wp_generate_edit_site_export_file' ) ) {
	/**
	 * Creates an export of the current templates and
	 * template parts from the site editor at the
	 * specified path in a ZIP file.
	 *
	 * @return WP_Error|string Path of the ZIP file or error on failure.
	 */
	function wp_generate_edit_site_export_file() {
		if ( ! class_exists( 'ZipArchive' ) ) {
			return new WP_Error( __( 'Zip Export not supported.', 'gutenberg' ) );
		}

		$obscura  = wp_generate_password( 12, false, false );
		$filename = get_temp_dir() . 'edit-site-export-' . $obscura . '.zip';

		$zip = new ZipArchive();
		if ( true !== $zip->open( $filename, ZipArchive::CREATE ) ) {
			return new WP_Error( __( 'Unable to open export file (archive) for writing.', 'gutenberg' ) );
		}

		$zip->addEmptyDir( 'theme' );
		$zip->addEmptyDir( 'theme/block-templates' );
		$zip->addEmptyDir( 'theme/block-template-parts' );

		// Load theme and user styles.
		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();
		$user_data  = WP_Theme_JSON_Resolver_Gutenberg::get_user_data();

		// Merge the user config into the theme data.
		// The user config takes precedence over the theme.
		$theme_data->merge( $user_data );

		$zip->addFromString(
			'theme/theme.json',
			wp_json_encode( $theme_data->get_raw_data(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
		);

		// Load templates into the zip file.
		$templates = gutenberg_get_block_templates();
		foreach ( $templates as $template ) {
			$template->content = _remove_theme_attribute_in_block_template_content( $template->content );

			$zip->addFromString(
				'theme/block-templates/' . $template->slug . '.html',
				$template->content
			);
		}

		// Load template parts into the zip file.
		$template_parts = gutenberg_get_block_templates( array(), 'wp_template_part' );
		foreach ( $template_parts as $template_part ) {
			$zip->addFromString(
				'theme/block-template-parts/' . $template_part->slug . '.html',
				$template_part->content
			);
		}

		// Save changes to the zip file.
		$zip->close();

		return $filename;
	}
}
