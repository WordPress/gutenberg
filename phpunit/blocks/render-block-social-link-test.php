<?php
/**
 * Social Icon block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Social Icon block.
 *
 * @group blocks
 */
class Render_Block_Social_Link_Test extends WP_UnitTestCase {

	/**
	 * @dataProvider data_link_href
	 *
	 * @covers ::gutenberg_render_block_core_social_link
	 *
	 * @param string $url           The Social Icon's link.
	 * @param string $expected_href The rendered link.
	 */
	public function test_link_href( $url, $expected_href ) {
		$attributes = wp_json_encode(
			array(
				'url'     => $url,
				'service' => 'feed',
			)
		);
		$markup     = '<!-- wp:social-links --><ul class="wp-block-social-links"><!-- wp:social-link ' . $attributes . ' /--></ul><!-- /wp:social-links -->';

		$processor = new WP_HTML_Tag_Processor( do_blocks( $markup ) );
		$this->assertTrue(
			$processor->next_tag( array( 'class_name' => 'wp-block-social-link-anchor' ) ),
			'The Social Icon link should be rendered.'
		);
		$this->assertSame( $expected_href, $processor->get_attribute( 'href' ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_link_href() {
		return array(
			'site-relative link'               => array( '/feed/', '/feed/' ),
			'site-relative link, no end slash' => array( '/contact', '/contact' ),
			'query'                            => array( '?s=wordpress', '?s=wordpress' ),
			'fragment'                         => array( '#instagram', '#instagram' ),
			'protocol-relative link'           => array( '//wordpress.org/', '//wordpress.org/' ),
			'link with a scheme'               => array( 'https://wordpress.org/', 'https://wordpress.org/' ),
			'domain without a scheme'          => array( 'wordpress.org', 'https://wordpress.org' ),
			'domain and path without a scheme' => array( 'profiles.wordpress.org/wordpress/', 'https://profiles.wordpress.org/wordpress/' ),
		);
	}
}
