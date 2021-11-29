<?php
/**
 * This class tests block template loader functions
 *
 * @package Gutenberg
 */

class WP_Template_Loader_Test extends WP_UnitTestCase {

	public function test_gutenberg_get_edit_template_link_returns_admin_url_link_for_template_posts() {
		$stylesheet = get_stylesheet();
		$args       = array(
			'post_type'    => 'wp_template',
			'post_name'    => 'my_template',
			'post_title'   => 'My Template',
			'post_content' => 'Content',
			'post_excerpt' => 'Description of my template.',
			'tax_input'    => array(
				'wp_theme' => array(
					$stylesheet,
				),
			),
		);
		$post       = self::factory()->post->create_and_get( $args );

		wp_set_post_terms( $post->ID, get_stylesheet(), 'wp_theme' );
		$default_url = 'https://some.link';
		$url         = gutenberg_get_edit_template_link( $default_url, $post->ID );
		$this->assertIsString( $url );
		$this->assertNotSame( $default_url, $url );
		$this->assertStringContainsString( 'themes.php', $url );
		$this->assertStringContainsString( 'postId', $url );
		$this->assertStringContainsString( $stylesheet, $url );
		wp_delete_post( $post->ID );
	}

	public function test_gutenberg_get_edit_template_link_returns_default_link_for_non_template_posts() {
		$post        = self::factory()->post->create_and_get();
		$default_url = 'https://some.link';
		$url         = gutenberg_get_edit_template_link( $default_url, $post->ID );
		$this->assertSame( $default_url, $url );
		wp_delete_post( $post->ID );
	}
}
