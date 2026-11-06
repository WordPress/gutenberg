<?php

/**
 * Test the block support utility functions.
 *
 * @package gutenberg
 */

class WP_Block_Supports_Utils_Test extends WP_UnitTestCase {
	/**
	 * @covers ::gutenberg_get_block_supports_classes_and_styles
	 *
	 * @dataProvider data_get_block_supports_classes_and_styles
	 *
	 * @param array<string, mixed>|null $block_attributes Block attributes, or null to check the guard.
	 * @param string[]|null             $supports         Supports to include.
	 * @param array<string, string>     $expected         Expected classes and styles.
	 */
	public function test_get_block_supports_classes_and_styles( $block_attributes, $supports, $expected ) {
		$this->assertSame( $expected, gutenberg_get_block_supports_classes_and_styles( $block_attributes, $supports ) );
	}

	/**
	 * Data provider for {@see self::test_get_block_supports_classes_and_styles()}.
	 *
	 * @return array<string, array{ block_attributes: array<string, mixed>|null, supports: string[]|null, expected: array{ class?: non-empty-string, style?: non-empty-string } }>
	 */
	public function data_get_block_supports_classes_and_styles() {
		$block_attributes = array(
			'backgroundColor' => 'contrast',
			'borderColor'     => 'accent-2',
			'style'           => array(
				'background' => array( 'gradient' => 'linear-gradient(#000,#fff)' ),
				'border'     => array( 'width' => '2px' ),
				'shadow'     => '1px 1px 1px #000',
				'spacing'    => array( 'padding' => array( 'top' => '10px' ) ),
			),
		);

		return array(
			'all supports'         => array(
				'block_attributes' => $block_attributes,
				'supports'         => null,
				'expected'         => array(
					'class' => 'has-background has-contrast-background-color has-border-color has-accent-2-border-color',
					'style' => 'background-image:linear-gradient(#000,#fff);border-width:2px;box-shadow:1px 1px 1px #000;padding-top:10px;',
				),
			),
			'selected supports'    => array(
				'block_attributes' => $block_attributes,
				'supports'         => array( 'shadow', 'border' ),
				'expected'         => array(
					'class' => 'has-border-color has-accent-2-border-color',
					'style' => 'border-width:2px;box-shadow:1px 1px 1px #000;',
				),
			),
			'unknown support'      => array(
				'block_attributes' => $block_attributes,
				'supports'         => array( 'typography' ),
				'expected'         => array(),
			),
			'no supports'          => array(
				'block_attributes' => $block_attributes,
				'supports'         => array(),
				'expected'         => array(),
			),
			'empty attributes'     => array(
				'block_attributes' => array(),
				'supports'         => null,
				'expected'         => array(),
			),
			'non-array attributes' => array(
				'block_attributes' => null,
				'supports'         => null,
				'expected'         => array(),
			),
		);
	}
}
