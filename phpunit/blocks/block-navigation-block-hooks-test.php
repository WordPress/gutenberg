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
		self::$original_markup = '<!-- wp:navigation-link {"label":"News & About","type":"page","id":2,"url":"http://localhost:8888/?page_id=2","kind":"post-type"} /-->';

		self::$navigation_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'wp_navigation',
				'post_title'   => 'Navigation Menu',
				'post_content' => self::$original_markup,
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
	public function test_block_core_navigation_update_ignore_hooked_blocks_meta() {
		register_block_type(
			'tests/my-block',
			array(
				'block_hooks' => array(
					'core/navigation' => 'last_child',
				),
			)
		);

		$post = get_post( self::$navigation_post );

		gutenberg_block_core_navigation_update_ignore_hooked_blocks_meta( $post );

		// We expect the '&' character to be replaced with its unicode representation.
		$expected_markup = str_replace( '&', '\u0026amp;', self::$original_markup );

		$this->assertSame( $expected_markup, $post->post_content );
		$this->assertSame( $expected_markup, get_the_content( null, false, self::$navigation_post->ID ) );
		$this->assertSame(
			array( 'tests/my-block' ),
			json_decode( get_post_meta( self::$navigation_post->ID, '_wp_ignored_hooked_blocks', true ), true )
		);
	}
}
