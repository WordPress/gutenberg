<?php
/**
 * WP_Block_Type Tests
 *
 * @package Gutenberg
 */

/**
 * Tests for WP_Block_Type
 */
class Block_Type_Test extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
	}

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_user_id;

	/**
	 * ID for a post containing blocks.
	 *
	 * @var int
	 */
	protected static $post_with_blocks;

	/**
	 * ID for a post without blocks.
	 *
	 * @var int
	 */
	protected static $post_without_blocks;

	/**
	 * Set up before class.
	 */
	public static function wpSetUpBeforeClass() {
		self::$editor_user_id = self::factory()->user->create(
			array(
				'role' => 'editor',
			)
		);

		self::$post_with_blocks = self::factory()->post->create(
			array(
				'post_title'   => 'Example',
				'post_content' => "<!-- wp:core/text {\"dropCap\":true} -->\n<p class=\"has-drop-cap\">Tester</p>\n<!-- /wp:core/text -->",
			)
		);

		self::$post_without_blocks = self::factory()->post->create(
			array(
				'post_title'   => 'Example',
				'post_content' => 'Tester',
			)
		);
	}

	function test_set_props() {
		$name = 'core/dummy';
		$args = array(
			'render_callback' => array( $this, 'render_dummy_block' ),
			'foo'             => 'bar',
		);

		$block_type = new WP_Block_Type( $name, $args );

		$this->assertSame( $name, $block_type->name );
		$this->assertSame( $args['render_callback'], $block_type->render_callback );
		$this->assertSame( $args['foo'], $block_type->foo );
	}

	function test_render() {
		$attributes = array(
			'foo' => 'bar',
			'bar' => 'foo',
		);

		$block_type = new WP_Block_Type(
			'core/dummy',
			array(
				'render_callback' => array( $this, 'render_dummy_block' ),
			)
		);
		$output     = $block_type->render( $attributes );
		$this->assertEquals( $attributes, json_decode( $output, true ) );
	}

	function test_render_with_content() {
		$attributes = array(
			'foo' => 'bar',
			'bar' => 'foo',
		);

		$content = 'baz';

		$expected = array_merge( $attributes, array( '_content' => $content ) );

		$block_type = new WP_Block_Type(
			'core/dummy',
			array(
				'render_callback' => array( $this, 'render_dummy_block_with_content' ),
			)
		);
		$output     = $block_type->render( $attributes, $content );
		$this->assertEquals( $expected, json_decode( $output, true ) );
	}

	function test_render_for_static_block() {
		$block_type = new WP_Block_Type( 'core/dummy', array() );
		$output     = $block_type->render();

		$this->assertEquals( '', $output );
	}

	function test_is_dynamic_for_static_block() {
		$block_type = new WP_Block_Type( 'core/dummy', array() );

		$this->assertFalse( $block_type->is_dynamic() );
	}

	function test_is_dynamic_for_dynamic_block() {
		$block_type = new WP_Block_Type(
			'core/dummy',
			array(
				'render_callback' => array( $this, 'render_dummy_block' ),
			)
		);

		$this->assertTrue( $block_type->is_dynamic() );
	}

	function test_prepare_attributes() {
		$attributes = array(
			'correct'            => 'include',
			'wrongType'          => 5,
			'wrongTypeDefaulted' => 5,
			/* missingDefaulted */
			'undefined'          => 'include',
			'intendedNull'       => null,
		);

		$block_type = new WP_Block_Type(
			'core/dummy',
			array(
				'attributes' => array(
					'correct'            => array(
						'type' => 'string',
					),
					'wrongType'          => array(
						'type' => 'string',
					),
					'wrongTypeDefaulted' => array(
						'type'    => 'string',
						'default' => 'defaulted',
					),
					'missingDefaulted'   => array(
						'type'    => 'string',
						'default' => 'define',
					),
					'intendedNull'       => array(
						'type'    => array( 'string', 'null' ),
						'default' => 'wrong',
					),
				),
			)
		);

		$prepared_attributes = $block_type->prepare_attributes_for_render( $attributes );

		$this->assertEquals(
			array(
				'correct'            => 'include',
				/* wrongType */
				'wrongTypeDefaulted' => 'defaulted',
				'missingDefaulted'   => 'define',
				'undefined'          => 'include',
				'intendedNull'       => null,
			),
			$prepared_attributes
		);
	}

	function test_prepare_attributes_none_defined() {
		$attributes = array( 'exists' => 'keep' );

		$block_type = new WP_Block_Type( 'core/dummy', array() );

		$prepared_attributes = $block_type->prepare_attributes_for_render( $attributes );

		$this->assertEquals( $attributes, $prepared_attributes );
	}

	function test_has_block_with_mixed_content() {
		$mixed_post_content = 'before' .
		'<!-- wp:core/dummy --><!-- /wp:core/dummy -->' .
		'<!-- wp:core/dummy_atts {"value":"b1"} --><!-- /wp:core/dummy_atts -->' .
		'<!-- wp:core/dummy-child -->
		<p>testing the test</p>
		<!-- /wp:core/dummy-child -->' .
		'between' .
		'<!-- wp:core/self-close-dummy /-->' .
		'<!-- wp:custom/dummy {"value":"b2"} /-->' .
		'after';

		$this->assertTrue( has_block( 'core/dummy', $mixed_post_content ) );

		$this->assertTrue( has_block( 'core/dummy_atts', $mixed_post_content ) );

		$this->assertTrue( has_block( 'core/dummy-child', $mixed_post_content ) );

		$this->assertTrue( has_block( 'core/self-close-dummy', $mixed_post_content ) );

		$this->assertTrue( has_block( 'custom/dummy', $mixed_post_content ) );

		// checking for a partial block name should fail.
		$this->assertFalse( has_block( 'core/dumm', $mixed_post_content ) );

		// checking for a wrong namespace should fail.
		$this->assertFalse( has_block( 'custom/dummy_atts', $mixed_post_content ) );

		// checking for namespace only should not work. Or maybe ... ?
		$this->assertFalse( has_block( 'core', $mixed_post_content ) );
	}

	function test_has_block_with_invalid_content() {
		// some content with invalid HMTL comments and a single valid block.
		$invalid_content = 'before' .
		'<!- - wp:core/weird-space --><!-- /wp:core/weird-space -->' .
		'<!--wp:core/untrimmed-left --><!-- /wp:core/untrimmed -->' .
		'<!-- wp:core/dummy --><!-- /wp:core/dummy -->' .
		'<!-- wp:core/untrimmed-right--><!-- /wp:core/untrimmed2 -->' .
		'after';

		$this->assertFalse( has_block( 'core/text', self::$post_without_blocks ) );

		$this->assertFalse( has_block( 'core/weird-space', $invalid_content ) );

		$this->assertFalse( has_block( 'core/untrimmed-left', $invalid_content ) );

		$this->assertFalse( has_block( 'core/untrimmed-right', $invalid_content ) );

		$this->assertTrue( has_block( 'core/dummy', $invalid_content ) );
	}

	function test_post_has_block() {
		// should fail for a non-existent block `custom/dummy`.
		$this->assertFalse( has_block( 'custom/dummy', self::$post_with_blocks ) );

		// this functions should not work without the second param until the $post global is set.
		$this->assertFalse( has_block( 'core/text' ) );
		$this->assertFalse( has_block( 'core/dummy' ) );

		global $post;
		$post = get_post( self::$post_with_blocks );

		// check if the function correctly detects content from the $post global.
		$this->assertTrue( has_block( 'core/text' ) );
		// even if it detects a proper $post global it should still be false for a missing block.
		$this->assertFalse( has_block( 'core/dummy' ) );
	}

	function render_dummy_block( $attributes ) {
		return json_encode( $attributes );
	}

	function render_dummy_block_with_content( $attributes, $content ) {
		$attributes['_content'] = $content;

		return json_encode( $attributes );
	}
}
