<?php
/**
 * Tests WP_Navigation_Fallbacks_Gutenberg
 *
 * @package WordPress
 */

/**
 * Tests for the WP_Navigation_Fallbacks_Gutenberg class.
 */
class WP_Navigation_Fallbacks_Gutenberg_Test extends WP_UnitTestCase {

	public function test_it_exists() {
		$this->assertTrue( class_exists( 'WP_Navigation_Fallbacks_Gutenberg' ) );
	}

	public function test_should_return_a_default_fallback_navigation_menu_in_absence_of_other_fallbacks() {

		$data = WP_Navigation_Fallbacks_Gutenberg::get_fallback_menu();

		$this->assertInstanceOf( 'WP_Post', $data );

		$this->assertSame( 'wp_navigation', $data->post_type, 'Fallback menu type should be `wp_navigation`' );

		$this->assertSame( 'Navigation', $data->post_title, 'Fallback menu title should be the default fallback title' );

		$this->assertSame( 'navigation', $data->post_name, 'Fallback menu slug (post_name) should be the default slug' );

		$this->assertSame( '<!-- wp:page-list /-->', $data->post_content );

		$navs_in_db = $this->get_navigations_in_database();

		$this->assertCount( 1, $navs_in_db, 'The fallback Navigation post should be the only one in the database.' );
	}

	private function get_navigations_in_database() {
		$navs_in_db = new WP_Query(
			array(
				'post_type'      => 'wp_navigation',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		return $navs_in_db->posts ? $navs_in_db->posts : array();
	}

}
