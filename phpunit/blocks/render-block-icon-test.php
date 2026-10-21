<?php
/**
 * Tests for the core Icon block renderer.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_icon
 */
class Block_Core_Icon_Render_Test extends WP_UnitTestCase {
	/**
	 * The block supports state before each test.
	 *
	 * @var array|null
	 */
	private $original_block_to_render;

	public function set_up() {
		parent::set_up();

		$this->original_block_to_render     = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/icon',
			'attrs'     => array(),
		);

		/*
		 * Other suites reset the `WP_Icons_Registry` singleton, wiping the collections and
		 * icons that `init` only registers once. Replay the registration so order-dependent
		 * tests pass. `gutenberg_register_default_icon_collections()` registers every default
		 * collection at once, so drop whatever survived rather than topping up.
		 */
		$collections_registry = WP_Icon_Collections_Registry::get_instance();
		foreach ( array( 'core', 'core-admin' ) as $collection_slug ) {
			if ( $collections_registry->is_registered( $collection_slug ) ) {
				$collections_registry->unregister( $collection_slug );
			}
		}
		gutenberg_register_default_icon_collections();
		gutenberg_register_default_icons();
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_to_render;

		parent::tear_down();
	}

	public function test_preserves_intrinsic_svg_style_when_applying_block_styles() {
		$output = gutenberg_render_block_core_icon(
			array(
				'icon'  => 'core/caution',
				'style' => array(
					'dimensions' => array( 'width' => '48px' ),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue( $processor->next_tag( 'svg' ) );

		$style = $processor->get_attribute( 'style' );
		$this->assertIsString( $style );
		$this->assertMatchesRegularExpression( '/(?:^|;)\s*fill\s*:\s*none\s*(?:;|$)/', $style );
		$this->assertMatchesRegularExpression( '/(?:^|;)\s*width\s*:\s*48px\s*(?:;|$)/', $style );
		$this->assertLessThan( strpos( $style, 'width' ), strpos( $style, 'fill' ) );
	}

	public function test_preserves_intrinsic_svg_style_when_applying_rotation() {
		$output = gutenberg_render_block_core_icon(
			array(
				'icon'     => 'core/info',
				'rotation' => 90,
			)
		);

		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue( $processor->next_tag( 'svg' ) );

		$style = $processor->get_attribute( 'style' );
		$this->assertIsString( $style );
		$this->assertMatchesRegularExpression( '/(?:^|;)\s*fill\s*:\s*none\s*(?:;|$)/', $style );
		$this->assertMatchesRegularExpression( '/(?:^|;)\s*rotate\s*:\s*90deg\s*(?:;|$)/', $style );
		$this->assertLessThan( strpos( $style, 'rotate' ), strpos( $style, 'fill' ) );
	}

	public function test_border_styles_sit_between_color_and_dimensions() {
		$attributes = array(
			'icon'        => 'core/caution',
			'textColor'   => 'vivid-red',
			'borderColor' => 'accent-2',
			'style'       => array(
				'color'      => array( 'background' => '#eeeeee' ),
				'border'     => array(
					'radius' => 5,
					'top'    => array(
						'style' => 'dashed',
						'width' => '3px',
					),
				),
				'shadow'     => '10px 10px 5px #000000',
				'dimensions' => array( 'width' => '48px' ),
				'spacing'    => array( 'padding' => array( 'top' => '4px' ) ),
			),
		);

		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_icon( $attributes ) );
		$this->assertTrue( $processor->next_tag( 'svg' ) );
		$this->assertSame(
			array(
				'class' => 'has-text-color has-vivid-red-color has-background has-border-color has-accent-2-border-color',
				'style' => 'fill: none; color:var(--wp--preset--color--vivid-red);background-color:#eeeeee;border-radius:5px;border-top-width:3px;border-top-style:dashed;box-shadow:10px 10px 5px #000000;width:48px;padding-top:4px;',
			),
			array(
				'class' => $processor->get_attribute( 'class' ),
				'style' => $processor->get_attribute( 'style' ),
			)
		);
	}

	public function test_renders_only_icons_in_public_collections() {
		// Renders public core icon.
		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_icon( array( 'icon' => 'core/caution' ) ) );
		$this->assertTrue( $processor->next_tag( 'svg' ) );

		// Does not render private core-admin icon.
		$this->assertNotEmpty( wp_get_icon( 'core-admin/wordpress' ) );
		$this->assertEmpty( gutenberg_render_block_core_icon( array( 'icon' => 'core-admin/wordpress' ) ) );
	}
}
