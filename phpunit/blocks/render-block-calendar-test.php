<?php
/**
 * Calendar block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Calendar block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Calendar extends WP_UnitTestCase {

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		$factory->post->create( array( 'post_status' => 'publish' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_calendar
	 *
	 * @dataProvider data_color_classes_and_styles
	 *
	 * @param array       $attributes     Block attributes.
	 * @param string      $expected_class Expected table class attribute.
	 * @param string|null $expected_style Expected table style attribute.
	 */
	public function test_applies_color_classes_and_styles_to_table( $attributes, $expected_class, $expected_style ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/calendar',
				'attrs'     => $attributes,
			)
		);

		$processor = new WP_HTML_Tag_Processor( $block->render() );

		$this->assertTrue( $processor->next_tag( 'table' ) );
		$this->assertSame( $expected_class, $processor->get_attribute( 'class' ) );
		$this->assertSame( $expected_style, $processor->get_attribute( 'style' ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_color_classes_and_styles() {
		return array(
			'no color'                => array(
				'attributes'     => array(),
				'expected_class' => 'wp-calendar-table',
				'expected_style' => null,
			),
			'preset colors'           => array(
				'attributes'     => array(
					'textColor'       => 'contrast',
					'backgroundColor' => 'base',
				),
				'expected_class' => 'wp-calendar-table has-text-color has-contrast-color has-background has-base-background-color',
				'expected_style' => null,
			),
			'custom colors'           => array(
				'attributes'     => array(
					'style' => array(
						'color' => array(
							'text'       => '#123456',
							'background' => '#abcdef',
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-text-color has-background',
				'expected_style' => 'color:#123456;background-color:#abcdef;',
			),
			'preset wins over custom' => array(
				'attributes'     => array(
					'textColor' => 'contrast',
					'style'     => array(
						'color' => array(
							'text'       => '#123456',
							'background' => '#abcdef',
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-text-color has-contrast-color has-background',
				'expected_style' => 'background-color:#abcdef;',
			),
			'link color'              => array(
				'attributes'     => array(
					'textColor' => 'contrast',
					'style'     => array(
						'elements' => array(
							'link' => array(
								'color' => array(
									'text' => '#ff0000',
								),
							),
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-text-color has-contrast-color has-link-color',
				'expected_style' => null,
			),
			'gradient is not applied' => array(
				'attributes'     => array(
					'gradient' => 'vivid-cyan-blue-to-vivid-purple',
					'style'    => array(
						'color' => array(
							'gradient' => 'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
						),
					),
				),
				'expected_class' => 'wp-calendar-table',
				'expected_style' => null,
			),
		);
	}
}
