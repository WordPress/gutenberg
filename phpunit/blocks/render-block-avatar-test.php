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
class Tests_Blocks_Render_Avatar extends WP_UnitTestCase {

	/**
	 * Author whose avatar is rendered.
	 *
	 * @var int
	 */
	private static $user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_id = $factory->user->create( array( 'display_name' => 'Avatar Author' ) );
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
}
