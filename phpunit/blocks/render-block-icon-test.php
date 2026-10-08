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

	public function test_applies_color_border_width_and_padding_styles() {
		$output = gutenberg_render_block_core_icon(
			array(
				'icon'      => 'core/caution',
				'textColor' => 'accent',
				'style'     => array(
					'color'      => array( 'background' => '#ffeeee' ),
					'border'     => array(
						'radius' => '4px',
						'width'  => '2px',
						'style'  => 'solid',
						'color'  => '#000000',
					),
					'dimensions' => array( 'width' => '48px' ),
					'spacing'    => array(
						'padding' => array(
							'top'  => 'var:preset|spacing|20',
							'left' => '8px',
						),
					),
				),
			)
		);

		$processor = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue( $processor->next_tag( 'svg' ) );
		$this->assertSame( 'has-text-color has-accent-color has-background has-border-color', $processor->get_attribute( 'class' ) );
		$this->assertSame(
			'fill: none; color:var(--wp--preset--color--accent);background-color:#ffeeee;border-color:#000000;border-radius:4px;border-style:solid;border-width:2px;width:48px;padding-top:var(--wp--preset--spacing--20);padding-left:8px;',
			$processor->get_attribute( 'style' )
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
