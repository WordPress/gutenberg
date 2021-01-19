<?php
/**
 * Test `gutenberg_edit_site_export` and its helper functions.
 *
 * @package    Gutenberg
 */

class Edit_Site_Export_Test extends WP_UnitTestCase {
	function test_remove_theme_attribute_from_content() {
		$content_without_theme_attribute = '<!-- wp:template-part {"slug":"header","theme":"tt1-blocks","align":"full","tagName":"header","className":"site-header"} /-->';
		$template_content                = _remove_theme_attribute_from_content( $content_without_theme_attribute );
		$expected                        = '<!-- wp:template-part {"slug":"header","align":"full","tagName":"header","className":"site-header"} /-->';
		$this->assertEquals( $expected, $template_content );

		// Does not modify content when there is no existing theme attribute.
		$content_with_existing_theme_attribute = '<!-- wp:template-part {"slug":"header","align":"full","tagName":"header","className":"site-header"} /-->';
		$template_content                      = _remove_theme_attribute_from_content( $content_with_existing_theme_attribute );
		$this->assertEquals( $content_with_existing_theme_attribute, $template_content );

		// Does not remove theme when there is no template part.
		$content_with_no_template_part = '<!-- wp:post-content /-->';
		$template_content              = _remove_theme_attribute_from_content( $content_with_no_template_part );
		$this->assertEquals( $content_with_no_template_part, $template_content );
	}

	function test_gutenberg_edit_site_export() {
		$filename = tempnam( get_temp_dir(), 'edit-site-export' );
		gutenberg_edit_site_export_create_zip( $filename );
		$this->assertTrue( file_exists( $filename ), 'zip file is created at the specified path' );
		$this->assertTrue( filesize( $filename ) > 0, 'zip file is larger than 0 bytes' );

		// Open ZIP file and make sure the directories exist.
		$zip = new ZipArchive();
		$zip->open( $filename, ZipArchive::RDONLY );
		$hasThemeDir              = $zip->locateName( 'theme/' ) !== false;
		$hasBlockTemplatesDir     = $zip->locateName( 'theme/block-templates/' ) !== false;
		$hasBlockTemplatePartsDir = $zip->locateName( 'theme/block-template-parts/' ) !== false;
		$this->assertTrue( $hasThemeDir, 'theme directory exists' );
		$this->assertTrue( $hasBlockTemplatesDir, 'theme/block-templates directory exists' );
		$this->assertTrue( $hasBlockTemplatePartsDir, 'theme/block-template-parts directory exists' );

		// ZIP file contains at least one HTML file.
		$hasHtmlFiles = false;
		for ( $i = 0; $i < $zip->numFiles; $i++ ) {
			$filename = $zip->getNameIndex( $i );
			if ( substr( $filename, -5 ) === '.html' ) {
				$hasHtmlFiles = true;
				break;
			}
		}
		$this->assertTrue( $hasHtmlFiles, 'contains at least one html file' );
	}
}

