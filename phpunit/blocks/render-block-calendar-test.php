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
			'custom border values'    => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'width' => '3px',
							'color' => '#111111',
							'style' => 'dashed',
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-border-color',
				'expected_style' => 'border-color:#111111;border-style:dashed;border-width:3px;',
			),
			'borderColor preset'      => array(
				'attributes'     => array(
					'borderColor' => 'contrast',
					'style'       => array(
						'border' => array(
							'width' => '2px',
							'style' => 'solid',
						),
					),
				),
				'expected_class' => 'wp-calendar-table has-border-color has-contrast-border-color',
				'expected_style' => 'border-style:solid;border-width:2px;',
			),
			'uniform per-side border' => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'top'    => array(
								'width' => '2px',
								'color' => '#111111',
								'style' => 'solid',
							),
							'right'  => array(
								'width' => '2px',
								'color' => '#111111',
								'style' => 'solid',
							),
							'bottom' => array(
								'width' => '2px',
								'color' => '#111111',
								'style' => 'solid',
							),
							'left'   => array(
								'width' => '2px',
								'color' => '#111111',
								'style' => 'solid',
							),
						),
					),
				),
				// Per-side colours do not add has-border-color; only flat borderColor / border.color do.
				'expected_class' => 'wp-calendar-table',
				'expected_style' => 'border-top-color:#111111;border-top-style:solid;border-top-width:2px;border-right-color:#111111;border-right-style:solid;border-right-width:2px;border-bottom-color:#111111;border-bottom-style:solid;border-bottom-width:2px;border-left-color:#111111;border-left-style:solid;border-left-width:2px;',
			),
			'single-side border'      => array(
				'attributes'     => array(
					'style' => array(
						'border' => array(
							'top' => array(
								'width' => '2px',
								'color' => '#111111',
								'style' => 'solid',
							),
						),
					),
				),
				'expected_class' => 'wp-calendar-table',
				'expected_style' => 'border-top-color:#111111;border-top-style:solid;border-top-width:2px;',
			),
		);
	}

	/**
	 * Borders and colors are applied on the table; cells stay free of inline styles
	 * and support classes. Empty pad cells from get_calendar() may still have class="pad".
	 *
	 * @covers ::gutenberg_render_block_core_calendar
	 */
	public function test_render_does_not_apply_inline_styles_to_cells() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/calendar',
				'attrs'     => array(
					'style' => array(
						'border' => array(
							'width' => '3px',
							'color' => '#111111',
							'style' => 'dashed',
						),
						'color'  => array(
							'text'       => '#123456',
							'background' => '#abcdef',
						),
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $block->render() );
		while ( $processor->next_tag() ) {
			$tag = $processor->get_tag();
			if ( 'TH' === $tag || 'TD' === $tag ) {
				$this->assertNull( $processor->get_attribute( 'style' ) );
				$class = $processor->get_attribute( 'class' );
				if ( null !== $class ) {
					$this->assertSame( 'pad', $class );
				}
			}
		}
	}
}
