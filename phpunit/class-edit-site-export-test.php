<?php
/**
 * Test `wp_generate_edit_site_export_file` and its helper functions.
 *
 * @package    Gutenberg
 */

class Edit_Site_Export_Test extends WP_UnitTestCase {
	function test_wp_generate_edit_site_export_file() {
		$filename = wp_generate_edit_site_export_file();
		$this->assertTrue( file_exists( $filename ), 'zip file is created at the specified path' );
		$this->assertTrue( filesize( $filename ) > 0, 'zip file is larger than 0 bytes' );

		// Open ZIP file and make sure the directories exist.
		$zip = new ZipArchive();
		$zip->open( $filename, ZipArchive::RDONLY );
		$has_theme_dir                = $zip->locateName( 'theme/' ) !== false;
		$has_block_templates_dir      = $zip->locateName( 'theme/block-templates/' ) !== false;
		$has_block_template_parts_dir = $zip->locateName( 'theme/block-template-parts/' ) !== false;
		$this->assertTrue( $has_theme_dir, 'theme directory exists' );
		$this->assertTrue( $has_block_templates_dir, 'theme/block-templates directory exists' );
		$this->assertTrue( $has_block_template_parts_dir, 'theme/block-template-parts directory exists' );

		// ZIP file contains at least one HTML file.
		$has_html_files = false;
		$num_files      = $zip->count();
		for ( $i = 0; $i < $num_files; $i++ ) {
			$filename = $zip->getNameIndex( $i );
			if ( '.html' === substr( $filename, -5 ) ) {
				$has_html_files = true;
				break;
			}
		}
		$this->assertTrue( $has_html_files, 'contains at least one html file' );
	}
}

