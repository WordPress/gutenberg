<?php
/**
 * Navigation block block hooks tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation block.
 *
 * @group blocks
 */
class Block_Navigation_Block_Hooks_Test extends WP_UnitTestCase {
	/**
	 * Original markup.
	 *
	 * @var string
	 */
	protected static $original_markup;

	/**
	 * Post object.
	 *
	 * @var object
	 */
	protected static $navigation_post;

	/**
	 * Setup method.
	 */
	public static function wpSetUpBeforeClass() {
		//self::$original_markup = '<!-- wp:navigation-link {"label":"News & About","type":"page","id":2,"url":"http://localhost:8888/?page_id=2","kind":"post-type"} /-->';

		self::$navigation_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Navigation Menu',
				'post_content' => 'Original content',
			)
		);
	}

	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		$registry = WP_Block_Type_Registry::get_instance();

		if ( $registry->is_registered( 'tests/my-block' ) ) {
			$registry->unregister( 'tests/my-block' );
		}

		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta
	 */
	public function test_block_core_navigation_update_ignore_hooked_blocks_meta_preserves_entities() {
		if ( ! function_exists( 'set_ignored_hooked_blocks_metadata' ) ) {
			$this->markTestSkipped( 'Test skipped on WordPress versions that do not included required Block Hooks functionality.' );
		}

		register_block_type(
			'tests/my-block',
			array(
				'block_hooks' => array(
					'core/navigation' => 'last_child',
				),
			)
		);

		$original_markup    = '<!-- wp:navigation-link {"label":"News & About","type":"page","id":2,"url":"http://localhost:8888/?page_id=2","kind":"post-type"} /-->';
		$post               = new stdClass();
		$post->ID           = self::$navigation_post->ID;
		$post->post_content = $original_markup;

		$post = gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta( $post );

		// We expect the '&' character to be replaced with its unicode representation.
		$expected_markup = str_replace( '&', '\u0026', $original_markup );

		$this->assertSame(
			$expected_markup,
			$post->post_content,
			'Post content did not match expected markup with entities escaped.'
		);
		$this->assertSame(
			array( 'tests/my-block' ),
			json_decode( get_post_meta( self::$navigation_post->ID, '_wp_ignored_hooked_blocks', true ), true ),
			'Block was not added to ignored hooked blocks metadata.'
		);
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta
	 */
	public function test_block_core_navigation_dont_modify_no_post_id() {
		if ( ! function_exists( 'set_ignored_hooked_blocks_metadata' ) ) {
			$this->markTestSkipped( 'Test skipped on WordPress versions that do not included required Block Hooks functionality.' );
		}

		register_block_type(
			'tests/my-block',
			array(
				'block_hooks' => array(
					'core/navigation' => 'last_child',
				),
			)
		);

		$original_markup    = '<!-- wp:navigation-link {"label":"News","type":"page","id":2,"url":"http://localhost:8888/?page_id=2","kind":"post-type"} /-->';
		$post               = new stdClass();
		$post->post_content = $original_markup;

		$post = gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta( $post );

		$this->assertSame(
			$original_markup,
			$post->post_content,
			'Post content did not match the original markup.'
		);
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta
	 */
	public function test_block_core_navigation_retains_content_if_not_set() {
		if ( ! function_exists( 'set_ignored_hooked_blocks_metadata' ) ) {
			$this->markTestSkipped( 'Test skipped on WordPress versions that do not included required Block Hooks functionality.' );
		}

		register_block_type(
			'tests/my-block',
			array(
				'block_hooks' => array(
					'core/navigation' => 'last_child',
				),
			)
		);

		$post             = new stdClass();
		$post->ID         = self::$navigation_post->ID;
		$post->post_title = 'Navigation Menu with changes';

		$post = gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta( $post );

		$this->assertSame(
			'Navigation Menu with changes',
			$post->post_title,
			'Post title was changed.'
		);

		$this->assertFalse(
			isset( $post->post_content ),
			'Post content should not be set.'
		);
	}
}
