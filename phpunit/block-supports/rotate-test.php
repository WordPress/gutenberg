<?php
/**
 * Tests the rotate block support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Rotate_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		parent::tear_down();
	}

	/**
	 * Registers a block for the tests.
	 *
	 * @param array $supports   Block supports.
	 * @param array $attributes Block attributes.
	 * @return WP_Block_Type The registered block type.
	 */
	private function register_test_block( $supports = array(), $attributes = array() ) {
		$this->test_block_name = 'test/rotate-block';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => $attributes,
				'supports'    => $supports,
			)
		);

		return WP_Block_Type_Registry::get_instance()->get_registered( $this->test_block_name );
	}

	/**
	 * Renders the test block with a style attribute.
	 *
	 * @param array  $style         Block style attribute.
	 * @param string $block_content Rendered block content.
	 * @return string Filtered block content.
	 */
	private function render_test_block( $style, $block_content = '<div class="wp-block-test-rotate-block">Content</div>' ) {
		return gutenberg_render_rotate_support(
			$block_content,
			array(
				'blockName' => 'test/rotate-block',
				'attrs'     => array( 'style' => $style ),
			)
		);
	}

	/**
	 * Returns the class the rotate support added to rendered block content.
	 *
	 * @param string $block_content Rendered block content.
	 * @return string|null The class, or null when there is none.
	 */
	private function get_rotate_class( $block_content ) {
		return preg_match( '/wp-rotate-[a-f0-9]+/', $block_content, $matches ) ? $matches[0] : null;
	}

	/**
	 * Returns the block supports stylesheet.
	 *
	 * @return string The stylesheet.
	 */
	private function get_block_supports_stylesheet() {
		return gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );
	}

	/**
	 * Tests that every block supports rotation unless it opts out.
	 *
	 * @covers ::gutenberg_register_rotate_support
	 */
	public function test_registers_style_attribute_unless_block_opts_out() {
		$block_type = $this->register_test_block();
		gutenberg_register_rotate_support( $block_type );
		$this->assertSame( array( 'type' => 'object' ), $block_type->attributes['style'] ?? null, 'A block supports rotation by default.' );
		unregister_block_type( $this->test_block_name );

		$block_type = $this->register_test_block( array( 'rotate' => false ) );
		gutenberg_register_rotate_support( $block_type );
		$this->assertArrayNotHasKey( 'style', $block_type->attributes, 'A block that opts out of rotation does not get a style attribute from it.' );
	}

	/**
	 * Tests that a block's own style attribute definition is kept.
	 *
	 * @covers ::gutenberg_register_rotate_support
	 */
	public function test_keeps_existing_style_attribute() {
		$style_attribute = array(
			'type'    => 'object',
			'default' => array( 'color' => array( 'text' => 'red' ) ),
		);
		$block_type      = $this->register_test_block( array(), array( 'style' => $style_attribute ) );
		gutenberg_register_rotate_support( $block_type );

		$this->assertSame( $style_attribute, $block_type->attributes['style'] );
	}

	/**
	 * Tests that stored rotations are read as angles in (-180, 180].
	 *
	 * @covers ::gutenberg_get_rotate_value
	 *
	 * @dataProvider data_get_rotate_value
	 *
	 * @param mixed      $value    Stored rotation.
	 * @param float|null $expected Expected rotation.
	 */
	public function test_get_rotate_value( $value, $expected ) {
		$this->assertSame( $expected, gutenberg_get_rotate_value( $value ) );
	}

	/**
	 * Data provider for test_get_rotate_value().
	 *
	 * @return array[]
	 */
	public function data_get_rotate_value() {
		return array(
			'integer'                              => array( 15, 15.0 ),
			'negative float'                       => array( -12.5, -12.5 ),
			'numeric string'                       => array( '30', 30.0 ),
			'zero'                                 => array( 0, 0.0 ),
			'half turn'                            => array( 180, 180.0 ),
			'minus half turn'                      => array( -180, 180.0 ),
			'more than a half turn'                => array( 270, -90.0 ),
			'more than a turn'                     => array( 405, 45.0 ),
			'whole negative turn'                  => array( -360, 0.0 ),
			'rounded to two decimals'              => array( 12.3456, 12.35 ),
			'negative half rounded away from zero' => array( -12.345, -12.35 ),
			'half rounded away from zero'          => array( 1.005, 1.01 ),
			'numeric string with spaces'           => array( ' 15 ', 15.0 ),
			'numeric string with exponent'         => array( '1e2', 100.0 ),
			'hexadecimal string'                   => array( '0x10', null ),
			'binary string'                        => array( '0b11', null ),
			'rounded onto a half turn'             => array( -179.999, 180.0 ),
			'string with a unit'                   => array( '15deg', null ),
			'string with a css injection'          => array( '15deg; color: red', null ),
			'empty string'                         => array( '', null ),
			'null'                                 => array( null, null ),
			'boolean'                              => array( true, null ),
			'array'                                => array( array( 15 ), null ),
			'infinite'                             => array( INF, null ),
			'not a number'                         => array( NAN, null ),
		);
	}

	/**
	 * Tests that a rotated block gets a class with a rotate rule.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_renders_default_rotation() {
		$this->register_test_block();

		$actual     = $this->render_test_block( array( 'rotate' => 15 ) );
		$class_name = $this->get_rotate_class( $actual );

		$this->assertNotNull( $class_name, 'The block should get a rotate class.' );
		$this->assertSame(
			'<div class="wp-block-test-rotate-block ' . $class_name . '">Content</div>',
			$actual
		);
		$this->assertSame( ".$class_name{rotate:15deg;}", $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that the rotation is wrapped and rounded before it is output.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_renders_normalized_rotation() {
		$this->register_test_block();

		$class_name = $this->get_rotate_class( $this->render_test_block( array( 'rotate' => '-270.004' ) ) );

		$this->assertSame( ".$class_name{rotate:90deg;}", $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that blocks without a rotation are left alone.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 *
	 * @dataProvider data_does_not_render_without_rotation
	 *
	 * @param array $style Block style attribute.
	 */
	public function test_does_not_render_without_rotation( $style ) {
		$this->register_test_block();
		$block_content = '<div class="wp-block-test-rotate-block">Content</div>';

		$this->assertSame( $block_content, $this->render_test_block( $style, $block_content ) );
		$this->assertSame( '', $this->get_block_supports_stylesheet() );
	}

	/**
	 * Data provider for test_does_not_render_without_rotation().
	 *
	 * @return array[]
	 */
	public function data_does_not_render_without_rotation() {
		return array(
			'no rotation'                            => array( array( 'color' => array( 'text' => 'red' ) ) ),
			'zero rotation'                          => array( array( 'rotate' => 0 ) ),
			'rotation that is not a number'          => array( array( 'rotate' => '15deg; color: red' ) ),
			'viewport rotation that is not a number' => array( array( '@mobile' => array( 'rotate' => 'none' ) ) ),
			'malformed viewport style'               => array( array( '@mobile' => 'rotate' ) ),
		);
	}

	/**
	 * Tests that viewport overrides are output in media queries after the default rotation,
	 * and that 0 undoes the default rotation.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_renders_viewport_overrides() {
		$this->register_test_block();

		$class_name = $this->get_rotate_class(
			$this->render_test_block(
				array(
					'rotate'  => 15,
					'@mobile' => array( 'rotate' => 0 ),
					'@tablet' => array( 'rotate' => -20 ),
				)
			)
		);

		$this->assertNotNull( $class_name, 'The block should get a rotate class.' );
		$this->assertSame(
			".$class_name{rotate:15deg;}" .
			"@media (width <= 480px){.$class_name{rotate:none;}}" .
			"@media (480px < width <= 782px){.$class_name{rotate:-20deg;}}",
			$this->get_block_supports_stylesheet()
		);
	}

	/**
	 * Tests that a block can be rotated on a viewport only.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_renders_viewport_rotation_without_default_rotation() {
		$this->register_test_block();

		$class_name = $this->get_rotate_class(
			$this->render_test_block(
				array(
					'@mobile' => array( 'rotate' => 45 ),
				)
			)
		);

		$this->assertNotNull( $class_name, 'The block should get a rotate class.' );
		$this->assertSame(
			"@media (width <= 480px){.$class_name{rotate:45deg;}}",
			$this->get_block_supports_stylesheet()
		);
	}

	/**
	 * Tests that blocks with the same rotation share a class and a rule.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_blocks_with_the_same_rotation_share_a_class() {
		$this->register_test_block();

		$first  = $this->get_rotate_class( $this->render_test_block( array( 'rotate' => 15 ) ) );
		$second = $this->get_rotate_class( $this->render_test_block( array( 'rotate' => 15 ) ) );
		$third  = $this->get_rotate_class( $this->render_test_block( array( 'rotate' => 30 ) ) );

		$this->assertSame( $first, $second, 'Blocks with the same rotation should share a class.' );
		$this->assertNotSame( $first, $third, 'Blocks with different rotations should have different classes.' );
		$this->assertSame( ".$first{rotate:15deg;}.$third{rotate:30deg;}", $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that a block whose own style attribute is not an object is not rotated.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_does_not_render_when_style_attribute_is_not_an_object() {
		$this->register_test_block( array(), array( 'style' => array( 'type' => 'string' ) ) );
		$block_content = '<div class="wp-block-test-rotate-block">Content</div>';

		$this->assertSame( $block_content, $this->render_test_block( array( 'rotate' => 15 ), $block_content ) );
		$this->assertSame( '', $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that viewport overrides use the theme's viewport breakpoints.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_renders_viewport_overrides_with_theme_breakpoints() {
		$this->register_test_block();

		$filter = static function ( $theme_json ) {
			return $theme_json->update_with(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array(
						'viewport' => array(
							'mobile' => '640px',
							'tablet' => '960px',
						),
					),
				)
			);
		};

		add_filter( 'wp_theme_json_data_theme', $filter );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();

		try {
			$class_name = $this->get_rotate_class(
				$this->render_test_block(
					array(
						'@mobile' => array( 'rotate' => 10 ),
						'@tablet' => array( 'rotate' => 0 ),
					)
				)
			);

			$this->assertSame(
				"@media (width <= 640px){.$class_name{rotate:10deg;}}" .
				"@media (640px < width <= 960px){.$class_name{rotate:none;}}",
				$this->get_block_supports_stylesheet()
			);
		} finally {
			remove_filter( 'wp_theme_json_data_theme', $filter );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
	}

	/**
	 * Tests that blocks that opt out of rotation are not rotated.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_does_not_render_when_block_opts_out() {
		$this->register_test_block( array( 'rotate' => false ) );
		$block_content = '<div class="wp-block-test-rotate-block">Content</div>';

		$this->assertSame( $block_content, $this->render_test_block( array( 'rotate' => 15 ), $block_content ) );
		$this->assertSame( '', $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that block content without a tag to rotate is left alone.
	 *
	 * @covers ::gutenberg_render_rotate_support
	 */
	public function test_does_not_render_without_a_tag() {
		$this->register_test_block();

		$this->assertSame( 'Plain text', $this->render_test_block( array( 'rotate' => 15 ), 'Plain text' ) );
		$this->assertSame( '', $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that the rotate property is allowed in inline styles.
	 *
	 * @covers ::gutenberg_add_rotate_to_safe_style_css
	 */
	public function test_rotate_is_a_safe_css_property() {
		$this->assertSame( 'rotate: 15deg', safecss_filter_attr( 'rotate: 15deg' ) );
		$this->assertSame( 'rotate: none', safecss_filter_attr( 'rotate: none' ) );
	}
}
