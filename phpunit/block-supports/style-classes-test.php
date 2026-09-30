<?php
/**
 * Test the style classes block support.
 *
 * @since 23.4.0
 *
 * @package gutenberg
 */

class WP_Block_Supports_Style_Classes_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		add_filter( 'wp_enabled_style_properties', array( $this, 'enable_all_properties' ) );
	}

	public function tear_down() {
		remove_filter( 'wp_enabled_style_properties', array( $this, 'enable_all_properties' ) );
		parent::tear_down();
	}

	/**
	 * Callback to enable standard style properties.
	 *
	 * @return array
	 */
	public function enable_all_properties() {
		return array(
			'padding',
			'margin',
			'block-gap',
			'border-radius',
			'border-width',
			'border-style',
			'border-color',
			'font-size',
			'font-weight',
			'shadow',
			'aspect-ratio',
			'min-height',
			'color-background',
			'color-text',
			'font-family',
		);
	}

	/**
	 * Tests that the block support bails out early if no styles are present.
	 */
	public function test_bails_if_no_styles_present() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertSame( $content, $result, 'Should not modify content if no styles are present.' );
	}

	/**
	 * Tests that spacing generates uniform and mixed classes.
	 */
	public function test_spacing_uniform_and_mixed() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'padding' => 'var:preset|spacing|80',
						'margin'  => array(
							'top'    => '20px',
							'bottom' => 'var:preset|spacing|40',
							'left'   => '0',
							'right'  => '0',
						),
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-padding', $result );
		$this->assertStringContainsString( 'has-80-padding', $result );
		$this->assertStringContainsString( 'has-margin', $result );
		$this->assertStringContainsString( 'has-mixed-margin', $result );
		$this->assertStringContainsString( 'has-custom-top-margin', $result );
		$this->assertStringContainsString( 'has-40-bottom-margin', $result );
	}

	/**
	 * Tests that block gap generates axial and uniform classes.
	 */
	public function test_block_gap_axial_and_uniform() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'blockGap' => array(
							'horizontal' => 'var:preset|spacing|20',
							'vertical'   => '50px',
						),
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-block-gap', $result );
		$this->assertStringContainsString( 'has-20-horizontal-block-gap', $result );
		$this->assertStringContainsString( 'has-custom-vertical-block-gap', $result );
	}

	/**
	 * Tests that border radius collapses identical corners into a uniform class.
	 */
	public function test_border_radius_all_identical_corners() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'border' => array(
						'radius' => array(
							'topLeft'     => '100px',
							'topRight'    => '100px',
							'bottomLeft'  => '100px',
							'bottomRight' => '100px',
						),
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-border-radius', $result );
		$this->assertStringContainsString( 'has-custom-border-radius', $result );
		$this->assertStringNotContainsString( 'has-mixed-border-radius', $result );
	}

	/**
	 * Tests that border style embeds the raw value while border width uses a custom class.
	 */
	public function test_border_style_embeds_raw_value() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'border' => array(
						'style' => 'dashed',
						'width' => '2px',
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-border-style', $result );
		$this->assertStringContainsString( 'has-dashed-border-style', $result );
		$this->assertStringContainsString( 'has-border-width', $result );
		$this->assertStringContainsString( 'has-custom-border-width', $result );
	}

	/**
	 * Tests that border width generates classes for mixed sides.
	 */
	public function test_border_width_mixed_sides() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'border' => array(
						'top'    => array( 'width' => '2px' ),
						'bottom' => array( 'width' => 'var:preset|spacing|40' ),
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-border-width', $result );
		$this->assertStringContainsString( 'has-mixed-border-width', $result );
		$this->assertStringContainsString( 'has-custom-top-border-width', $result );
		$this->assertStringContainsString( 'has-40-bottom-border-width', $result );
	}

	/**
	 * Tests that typography properties read both top-level attributes and the style object.
	 */
	public function test_typography_reads_top_level_and_style_object() {
		$block   = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'fontSize' => 'large',
				'style'    => array(
					'typography' => array(
						'fontWeight' => 'bold',
					),
				),
			),
		);
		$content = '<p class="wp-block-paragraph"></p>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-font-size', $result );
		$this->assertStringContainsString( 'has-large-font-size', $result );
		$this->assertStringContainsString( 'has-font-weight', $result );
		$this->assertStringContainsString( 'has-bold-font-weight', $result );
	}

	/**
	 * Tests that dimension properties map correctly to aspect ratio and min height classes.
	 */
	public function test_aspect_ratio_and_min_height() {
		$block   = array(
			'blockName' => 'core/cover',
			'attrs'     => array(
				'style' => array(
					'dimensions' => array(
						'aspectRatio' => '16/9',
						'minHeight'   => '50vh',
					),
				),
			),
		);
		$content = '<div class="wp-block-cover"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-aspect-ratio', $result );
		$this->assertStringContainsString( 'has-16-9-aspect-ratio', $result );
		$this->assertStringContainsString( 'has-min-height', $result );
		$this->assertStringContainsString( 'has-custom-min-height', $result );
	}

	/**
	 * Tests that color properties map correctly to background and text color classes.
	 */
	public function test_color_properties() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'color' => array(
						'background' => '#ff0000',
						'text'       => 'var:preset|color|primary',
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-background', $result );
		$this->assertStringContainsString( 'has-custom-background', $result );
		$this->assertStringContainsString( 'has-color', $result );
		$this->assertStringContainsString( 'has-primary-color', $result );
	}

	/**
	 * Tests that the parser correctly extracts CSS variables.
	 */
	public function test_parser_extracts_css_variables() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'shadow' => 'var(--wp--preset--shadow--natural)',
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-shadow', $result );
		$this->assertStringContainsString( 'has-natural-shadow', $result );
	}

	/**
	 * Tests that the per-block override filter correctly opts-out specific properties.
	 */
	public function test_per_block_override_filter() {
		$filter = function ( $enabled ) {
			return array_diff( $enabled, array( 'margin' ) );
		};
		add_filter( 'wp_enabled_style_properties_core-image', $filter );

		$block   = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'padding' => '20px',
						'margin'  => '20px',
					),
				),
			),
		);
		$content = '<figure class="wp-block-image"></figure>';
		$result  = gutenberg_render_style_classes( $content, $block );

		remove_filter( 'wp_enabled_style_properties_core-image', $filter );

		$this->assertStringContainsString( 'has-padding', $result );
		$this->assertStringNotContainsString( 'has-margin', $result );
	}

	/**
	 * Tests that the final class modification filter can inject custom classes.
	 */
	public function test_final_class_modification_filter() {
		$filter = function ( $classes, $block ) {
			if ( 'core/group' === $block['blockName'] ) {
				$classes[] = 'my-injected-class';
			}
			return $classes;
		};
		add_filter( 'wp_block_style_classes', $filter, 10, 2 );

		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'shadow' => 'var:preset|shadow|natural',
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		remove_filter( 'wp_block_style_classes', $filter );

		$this->assertStringContainsString( 'has-natural-shadow', $result );
		$this->assertStringContainsString( 'my-injected-class', $result );
	}

	/**
	 * Tests that a custom property handler filter can register new logic.
	 */
	public function test_custom_property_handler_filter() {
		add_filter(
			'wp_enabled_style_properties',
			function ( $enabled ) {
				$enabled[] = 'my-custom-prop';
				return $enabled;
			}
		);

		$filter = function ( $handlers ) {
			$handlers['my-custom-prop'] = function ( $ctx ) {
				$val = isset( $ctx['attrs']['myCustomAttr'] ) ? $ctx['attrs']['myCustomAttr'] : null;
				return $val ? array( 'has-my-custom-prop', 'has-' . $val . '-custom' ) : array();
			};
			return $handlers;
		};
		add_filter( 'wp_style_property_handlers', $filter );

		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'myCustomAttr' => 'magic',
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		remove_filter( 'wp_style_property_handlers', $filter );

		$this->assertStringContainsString( 'has-my-custom-prop', $result );
		$this->assertStringContainsString( 'has-magic-custom', $result );
	}

	/**
	 * Tests that the engine gracefully handles missing block properties without throwing warnings.
	 */
	public function test_gracefully_handles_missing_block_properties() {
		$block   = array();
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertSame( $content, $result, 'Should return content unaltered without throwing warnings.' );
	}

	/**
	 * Tests that empty strings in multi-sided arrays are ignored.
	 */
	public function test_ignores_empty_strings_in_sides() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'margin' => array(
							'top'    => '20px',
							'bottom' => '',
							'left'   => null,
						),
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-margin', $result );
		$this->assertStringContainsString( 'has-mixed-margin', $result );
		$this->assertStringContainsString( 'has-custom-top-margin', $result );
		$this->assertStringNotContainsString( 'bottom', $result );
		$this->assertStringNotContainsString( 'left', $result );
	}

	/**
	 * Tests that malformed preset strings fall back to custom classes safely.
	 */
	public function test_handles_malformed_preset_strings() {
		$block   = array(
			'blockName' => 'core/group',
			'attrs'     => array(
				'style' => array(
					'spacing' => array(
						'padding' => 'var:preset|spacing',
					),
				),
			),
		);
		$content = '<div class="wp-block-group"></div>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-padding', $result );
		$this->assertStringContainsString( 'has-custom-padding', $result );
	}

	/**
	 * Tests that weirdly capitalized or spaced custom values are sanitized to valid kebab-case classes.
	 */
	public function test_sanitizes_weird_slugs_and_values() {
		$block   = array(
			'blockName' => 'core/heading',
			'attrs'     => array(
				'style' => array(
					'typography' => array(
						'fontWeight' => 'Super Heavy!',
					),
				),
			),
		);
		$content = '<h2 class="wp-block-heading">Heading</h2>';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertStringContainsString( 'has-font-weight', $result );
		$this->assertStringContainsString( 'has-super-heavy-font-weight', $result );
	}

	/**
	 * Tests that the processor bails if the content has no HTML tags.
	 */
	public function test_bails_if_no_html_tags_in_content() {
		$block   = array(
			'blockName' => 'core/paragraph',
			'attrs'     => array(
				'style' => array(
					'typography' => array(
						'fontSize' => 'var:preset|font-size|large',
					),
				),
			),
		);
		$content = 'Just some raw text without a div or p tag.';
		$result  = gutenberg_render_style_classes( $content, $block );

		$this->assertSame( $content, $result, 'Should return raw text unaltered since there is no HTML tag to attach classes to.' );
	}
}
