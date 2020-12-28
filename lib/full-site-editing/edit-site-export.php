<?php
/**
 * REST endpoint for exporting the contents of the Edit Site Page editor.
 *
 * @package gutenberg
 */

/**
 * Output a ZIP file with an export of the current templates
 * and template parts from the site editor, and close the connection.
 */
function gutenberg_edit_site_export() {
	// Create ZIP file and directories.
	$filename = tempnam( get_temp_dir(), 'edit-site-export' );
	$zip      = new ZipArchive();
	$zip->open( $filename, ZipArchive::OVERWRITE );
	$zip->addEmptyDir( 'theme' );
	$zip->addEmptyDir( 'theme/block-templates' );
	$zip->addEmptyDir( 'theme/block-template-parts' );

	// Load templates into the zip file.
	$templates = gutenberg_get_block_templates( array( 'theme' => wp_get_theme()->get_stylesheet() ) );
	foreach ( $templates as $template ) {
		$zip->addFromString(
			'theme/block-templates/' . $template->slug . '.html',
			gutenberg_strip_post_ids_from_template_part_blocks( $template->content )
		);
	}

	// Load template parts into the zip file.
	$template_parts = gutenberg_get_block_templates( array( 'theme' => wp_get_theme()->get_stylesheet() ), 'wp_template_part' );
	foreach ( $template_parts as $template_part ) {
		$zip->addFromString(
			'theme/block-template-parts/' . $template_part->slug . '.html',
			gutenberg_strip_post_ids_from_template_part_blocks( $template_part->content )
		);
	}

	// Send back the ZIP file.
	$zip->close();
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

/**
 * Remove post id attributes from template part blocks.
 *
 * This is needed so that Gutenberg loads the HTML file of the template, instead of looking for a template part post.
 *
 * @param string $template_content Template content to modify.
 *
 * @return string Potentially modified template content.
 */
function gutenberg_strip_post_ids_from_template_part_blocks( $template_content ) {
	$blocks = parse_blocks( $template_content );

	array_walk(
		$blocks,
		function( &$block ) {
			if ( 'core/template-part' !== $block['blockName'] ) {
				return;
			}

			unset( $block['attrs']['postId'] );
		}
	);

	return serialize_blocks( $blocks );
}
