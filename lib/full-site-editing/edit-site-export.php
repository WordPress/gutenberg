<?php
/**
 * REST endpoint for exporting the contents of the Edit Site Page editor.
 *
 * @package gutenberg
 */

/**
 * Parses wp_template content and removes the theme attribute from
 * each wp_template_part
 *
 * @param string $template_content serialized wp_template content.
 *
 * @return string Updated wp_template content.
 */
function _remove_theme_attribute_from_content( $template_content ) {
	$has_updated_content = false;
	$new_content         = '';
	$template_blocks     = parse_blocks( $template_content );

	$blocks = _gutenberg_flatten_blocks( $template_blocks );
	foreach ( $blocks as $key => $block ) {
		if ( 'core/template-part' === $block['blockName'] && isset( $block['attrs']['theme'] ) ) {
			unset( $blocks[ $key ]['attrs']['theme'] );
			$has_updated_content = true;
		}
	}

	if ( $has_updated_content ) {
		foreach ( $template_blocks as $block ) {
			$new_content .= serialize_block( $block );
		}

		return $new_content;
	}

	return $template_content;
}

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * @param string $filename path of the ZIP file.
 */
function gutenberg_edit_site_export_create_zip( $filename ) {
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
		$template->content = _remove_theme_attribute_from_content( $template->content );

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
}

/**
 * Output a ZIP file with an export of the current templates
 * and template parts from the site editor, and close the connection.
 */
function gutenberg_edit_site_export() {
	// Create ZIP file in the temporary directory.
	$filename = tempnam( get_temp_dir(), 'edit-site-export' );
	gutenberg_edit_site_export_create_zip( $filename );

	header( 'Content-Type: application/zip' );
	header( 'Content-Disposition: attachment; filename=edit-site-export.zip' );
	header( 'Content-Length: ' . filesize( $filename ) );
	flush();
	echo readfile( $filename );
	die();
}

add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'__experimental/edit-site/v1',
			'/export',
			array(
				'methods'             => 'GET',
				'callback'            => 'gutenberg_edit_site_export',
				'permission_callback' => function () {
					return current_user_can( 'edit_theme_options' );
				},
			)
		);
	}
);
