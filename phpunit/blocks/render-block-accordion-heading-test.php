<?php
/**
 * Tests for the core Accordion Heading block renderer.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * @group blocks
 *
 * @covers ::gutenberg_block_core_accordion_heading_render
 */
class Block_Core_Accordion_Heading_Render_Test extends WP_UnitTestCase {
	/**
	 * The block supports state before each test.
	 *
	 * @var array|null
	 */
	private $original_block_to_render;

	/**
	 * An icon registered in a non-public collection, for testing the
	 * collection visibility gate.
	 *
	 * @var string|null
	 */
	private $non_public_icon;

	public function set_up() {
		parent::set_up();

		$this->original_block_to_render     = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'blockName' => 'core/accordion-heading',
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

		wp_register_icon(
			'core-admin/hidden-chevron',
			array(
				'label'   => 'Hidden chevron',
				'content' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 18V6M18 12H6" /></svg>',
			)
		);
		$this->non_public_icon = 'core-admin/hidden-chevron';
	}

	public function tear_down() {
		wp_unregister_icon( 'core-admin/hidden-chevron' );
		$this->non_public_icon              = null;
		WP_Block_Supports::$block_to_render = $this->original_block_to_render;

		parent::tear_down();
	}

	/**
	 * Returns content as saved by the block for a heading with a stateful
	 * toggle icon.
	 *
	 * @param bool $with_expanded_span Whether the expanded span is present.
	 * @return string The saved block content.
	 */
	private function get_stateful_content( $with_expanded_span = true ) {
		$expanded_span = $with_expanded_span
			? '<span data-icon-state="expanded"></span>'
			: '';

		return '<h3 class="wp-block-accordion-heading has-icon has-icon-right"><button type="button" class="wp-block-accordion-heading__toggle"><span class="wp-block-accordion-heading__toggle-title">Accordion Title</span><span class="wp-block-accordion-heading__toggle-icon is-stateful" aria-hidden="true"><span data-icon-state="rest"></span>' . $expanded_span . '</span></button></h3>';
	}

	/**
	 * Returns content as saved by the block for a heading with the legacy
	 * `+` toggle icon.
	 *
	 * @return string The saved block content.
	 */
	private function get_legacy_content() {
		return '<h3 class="wp-block-accordion-heading has-icon has-icon-right"><button type="button" class="wp-block-accordion-heading__toggle"><span class="wp-block-accordion-heading__toggle-title">Accordion Title</span><span class="wp-block-accordion-heading__toggle-icon" aria-hidden="true">+</span></button></h3>';
	}

	public function test_legacy_content_without_icon_references_passes_through_unchanged() {
		$content = $this->get_legacy_content();

		$this->assertSame(
			$content,
			gutenberg_block_core_accordion_heading_render( array(), $content )
		);
	}

	public function test_content_with_empty_icon_attribute_passes_through_unchanged() {
		$content = $this->get_legacy_content();

		$this->assertSame(
			$content,
			gutenberg_block_core_accordion_heading_render(
				array( 'icon' => '' ),
				$content
			)
		);
	}

	public function test_fills_rest_and_expanded_state_spans_with_registry_svgs() {
		$output = gutenberg_block_core_accordion_heading_render(
			array(
				'icon'       => 'core/plus',
				'iconStates' => array( 'expanded' => 'core/check' ),
			),
			$this->get_stateful_content()
		);

		$this->assertSame( 2, substr_count( $output, '<svg' ) );
		$this->assertStringContainsString(
			'<span data-icon-state="rest"><svg',
			$output
		);
		$this->assertStringContainsString(
			'<span data-icon-state="expanded"><svg',
			$output
		);
		$this->assertStringNotContainsString(
			'<span data-icon-state="rest"></span>',
			$output
		);
		$this->assertStringNotContainsString(
			'<span data-icon-state="expanded"></span>',
			$output
		);
	}

	public function test_fills_rest_span_and_removes_empty_expanded_span_when_no_expanded_reference_is_stored() {
		$output = gutenberg_block_core_accordion_heading_render(
			array( 'icon' => 'core/plus' ),
			$this->get_stateful_content()
		);

		$this->assertSame( 1, substr_count( $output, '<svg' ) );
		$this->assertStringContainsString(
			'<span data-icon-state="rest"><svg',
			$output
		);
		$this->assertStringNotContainsString(
			'data-icon-state="expanded"',
			$output
		);
	}

