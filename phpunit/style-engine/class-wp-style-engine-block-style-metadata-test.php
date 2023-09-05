<?php
/**
 * Tests the Style Engine Block Style Metadata class.
 *
 * @package    Gutenberg
 * @subpackage style-engine
 */

/**
 * Tests fetching, extending and otherwise manipulation block supports style definitions.
 *
 * @coversDefaultClass WP_Style_Engine_Block_Style_Metadata_Gutenberg
 */
class WP_Style_Engine_Block_Style_Metadata_Test extends WP_UnitTestCase {
	/**
	 * Tests getting metadata.
	 *
	 * @covers ::get_metadata
	 */
	public function test_should_get_metadata() {
		$block_style_metadata = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );

		$full_metadata = $block_style_metadata->get_metadata();
		$this->assertEquals( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA, $full_metadata, 'Returning all default definitions' );

		$color_metadata = $block_style_metadata->get_metadata( array( 'color' ) );
		$this->assertEquals( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA['color'], $color_metadata, 'Returning top-level color definition' );

		$color_metadata = $block_style_metadata->get_metadata( array( 'color', 'background' ) );
		$this->assertEquals( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA['color']['background'], $color_metadata, 'Returning second-level color > background definition' );

		$null_metadata = $block_style_metadata->get_metadata( array( 'something', 'background' ) );
		$this->assertNull( $null_metadata, 'Returning `null` where the path is invalid' );
	}

	/**
	 * Tests adding metadata to the block styles definition.
	 *
	 * @covers ::add_metadata
	 */
	public function test_should_add_new_top_level_metadata() {
		$block_style_metadata = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata         = array(
			'layout' => array(
				'float' => array(
					'property_keys' => array(
						'default' => 'float',
					),
					'path'          => array( 'layout', 'float' ),
					'css_vars'      => array(
						'layout' => '--wp--preset--float--$slug',
					),
					'classnames'    => array(
						'has-float-layout' => true,
						'has-$slug-float'  => 'layout',
					),
				),
				'width' => array(
					'property_keys' => array(
						'default'    => 'width',
						'individual' => '%s-width',
					),
					'path'          => array( 'layout', 'width' ),
					'classnames'    => array(
						'has-$slug-width' => 'layout',
					),
				),
			),
		);
		$this->assertEquals(
			$new_metadata['layout'],
			$block_style_metadata->add_metadata( $new_metadata )->get_metadata( array( 'layout' ) ),
			'A new style definition for `layout` should be registered'
		);
	}

	/**
	 * Tests adding new second-level property metadata to the block styles definition and ignore `value_func` values.
	 *
	 * @covers ::add_metadata
	 */
	public function test_should_add_new_style_property_metadata_keys() {
		$block_style_metadata = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata         = array(
			'typography' => array(
				'textIndent' => array(
					'property_keys' => array(
						'default' => 'text-indent',
					),
					'css_vars'      => array(
						'spacing' => '--wp--preset--spacing--$slug',
					),
					'path'          => array( 'typography', 'textIndent' ),
					'classnames'    => array(
						'has-text-indent' => true,
					),
					'value_func'    => 'Test::function',
				),
			),
		);
		$block_style_metadata->add_metadata( $new_metadata );

		// Remove ignored property keys.
		unset( $new_metadata['typography']['textIndent']['value_func'] );

		$this->assertEquals(
			$new_metadata['typography']['textIndent'],
			$block_style_metadata->get_metadata( array( 'typography', 'textIndent' ) ),
			'The new style property should match expected.'
		);
	}

	/**
	 * Tests that merging style metadata to the block styles definitions does not work.
	 *
	 * @covers ::add_metadata
	 */
	public function test_should_not_overwrite_style_property_metadata() {
		$block_style_metadata = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata         = array(
			'spacing' => array(
				'padding' => array(
					'property_keys' => array(
						'default' => 'columns',
					),
					'css_vars'      => array(
						'spacing' => '--wp--preset--column--$slug',
					),
				),
			),
		);

		$block_style_metadata->add_metadata( $new_metadata );
		$this->assertEquals(
			WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA['spacing']['padding'],
			$block_style_metadata->get_metadata( array( 'spacing', 'padding' ) ),
			'The newly-merged property metadata should be present'
		);
	}

	/**
	 * Tests resetting metadata to the original block styles definition.
	 *
	 * @covers ::reset_metadata
	 */
	public function test_should_reset_metadata() {
		$block_style_metadata = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata         = array(
			'spacing' => array(
				'gap' => array(
					'property_keys' => array(
						'default'    => 'gap',
						'individual' => 'gap-%',
					),
					'path'          => array( 'spacing', 'gap' ),
					'css_vars'      => array(
						'spacing' => '--wp--preset--spacing--$slug',
					),
				),
			),
		);

		$this->assertEquals(
			$new_metadata['spacing']['gap'],
			$block_style_metadata->add_metadata( $new_metadata )->get_metadata( array( 'spacing', 'gap' ) ),
			'Should successfully merge metadata'
		);

		$block_style_metadata->reset_metadata();
		$this->assertEquals(
			WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA['spacing'],
			$block_style_metadata->get_metadata( array( 'spacing' ) ),
			'Should be equal to original'
		);
	}
}
