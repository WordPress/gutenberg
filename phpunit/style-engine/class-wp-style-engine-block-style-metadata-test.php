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

		$block_styles     = array(
			'layout' => array(
				'float' => 'var:preset|layout|left',
				'width' => array(
					'max' => '100px',
					'min' => '20px',
				),
			),
		);
		$expected_styles  = array(
			'css'          => 'float:var(--wp--preset--float--left);max-width:100px;min-width:20px;',
			'declarations' => array(
				'float'     => 'var(--wp--preset--float--left)',
				'max-width' => '100px',
				'min-width' => '20px',
			),
			'classnames'   => 'has-float-layout has-left-float',
		);
		$generated_styles = gutenberg_style_engine_get_styles(
			$block_styles,
			array(
				'metadata' => $new_metadata,
			)
		);

		$this->assertSame(
			$expected_styles,
			$generated_styles,
			'CSS should be generated using the newly-added metadata'
		);
	}

	/**
	 * Tests adding new second-level property metadata to the block styles definition.
	 *
	 * @covers ::add_metadata
	 */
	public function test_should_add_new_style_property_metadata() {
		$block_style_metadata = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata         = array(
			'typography' => array(
				'textIndent' => array(
					'property_keys' => array(
						'default' => 'text-indent',
					),
					'path'          => array( 'typography', 'textIndent' ),
					'classnames'    => array(
						'has-text-indent' => true,
					),
				),
			),
		);
		$block_style_metadata->add_metadata( $new_metadata );
		$this->assertEquals(
			$new_metadata['typography']['textIndent'],
			$block_style_metadata->get_metadata( array( 'typography', 'textIndent' ) ),
			'The new style property should match expected.'
		);

		$block_styles     = array(
			'typography' => array(
				'textIndent' => '1rem',
			),
		);
		$expected_styles  = array(
			'css'          => 'text-indent:1rem;',
			'declarations' => array(
				'text-indent' => '1rem',
			),
			'classnames'   => 'has-text-indent',
		);
		$generated_styles = gutenberg_style_engine_get_styles(
			$block_styles,
			array(
				'metadata' => $new_metadata,
			)
		);

		$this->assertSame(
			$expected_styles,
			$generated_styles,
			'CSS should be generated using the newly-added property metadata'
		);
	}

	/**
	 * Tests merging metadata to the block styles definition.
	 *
	 * @covers ::add_metadata
	 */
	public function test_should_overwrite_style_property_metadata() {
		$block_style_metadata     = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata             = array(
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
		$expected_merged_metadata = array(
			'spacing' => array(
				'padding' => array(
					'property_keys' => array(
						'default'    => 'columns',
						'individual' => 'padding-%s',
					),
					'path'          => array( 'spacing', 'padding' ),
					'css_vars'      => array(
						'spacing' => '--wp--preset--column--$slug',
					),
				),
			),
		);

		$block_style_metadata->add_metadata( $new_metadata );
		$this->assertEquals(
			$expected_merged_metadata['spacing']['padding'],
			$block_style_metadata->get_metadata( array( 'spacing', 'padding' ) ),
			'The newly-merged property metadata should be present'
		);

		$block_styles     = array(
			'spacing' => array(
				'padding' => '1rem',
			),
		);
		$expected_styles  = array(
			'css'          => 'columns:1rem;',
			'declarations' => array(
				'columns' => '1rem',
			),
		);
		$generated_styles = gutenberg_style_engine_get_styles(
			$block_styles,
			array(
				'metadata' => $new_metadata,
			)
		);

		$this->assertSame(
			$expected_styles,
			$generated_styles,
			'CSS should be generated using the newly-merged property metadata'
		);
	}

	/**
	 * Tests resetting metadata to the original block styles definition.
	 *
	 * @covers ::reset_metadata
	 */
	public function test_should_reset_metadata() {
		$block_style_metadata     = new WP_Style_Engine_Block_Style_Metadata_Gutenberg( WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA );
		$new_metadata             = array(
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
		$expected_merged_metadata = array(
			'spacing' => array(
				'padding' => array(
					'property_keys' => array(
						'default'    => 'columns',
						'individual' => 'padding-%s',
					),
					'path'          => array( 'spacing', 'padding' ),
					'css_vars'      => array(
						'spacing' => '--wp--preset--column--$slug',
					),
				),
			),
		);

		$this->assertEquals(
			$expected_merged_metadata['spacing']['padding'],
			$block_style_metadata->add_metadata( $new_metadata )->get_metadata( array( 'spacing', 'padding' ) ),
			'Should merge'
		);

		$block_style_metadata->reset_metadata();
		$this->assertEquals(
			WP_Style_Engine_Gutenberg::BLOCK_STYLE_DEFINITIONS_METADATA['spacing']['padding'],
			$block_style_metadata->get_metadata( array( 'spacing', 'padding' ) ),
			'Should be equal to original'
		);
	}
}
