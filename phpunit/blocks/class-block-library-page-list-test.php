<?php
/**
 * Tests for the core/page-list block.
 *
 * @package    gutenberg
 * @subpackage block-library
 */

class Block_Library_Page_List_Test extends WP_UnitTestCase {
	public function test_global_styles_minimum_size_skips_open_overlay() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/page-list' => array(
							'dimensions' => array(
								'minWidth' => '300px',
							),
							'@mobile'    => array(
								'dimensions' => array(
									'minHeight' => '80px',
								),
							),
						),
					),
				),
			)
		);

		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );
		$selector   = ':root :where(.wp-block-page-list:not(.wp-block-navigation__responsive-container.is-menu-open *))';

		$this->assertStringContainsString( $selector . '{min-width: 300px;}', $stylesheet );
		$this->assertStringContainsString( '{' . $selector . '{min-height: 80px;}}', $stylesheet );
		$this->assertStringNotContainsString( ':root :where(.wp-block-page-list){', $stylesheet );
	}
}
