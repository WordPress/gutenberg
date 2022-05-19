<?php

/**
 * Test the Global Styles lib
 *
 * @package Gutenberg
 */

class WP_Global_Styles_Test extends WP_UnitTestCase {
	function test_gutenberg_global_styles_filter_post() {
		$user_theme_json = '{
			"isGlobalStylesUserThemeJSON": 1,
			"version": 1,
			"settings": {
				"typography": {
					"fontFamilies": {
						"fontFamily": "\"DM Sans\", sans-serif",
						"slug": "dm-sans",
						"name": "DM Sans",
					}
				}
			}
		}';

		$filtered_user_theme_json = gutenberg_global_styles_filter_post( $user_theme_json );
		$this->assertEquals( $user_theme_json, $filtered_user_theme_json );
	}
}
