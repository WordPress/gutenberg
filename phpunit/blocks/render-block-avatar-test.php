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

	/**
	 * Renders an Avatar block and returns the image's class and style.
	 *
	 * @param array $attributes Block attributes.
	 * @return array Image class and style attributes.
	 */
	private function render_image_attributes( $attributes ) {
		$attributes['userId'] = self::$user_id;
		$processor            = new WP_HTML_Tag_Processor( do_blocks( '<!-- wp:avatar ' . wp_json_encode( $attributes ) . ' /-->' ) );
		$this->assertTrue( $processor->next_tag( 'img' ) );

		return array(
			'class' => $processor->get_attribute( 'class' ),
			'style' => $processor->get_attribute( 'style' ),
		);
	}

	/**
	 * @dataProvider data_border_styles
	 *
	 * @param array       $attributes     Block attributes.
	 * @param string      $expected_class Expected image class.
	 * @param string|null $expected_style Expected image style.
	 */
	public function test_image_border_styles( $attributes, $expected_class, $expected_style ) {
		$this->assertSame(
			array(
				'class' => $expected_class,
				'style' => $expected_style,
			),
			$this->render_image_attributes( $attributes )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_border_styles() {
		return array(
			'custom'   => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'radius' => '10px',
							'width'  => '2px',
							'style'  => 'solid',
							'color'  => '#ff0000',
						),
					),
				),
				'expected_class' => 'avatar avatar-96 photo wp-block-avatar__image has-border-color',
				'expected_style' => 'border-color:#ff0000;border-radius:10px;border-style:solid;border-width:2px;',
			),
			'preset'   => array(
				'attributes'     => array(
					'borderColor' => 'accent-2',
					'style'       => array(
						'border' => array(
							'width' => '1px',
							'style' => 'solid',
						),
					),
				),
				'expected_class' => 'avatar avatar-96 photo wp-block-avatar__image has-border-color has-accent-2-border-color',
				'expected_style' => 'border-style:solid;border-width:1px;',
			),
			'per side' => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'top'  => array(
								'color' => '#00ff00',
								'style' => 'dashed',
								'width' => '3px',
							),
							'left' => array(
								'width' => '1px',
							),
						),
					),
				),
				'expected_class' => 'avatar avatar-96 photo wp-block-avatar__image',
				'expected_style' => 'border-top-width:3px;border-top-color:#00ff00;border-top-style:dashed;border-left-width:1px;',
			),
			'numeric'  => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'radius' => 5,
							'width'  => 2,
						),
					),
				),
				'expected_class' => 'avatar avatar-96 photo wp-block-avatar__image',
				'expected_style' => 'border-radius:5px;border-width:2px;',
			),
			'zero'     => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'radius' => 0,
							'width'  => 0,
							'style'  => 'solid',
						),
					),
				),
				'expected_class' => 'avatar avatar-96 photo wp-block-avatar__image',
				'expected_style' => 'border-radius:0px;border-style:solid;border-width:0px;',
			),
		);
	}

	public function test_image_shadow_follows_border() {
		$attributes = array(
			'style' => array(
				'border' => array(
					'radius' => '10px',
					'color'  => '#ff0000',
				),
				'shadow' => '10px 10px 5px #000000',
			),
		);

		$this->assertSame(
			array(
				'class' => 'avatar avatar-96 photo wp-block-avatar__image has-border-color',
				'style' => 'border-color:#ff0000;border-radius:10px;box-shadow:10px 10px 5px #000000;',
			),
			$this->render_image_attributes( $attributes )
		);
	}
}
