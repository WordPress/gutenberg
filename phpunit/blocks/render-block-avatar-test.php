<?php
/**
 * Avatar block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Avatar block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_avatar
 */
class Render_Block_Avatar_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_id = $factory->user->create( array( 'display_name' => 'Avatar Author' ) );
	}

	/**
	 * Renders an Avatar block and returns the image's class and style attributes.
	 *
	 * @param array $style Style attribute.
	 * @return array Class and style of the image.
	 */
	private function render_image_attributes( $style ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/avatar',
				'attrs'     => array(
					'userId' => self::$user_id,
					'style'  => $style,
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $block->render() );
		$this->assertTrue( $processor->next_tag( 'img' ) );

		return array(
			'class' => $processor->get_attribute( 'class' ),
			'style' => $processor->get_attribute( 'style' ),
		);
	}

	public function test_shadow_follows_border_on_the_image() {
		$actual = $this->render_image_attributes(
			array(
				'border' => array(
					'radius' => '10px',
					'color'  => '#ff0000',
				),
				'shadow' => '1px 1px 1px #000',
			)
		);

		$this->assertSame( 'avatar avatar-96 photo wp-block-avatar__image has-border-color', $actual['class'] );
		$this->assertSame( 'border-color:#ff0000;border-radius:10px;box-shadow:1px 1px 1px #000;', $actual['style'] );
	}

	public function test_image_border_and_shadow_styles() {
		$attributes = array(
			'userId'      => self::$user_id,
			'borderColor' => 'accent-2',
			'style'       => array(
				'border' => array(
					'radius' => 5,
					'top'    => array(
						'style' => 'dashed',
						'width' => '3px',
					),
				),
				'shadow' => '10px 10px 5px #000000',
			),
		);

		$processor = new WP_HTML_Tag_Processor( do_blocks( '<!-- wp:avatar ' . wp_json_encode( $attributes ) . ' /-->' ) );
		$this->assertTrue( $processor->next_tag( 'img' ) );
		$this->assertSame(
			array(
				'class' => 'avatar avatar-96 photo wp-block-avatar__image has-border-color has-accent-2-border-color',
				'style' => 'border-radius:5px;border-top-width:3px;border-top-style:dashed;box-shadow:10px 10px 5px #000000;',
			),
			array(
				'class' => $processor->get_attribute( 'class' ),
				'style' => $processor->get_attribute( 'style' ),
			)
		);
	}

	public function test_viewport_state_renders_state_class_and_responsive_styles() {
		$attributes = array(
			'userId' => self::$user_id,
			'size'   => 96,
			'style'  => array(
				'@mobile' => array(
					'dimensions' => array(
						'width'  => '48px',
						'height' => '48px',
					),
				),
			),
		);

		$rendered  = do_blocks( '<!-- wp:avatar ' . wp_json_encode( $attributes ) . ' /-->' );
		$processor = new WP_HTML_Tag_Processor( $rendered );
		$this->assertTrue( $processor->next_tag( 'div' ) );

		$class_attribute = $processor->get_attribute( 'class' );
		$this->assertMatchesRegularExpression( '/\bwp-states-[a-f0-9]{8}\b/', $class_attribute );

		$stylesheet = wp_style_engine_get_stylesheet_from_context( 'block-supports' );
		$this->assertStringContainsString( 'width:48px !important;', $stylesheet );
		$this->assertStringContainsString( 'height:48px !important;', $stylesheet );
	}
}
