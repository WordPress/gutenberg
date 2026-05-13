<?php
/**
 * Tests the states block support.
 *
 * @package gutenberg
 */

class WP_Block_Supports_States_Test extends WP_UnitTestCase {
	/**
	 * @var string|null
	 */
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		parent::tear_down();
	}

	/**
	 * Registers a block for tests when the block is not already registered.
	 *
	 * @param string $block_name Block name.
	 * @param array  $selectors  Optional block selectors (e.g. `['root' => '.foo .bar']`).
	 * @return WP_Block_Type
	 */
	private function ensure_block_registered( $block_name, $selectors = array() ) {
		$registered_block = WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
		if ( $registered_block ) {
			return $registered_block;
		}

		$this->test_block_name = $block_name;
		$args                  = array(
			'api_version' => 3,
			'attributes'  => array(
				'style' => array( 'type' => 'object' ),
			),
		);
		if ( ! empty( $selectors ) ) {
			$args['selectors'] = $selectors;
		}
		register_block_type( $block_name, $args );

		return WP_Block_Type_Registry::get_instance()->get_registered( $block_name );
	}

	/**
	 * Mirrors the CSS-building logic in gutenberg_render_block_states_support()
	 * to produce the unique scoped class name for a given map of state => style arrays.
	 * CSS is now registered with the style engine store rather than injected inline.
	 *
	 * @param array $state_styles Map of state to style array (e.g. `[':hover' => ['color' => [...]]]`).
	 * @return array { unique_class: string }
	 */
	private function build_expected_state_output( $state_styles ) {
		$css_rules = array();
		foreach ( $state_styles as $state => $style ) {
			$compiled = wp_style_engine_get_styles(
				gutenberg_normalize_state_style_for_css_output( $style )
			);
			if ( ! empty( $compiled['declarations'] ) ) {
				$css_rules[] = array(
					'state'        => $state,
					'declarations' => $compiled['declarations'],
				);
			}
		}

		return array(
			'unique_class' => 'wp-states-' . substr( md5( wp_json_encode( $css_rules ) ), 0, 8 ),
		);
	}

	/**
	 * Tests that fallback border-style declarations are added after CSS generation.
	 *
	 * @covers ::gutenberg_get_state_declarations_with_fallback_border_styles
	 */
	public function test_adds_fallback_border_style_declarations() {
		$actual = gutenberg_get_state_declarations_with_fallback_border_styles(
			array(
				'border-color'     => '#000000',
				'border-top-width' => '2px',
			)
		);

		$this->assertSame(
			array(
				'border-color'     => '#000000',
				'border-top-width' => '2px',
				'border-style'     => 'solid',
				'border-top-style' => 'solid',
			),
			$actual
		);
	}

	/**
	 * Tests that authored border-style declarations are preserved.
	 *
	 * @covers ::gutenberg_get_state_declarations_with_fallback_border_styles
	 */
	public function test_preserves_authored_border_style_declarations() {
		$actual = gutenberg_get_state_declarations_with_fallback_border_styles(
			array(
				'border-color'      => '#000000',
				'border-style'      => 'dashed !important',
				'border-left-width' => '2px',
			)
		);

		$this->assertSame(
			array(
				'border-color'      => '#000000',
				'border-style'      => 'dashed !important',
				'border-left-width' => '2px',
			),
			$actual
		);
	}

	/**
	 * Tests that preset values are converted to CSS custom property references.
	 *
	 * @covers ::gutenberg_normalize_state_preset_vars
	 */
	public function test_converts_state_preset_vars_to_css_vars() {
		$actual = gutenberg_normalize_state_preset_vars(
			array(
				'border' => array(
					'color' => 'var:preset|color|accent-1',
				),
			)
		);

		$this->assertSame(
			array(
				'border' => array(
					'color' => 'var(--wp--preset--color--accent-1)',
				),
			),
			$actual
		);
	}

	/**
	 * Tests that block content is returned unchanged when the block name is missing.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_block_name_missing() {
		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => '',
			'attrs'     => array(),
		);

		$actual = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Tests that block content is returned unchanged when content is empty.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_block_content_empty() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array(
				'style' => array(
					':hover' => array( 'color' => array( 'text' => '#ff0000' ) ),
				),
			),
		);

		$actual = gutenberg_render_block_states_support( '', $block );

		$this->assertSame( '', $actual );
	}

	/**
	 * Tests that block content is returned unchanged when the block has no configured pseudo-states.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_block_has_no_configured_pseudo_states() {
		$this->test_block_name = 'test/no-pseudo-state-config';
		register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 3,
				'attributes'  => array(
					'style' => array( 'type' => 'object' ),
				),
				'supports'    => array(),
			)
		);

		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => 'test/no-pseudo-state-config',
			'attrs'     => array(
				'style' => array(
					':hover' => array( 'color' => array( 'text' => '#ff0000' ) ),
				),
			),
		);

		$actual = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Tests that block content is returned unchanged when no pseudo-state styles are set.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_no_state_styles_set() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array(
				'style' => array(
					'color' => array( 'text' => '#000000' ),
				),
			),
		);

		$actual = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Tests that block content is returned unchanged when the pseudo-state key is an empty array.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_state_style_is_empty_array() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array(
				'style' => array(
					':hover' => array(),
				),
			),
		);

		$actual = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Tests that hover text color generates scoped CSS with !important.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_text_color_generates_scoped_css() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'text' => '#e6ffe8' ) ) );
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover background color generates scoped CSS.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_background_color_generates_scoped_css() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'background' => '#ff00d0' ) ) );
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover text and background color both appear in a single rule.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_text_and_background_color_in_same_rule() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'color' => array(
					'background' => '#ff00d0',
					'text'       => '#e6ffe8',
				),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that a font family stored as a preset reference is resolved to a CSS
	 * custom property in the generated style tag.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_font_family_preset_reference_generates_css_custom_property() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'typography' => array( 'fontFamily' => 'var:preset|font-family|heading' ),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover font size generates scoped CSS.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_font_size_generates_scoped_css() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'typography' => array( 'fontSize' => '1.5rem' ),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover border width and color generate a scoped style tag.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_border_width_and_color_generate_scoped_css() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array(
					'width' => '2px',
					'color' => '#000000',
				),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );

		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );
		$this->assertStringContainsString(
			'border-width:2px !important;',
			$actual_stylesheet
		);
		$this->assertStringContainsString(
			'border-style:solid;',
			$actual_stylesheet
		);
		$this->assertStringNotContainsString(
			'border-style:solid !important;',
			$actual_stylesheet
		);
	}

	/**
	 * Tests that explicitly-authored hover border style declarations use !important.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_authored_border_style_generates_important_css_declaration() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array(
					'style' => 'solid',
				),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		gutenberg_render_block_states_support( $block_content, $block );
		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		$this->assertStringContainsString(
			'border-style:solid !important;',
			$actual_stylesheet
		);
	}

	/**
	 * Tests that explicitly-authored side border style declarations use !important.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_authored_side_border_style_generates_important_css_declaration() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array(
					'top' => array(
						'style' => 'dashed',
					),
				),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		gutenberg_render_block_states_support( $block_content, $block );
		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		$this->assertStringContainsString(
			'border-top-style:dashed !important;',
			$actual_stylesheet
		);
	}

	/**
	 * Tests that hover side border color declarations use !important.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_side_border_color_generates_important_css_declaration() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array(
					'top' => array(
						'color' => '#0000ff',
					),
				),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		gutenberg_render_block_states_support( $block_content, $block );
		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		$this->assertStringContainsString(
			'border-top-color:#0000ff !important;',
			$actual_stylesheet
		);
		$this->assertStringContainsString(
			'border-top-style:solid;',
			$actual_stylesheet
		);
	}

	/**
	 * Tests that a preset hover border color is emitted as a CSS declaration.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_preset_border_color_generates_css_declaration() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array(
					'color' => 'var:preset|color|accent-1',
				),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts = $this->build_expected_state_output( $state_styles );
		gutenberg_render_block_states_support( $block_content, $block );
		$actual_stylesheet = gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) );

		$this->assertStringContainsString(
			'.' . $parts['unique_class'] . ':hover{',
			$actual_stylesheet
		);
		$this->assertStringContainsString(
			'border-color:var(--wp--preset--color--accent-1) !important;',
			$actual_stylesheet
		);
		$this->assertStringContainsString(
			'border-style:solid;',
			$actual_stylesheet
		);
	}

	/**
	 * Tests that hover border radius generates scoped CSS.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_border_radius_generates_scoped_css() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array( 'radius' => '8px' ),
			),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that multiple states each generate a separate scoped CSS rule.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_multiple_states_generate_separate_css_rules() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover'         => array( 'color' => array( 'text' => '#ff0000' ) ),
			':focus'         => array( 'color' => array( 'text' => '#00ff00' ) ),
			':focus-visible' => array( 'color' => array( 'text' => '#0000ff' ) ),
		);
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that unconfigured pseudo-state keys are ignored.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_unconfigured_pseudo_state_is_ignored() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array(
				'style' => array(
					':visited' => array( 'color' => array( 'text' => '#ff0000' ) ),
				),
			),
		);

		$actual = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Tests that the unique scoped class is added to the wrapper element for a
	 * block with no descendant root selector.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_unique_class_is_added_to_wrapper_when_no_root_selector() {
		$this->ensure_block_registered( 'core/navigation-link' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'text' => '#ff0000' ) ) );
		$block         = array(
			'blockName' => 'core/navigation-link',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that the unique scoped class is added to the descendant element (not
	 * the wrapper) for a block whose `selectors.root` targets a descendant, so
	 * that `.wp-states-XXXX:hover` matches correctly.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_unique_class_is_added_to_descendant_not_wrapper_when_root_selector_has_descendant() {
		$this->ensure_block_registered(
			'core/button',
			array( 'root' => '.wp-block-button .wp-block-button__link' )
		);

		$block_content = '<div class="wp-block-button"><a class="wp-block-button__link">Click me</a></div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'background' => '#ff00d0' ) ) );
		$block         = array(
			'blockName' => 'core/button',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-button"><a class="wp-block-button__link ' . $parts['unique_class'] . '">Click me</a></div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Integration test using the exact block markup and style attribute captured
	 * from a core/button block in the editor with Twenty Twenty-Four theme.
	 * Covers color, typography (preset font family reference), and class injection
	 * onto the descendant element.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_button_like_block_with_hover_color_and_font_family_preset() {
		$this->ensure_block_registered(
			'core/button',
			array( 'root' => '.wp-block-button .wp-block-button__link' )
		);

		$block_content = '<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-accent-4-background-color has-text-color has-background has-link-color wp-element-button" style="color:#bdfffb">Button 2 outline</a></div>';
		$state_styles  = array(
			':hover' => array(
				'color'      => array(
					'background' => '#ff00d0',
					'text'       => '#e6ffe8',
				),
				// Font family is stored as a preset reference by the editor.
				'typography' => array(
					'fontFamily' => 'var:preset|font-family|heading',
				),
			),
		);
		$block = array(
			'blockName' => 'core/button',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-accent-4-background-color has-text-color has-background has-link-color wp-element-button ' . $parts['unique_class'] . '" style="color:#bdfffb">Button 2 outline</a></div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover border styles on a button-like block are scoped to the
	 * descendant element.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_button_like_block_with_hover_border() {
		$this->ensure_block_registered(
			'core/button',
			array( 'root' => '.wp-block-button .wp-block-button__link' )
		);

		$block_content = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Click</a></div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array(
					'color' => '#0000ff',
					'width' => '3px',
					'style' => 'dashed',
				),
			),
		);
		$block         = array(
			'blockName' => 'core/button',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button ' . $parts['unique_class'] . '">Click</a></div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}
}
