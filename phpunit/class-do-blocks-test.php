<?php
/**
 * `do_blocks` rendering test
 *
 * @package Gutenberg
 */

/**
 * Test do_blocks
 */
class Do_Blocks_Test extends WP_UnitTestCase {
	/**
	 * Tear down.
	 */
	function tearDown() {
		parent::tearDown();

		$registry = WP_Block_Type_Registry::get_instance();

		if ( $registry->is_registered( 'core/dummy' ) ) {
			$registry->unregister( 'core/dummy' );
		}
	}

	/**
	 * Test do_blocks removes comment demarcations.
	 *
	 * @covers ::do_blocks
	 */
	function test_do_blocks_removes_comments() {
		$original_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/do-blocks-original.html' );
		$expected_html = file_get_contents( dirname( __FILE__ ) . '/fixtures/do-blocks-expected.html' );

		$actual_html = do_blocks( $original_html );

		$this->assertEquals( $expected_html, $actual_html );
	}

	/**
	 * Test that shortcode blocks get the same HTML as shortcodes in Classic content.
	 */
	function test_the_content() {
		add_shortcode( 'someshortcode', array( $this, 'handle_shortcode' ) );

		$classic_content = "Foo\n\n[someshortcode]\n\nBar\n\n[/someshortcode]\n\nBaz";
		$block_content   = "<!-- wp:core/paragraph --><p>Foo</p>\n<!-- /wp:core/paragraph -->\n\n<!-- wp:core/shortcode -->[someshortcode]\n\nBar\n\n[/someshortcode]<!-- /wp:core/shortcode -->\n\n<!-- wp:core/paragraph -->\n<p>Baz</p>\n<!-- /wp:core/paragraph -->";

		$classic_filtered_content = apply_filters( 'the_content', $classic_content );
		$block_filtered_content   = apply_filters( 'the_content', $block_content );

		// Block rendering add some extra blank lines, but we're not worried about them.
		$block_filtered_content = preg_replace( "/\n{2,}/", "\n", $block_filtered_content );

		$this->assertEquals( $classic_filtered_content, $block_filtered_content );
	}

	function test_can_nest_at_least_so_deep() {
		$minimum_depth = 99;

		$content = 'deep inside';
		for ( $i = 0; $i < $minimum_depth; $i++ ) {
			$content = '<!-- wp:dummy -->' . $content . '<!-- /wp:dummy -->';
		}

		$this->assertEquals( 'deep inside', do_blocks( $content ) );
	}

	function test_can_nest_at_least_so_deep_with_dynamic_blocks() {
		$minimum_depth = 99;

		$content = '0';
		for ( $i = 0; $i < $minimum_depth; $i++ ) {
			$content = '<!-- wp:dummy -->' . $content . '<!-- /wp:dummy -->';
		}

		register_block_type(
			'core/dummy',
			array(
				'render_callback' => array(
					$this,
					'render_dynamic_incrementer',
				)
			)
		);

		$this->assertEquals( $minimum_depth, (int) do_blocks( $content ) );
	}

	function handle_shortcode( $atts, $content ) {
		return $content;
	}

	function render_dynamic_incrementer( $attrs, $content ) {
		return (string) ( 1 + (int) $content );
	}
}
