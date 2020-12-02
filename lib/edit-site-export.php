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
	// Theme templates and template parts need to be synchronized
	// before the export.
	_gutenberg_synchronize_theme_templates( 'template-part' );
	_gutenberg_synchronize_theme_templates( 'template' );

	// Create ZIP file and directories.
	$filename = tempnam( get_temp_dir(), 'edit-site-export' );
	$zip      = new ZipArchive();
	$zip->open( $filename, ZipArchive::OVERWRITE );
	$zip->addEmptyDir( 'theme' );
	$zip->addEmptyDir( 'theme/block-templates' );
	$zip->addEmptyDir( 'theme/block-template-parts' );

	$theme = wp_get_theme()->get_stylesheet();

	// Load templates into the zip file.
	$template_query = new WP_Query(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => array( 'publish', 'auto-draft' ),
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'slug',
					'terms'    => $theme,
				),
			),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		)
	);
	while ( $template_query->have_posts() ) {
		$template = $template_query->next_post();
		$zip->addFromString(
			'theme/block-templates/' . $template->post_name . '.html',
			gutenberg_strip_post_ids_from_template_part_blocks( $template->post_content )
		);
	}

	// Load template parts into the zip file.
	$template_part_query = new WP_Query(
		array(
			'post_type'      => 'wp_template_part',
			'post_status'    => array( 'publish', 'auto-draft' ),
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'slug',
					'terms'    => $theme,
				),
			),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		)
	);
	while ( $template_part_query->have_posts() ) {
		$template_part = $template_part_query->next_post();
		$zip->addFromString(
			'theme/block-template-parts/' . $template_part->post_name . '.html',
			gutenberg_strip_post_ids_from_template_part_blocks( $template_part->post_content )
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
