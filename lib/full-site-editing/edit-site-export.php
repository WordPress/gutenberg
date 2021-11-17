<?php
/**
 * Edit Site utility methods.
 *
 * @package gutenberg
 */

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * @param string $filename path of the ZIP file.
 *
 * @return WP_Error|bool
 */
function gutenberg_generate_edit_site_export_file( $filename ) {
	if ( ! class_exists( 'ZipArchive' ) ) {
		return new WP_Error( 'Zip Export not supported.' );
	}

	$zip = new ZipArchive();
	$zip->open( $filename, ZipArchive::OVERWRITE );
	$zip->addEmptyDir( 'theme' );
	$zip->addEmptyDir( 'theme/block-templates' );
	$zip->addEmptyDir( 'theme/block-template-parts' );

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

	return true;
}