	public function test_leaves_content_unchanged_when_rest_icon_is_unknown() {
		$attributes = array(
			'icon'       => 'core/unknown-icon',
			'iconStates' => array( 'expanded' => 'core/check' ),
		);
		$content    = $this->get_stateful_content();

		$this->assertSame(
			$content,
			gutenberg_block_core_accordion_heading_render( $attributes, $content )
		);
	}

	public function test_removes_empty_expanded_span_when_expanded_icon_is_unknown() {
		$output = gutenberg_block_core_accordion_heading_render(
			array(
				'icon'       => 'core/plus',
				'iconStates' => array( 'expanded' => 'core/unknown-icon' ),
			),
			$this->get_stateful_content()
		);

		$this->assertSame( 1, substr_count( $output, '<svg' ) );
		$this->assertStringContainsString(
			'<span data-icon-state="rest"><svg',
			$output
		);
		$this->assertStringNotContainsString(
			'data-icon-state="expanded"',
			$output
		);
	}

	public function test_ignores_non_array_icon_states_value() {
		$output = gutenberg_block_core_accordion_heading_render(
			array(
				'icon'       => 'core/plus',
				'iconStates' => 'not-a-map',
			),
			$this->get_stateful_content()
		);

		$this->assertSame( 1, substr_count( $output, '<svg' ) );
		$this->assertStringContainsString(
			'<span data-icon-state="rest"><svg',
			$output
		);
		$this->assertStringNotContainsString(
			'data-icon-state="expanded"',
			$output
		);
	}

	public function test_ignores_state_keys_other_than_expanded() {
		$output = gutenberg_block_core_accordion_heading_render(
			array(
				'icon'       => 'core/plus',
				'iconStates' => array( 'selected' => 'core/check' ),
			),
			$this->get_stateful_content()
		);

		$this->assertSame( 1, substr_count( $output, '<svg' ) );
		$this->assertStringContainsString(
			'<span data-icon-state="rest"><svg',
			$output
		);
		$this->assertStringNotContainsString(
			'data-icon-state="expanded"',
			$output
		);
	}

	public function test_non_string_expanded_reference_is_ignored() {
		$output = gutenberg_block_core_accordion_heading_render(
			array(
				'icon'       => 'core/plus',
				'iconStates' => array( 'expanded' => 42 ),
			),
			$this->get_stateful_content()
		);

		$this->assertSame( 1, substr_count( $output, '<svg' ) );
		$this->assertStringNotContainsString(
			'data-icon-state="expanded"',
			$output
		);
	}

	public function test_leaves_content_unchanged_when_state_spans_are_missing() {
		$content = $this->get_legacy_content();

		$this->assertSame(
			$content,
			gutenberg_block_core_accordion_heading_render(
				array(
					'icon'       => 'core/plus',
					'iconStates' => array( 'expanded' => 'core/check' ),
				),
				$content
			)
		);
	}

	public function test_leaves_expanded_absent_when_its_span_is_missing_from_saved_content() {
		$content = $this->get_stateful_content( false );

		$output = gutenberg_block_core_accordion_heading_render(
			array(
				'icon'       => 'core/plus',
				'iconStates' => array( 'expanded' => 'core/check' ),
			),
			$content
		);

		$this->assertSame( 1, substr_count( $output, '<svg' ) );
		$this->assertStringContainsString(
			'<span data-icon-state="rest"><svg',
			$output
		);
		$this->assertStringNotContainsString(
			'data-icon-state="expanded"',
			$output
		);
	}

	public function test_leaves_content_unchanged_when_icon_collection_is_not_public() {
		$attributes = array(
			'icon'       => $this->non_public_icon,
			'iconStates' => array( 'expanded' => 'core/check' ),
		);
		$content    = $this->get_stateful_content();

		$this->assertSame(
			$content,
			gutenberg_block_core_accordion_heading_render( $attributes, $content )
		);
	}

	public function test_leaves_content_unchanged_when_icon_attribute_is_not_a_string() {
		$content = $this->get_stateful_content();

		$this->assertSame(
			$content,
			gutenberg_block_core_accordion_heading_render(
				array( 'icon' => 42 ),
				$content
			)
		);
	}
}
