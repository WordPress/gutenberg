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

	public function test_shadow_is_applied_to_the_image() {
		$actual = $this->render_image_attributes( array( 'shadow' => 'var:preset|shadow|natural' ) );

		$this->assertSame( 'box-shadow:var(--wp--preset--shadow--natural);', $actual['style'] );
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
}
