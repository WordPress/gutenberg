<?php
/**
 * Blocks asset registration tests
 *
 * @package Gutenberg
 */

/**
 * Test registering scripts and styles, for theme view and editor view.
 */
class Asset_Registration_Test extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();

		register_block_type( 'core/text', array() );
	}

	function tearDown() {
		$GLOBALS['wp_registered_blocks'] = array();
	}

	/**
	 * Should reject blocks that are not registered.
	 *
	 * @expectedIncorrectUsage register_block_assets
	 */
	function test_registering_to_unregistered_block() {
		$result = register_block_assets( 'core/does-not-exist', array() );
		$this->assertFalse( $result );
	}

	/**
	 * Test registering to a block with empty assets.
	 */
	function test_registering_assets_to_registered_block_without_assets() {
		$assets = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$result = register_block_assets( 'core/text', $assets );

		global $wp_registered_blocks;

		$this->assertEquals( $assets, $wp_registered_blocks['core/text']['assets'] );
	}

	/**
	 * Test registering to a block with already existing assets.
	 */
	function test_registering_assets_to_registered_block_with_existing_assets() {
		$assets_1 = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		register_block_assets( 'core/text', $assets_1 );

		$assets_2 = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$result = register_block_assets( 'core/text', $assets_2 );

		$expected = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Should add an editor style asset for the block.
	 */
	function test_gutenberg_add_block_editor_style() {
		$expected = array(
			'editor' => array(
				'styles' => array(
					array(
						'handle' => 'my-handle',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => false,
						'media'  => 'all',
					),
				),
			),
		);
		gutenberg_add_block_editor_style( 'core/text', 'my-handle', 'https://wordpress.org/is-the-best' );

		global $wp_registered_blocks;

		$this->assertEquals( $expected, $wp_registered_blocks['core/text']['assets'] );
	}

	/**
	 * Should add an editor style asset for the block.
	 */
	function test_gutenberg_add_block_theme_style() {
		$expected = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'my-handle',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => false,
						'media'  => 'all',
					),
				),
			),
		);
		gutenberg_add_block_theme_style( 'core/text', 'my-handle', 'https://wordpress.org/is-the-best' );

		global $wp_registered_blocks;

		$this->assertEquals( $expected, $wp_registered_blocks['core/text']['assets'] );
	}

	/**
	 * Should add an editor script asset for the block.
	 */
	function test_gutenberg_add_block_editor_script() {
		$expected = array(
			'editor' => array(
				'scripts' => array(
					array(
						'handle' => 'my-handle',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => false,
						'in_footer'  => false,
					),
				),
			),
		);
		gutenberg_add_block_editor_script( 'core/text', 'my-handle', 'https://wordpress.org/is-the-best' );

		global $wp_registered_blocks;

		$this->assertEquals( $expected, $wp_registered_blocks['core/text']['assets'] );
	}

	/**
	 * Should add an editor script asset for the block.
	 */
	function test_gutenberg_add_block_theme_script() {
		$expected = array(
			'theme' => array(
				'scripts' => array(
					array(
						'handle' => 'my-handle',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => false,
						'in_footer'  => false,
					),
				),
			),
		);
		gutenberg_add_block_theme_script( 'core/text', 'my-handle', 'https://wordpress.org/is-the-best' );

		global $wp_registered_blocks;

		$this->assertEquals( $expected, $wp_registered_blocks['core/text']['assets'] );
	}

	/**
	 * Should merge asset data into array.
	 */
	function test_merging_to_empty_assets() {
		$current_assets = array();
		$assets = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$result = gutenberg_merge_assets( $current_assets, $assets );
		$expected = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'core/does-not-exist',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$this->assertEquals( $expected, $result );
	}

	/**
	 * Should merge asset data into existing data, creating multiple styles to be enqueued.
	 */
	function test_merging_to_existing_assets() {
		$current_assets = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 1',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$assets = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 2',
						'src'    => 'https://wordpress.org/is-wonderful',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$result = gutenberg_merge_assets( $current_assets, $assets );
		$expected = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 1',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
					array(
						'handle' => 'style 2',
						'src'    => 'https://wordpress.org/is-wonderful',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$this->assertEquals( $expected, $result );
	}

	/**
	 * Should merge scripts and style assets to match the expected output.
	 */
	function test_merging_new_scripts_and_styles() {
		$current_assets = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 1',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$assets = array(
			'theme' => array(
				'scripts' => array(
					array(
						'handle' => 'script 1',
						'src'    => 'https://wordpress.org/is-neat',
						'deps'   => array(),
						'ver'    => null,
						'in_footer'  => null,
					),
				),
				'styles' => array(
					array(
						'handle' => 'style 2',
						'src'    => 'https://wordpress.org/is-wonderful',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$result = gutenberg_merge_assets( $current_assets, $assets );
		$expected = array(
			'theme' => array(
				'scripts' => array(
					array(
						'handle' => 'script 1',
						'src'    => 'https://wordpress.org/is-neat',
						'deps'   => array(),
						'ver'    => null,
						'in_footer'  => null,
					),
				),
				'styles' => array(
					array(
						'handle' => 'style 1',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
					array(
						'handle' => 'style 2',
						'src'    => 'https://wordpress.org/is-wonderful',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$this->assertEquals( $expected, $result );
	}

	/**
	 * Should merge scripts and style assets across multiple calls to match the expected output.
	 */
	function test_merging_across_multiple_calls() {
		$current_assets = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 1',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$assets_1 = array(
			'theme' => array(
				'scripts' => array(
					array(
						'handle' => 'script 1',
						'src'    => 'https://wordpress.org/is-neat',
						'deps'   => array(),
						'ver'    => null,
						'in_footer'  => null,
					),
				),
				'styles' => array(
					array(
						'handle' => 'style 2',
						'src'    => 'https://wordpress.org/is-wonderful',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);
		$assets_2 = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 3',
						'src'    => 'https://wordpress.org/is-goofy',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
			'editor' => array(
				'styles' => array(
					array(
						'handle' => 'style 4',
						'src'    => 'https://wordpress.org/is-free',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$first_merge = gutenberg_merge_assets( $current_assets, $assets_1 );
		$result = gutenberg_merge_assets( $first_merge, $assets_2 );
		$expected = array(
			'theme' => array(
				'styles' => array(
					array(
						'handle' => 'style 1',
						'src'    => 'https://wordpress.org/is-the-best',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
					array(
						'handle' => 'style 2',
						'src'    => 'https://wordpress.org/is-wonderful',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
					array(
						'handle' => 'style 3',
						'src'    => 'https://wordpress.org/is-goofy',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
				'scripts' => array(
					array(
						'handle' => 'script 1',
						'src'    => 'https://wordpress.org/is-neat',
						'deps'   => array(),
						'ver'    => null,
						'in_footer'  => null,
					),
				),
			),
			'editor' => array(
				'styles' => array(
					array(
						'handle' => 'style 4',
						'src'    => 'https://wordpress.org/is-free',
						'deps'   => array(),
						'ver'    => null,
						'media'  => null,
					),
				),
			),
		);

		$this->assertEquals( $expected, $result );
	}
}
