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
}

