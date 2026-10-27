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

	/**
	 * The icon registry instances before each test, keyed by class name.
	 *
	 * @var array<string, object|null>
	 */
	private $original_registries = array();

	public function set_up() {
		parent::set_up();

		$this->original_block_to_render     = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/icon',
			'attrs'     => array(),
		);

		/*
		 * Other suites reset the `WP_Icons_Registry` singleton, wiping the collections and
		 * icons that `init` only registers once. Replay the registration on fresh registry
		 * instances so order-dependent tests pass. The "core-admin" collection cannot be
		 * unregistered, so swap the instances rather than dropping whatever survived.
		 */
		foreach ( array( WP_Icon_Collections_Registry::class, WP_Icons_Registry::class ) as $class_name ) {
			$this->original_registries[ $class_name ] = $this->set_registry_instance( $class_name, null );
		}
		WP_Icon_Collections_Registry_Gutenberg::get_instance();
		WP_Icons_Registry_Gutenberg::get_instance();
		gutenberg_register_default_icon_collections();
		gutenberg_register_default_icons();
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_to_render;

		foreach ( $this->original_registries as $class_name => $instance ) {
			$this->set_registry_instance( $class_name, $instance );
		}
		$this->original_registries = array();

		parent::tear_down();
	}

	/**
	 * Replaces a registry singleton instance.
	 *
	 * @param string      $class_name The registry class name.
	 * @param object|null $instance   The instance to use.
	 * @return object|null The previous instance.
	 */
	private function set_registry_instance( $class_name, $instance ) {
		$instance_property = new ReflectionProperty( $class_name, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}
		$previous = $instance_property->getValue();
		$instance_property->setValue( null, $instance );
		return $previous;
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

	public function test_renders_only_icons_in_public_collections() {
		// Renders public core icon.
		$processor = new WP_HTML_Tag_Processor( gutenberg_render_block_core_icon( array( 'icon' => 'core/caution' ) ) );
		$this->assertTrue( $processor->next_tag( 'svg' ) );

		// Does not render private core-admin icon.
		$this->assertNotEmpty( wp_get_icon( 'core-admin/wordpress' ) );
		$this->assertEmpty( gutenberg_render_block_core_icon( array( 'icon' => 'core-admin/wordpress' ) ) );
	}
}
