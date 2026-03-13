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
	}

	public function tear_down() {
		if ( $this->test_block_name ) {
			unregister_block_type( $this->test_block_name );
		}
		$this->test_block_name = null;
		parent::tear_down();
	}

	/**
	 * Registers a block with `__experimentalStates` support.
	 *
	 * @param string $block_name Block name.
	 * @param array  $selectors  Optional block selectors (e.g. `['root' => '.foo .bar']`).
	 * @return WP_Block_Type
	 */
	private function register_block_with_states( $block_name, $selectors = array() ) {
		$this->test_block_name = $block_name;
		$args                  = array(
			'api_version' => 3,
			'attributes'  => array(
				'style' => array( 'type' => 'object' ),
			),
			'supports'    => array(
				'__experimentalStates' => array( ':hover', ':focus', ':active' ),
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
	 * to produce the expected `<style>` tag and unique scoped class name for a
	 * given map of state => style arrays.
	 *
	 * @param array $state_styles Map of state to style array (e.g. `[':hover' => ['color' => [...]]]`).
	 * @return array { style_tag: string, unique_class: string }
	 */
	private function build_expected_state_output( $state_styles ) {
		$css_rules = array();
		foreach ( $state_styles as $state => $style ) {
			$compiled = wp_style_engine_get_styles( $style );
			if ( ! empty( $compiled['css'] ) ) {
				$css_rules[] = array(
					'state' => $state,
					'css'   => $compiled['css'],
				);
			}
		}

		$unique_class = 'wp-states-' . substr( md5( wp_json_encode( $css_rules ) ), 0, 8 );
		$css          = '';
		foreach ( $css_rules as $rule ) {
			$declarations = str_replace( ';', ' !important;', $rule['css'] );
			$css         .= ".$unique_class$rule[state] { $declarations }\n";
		}

		return array(
			'style_tag'    => '<style>' . $css . '</style>',
			'unique_class' => $unique_class,
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
		$this->register_block_with_states( 'test/states-empty-content' );

		$block = array(
			'blockName' => 'test/states-empty-content',
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
	 * Tests that block content is returned unchanged when `__experimentalStates` support is not declared.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_states_support_not_declared() {
		$this->test_block_name = 'test/no-states-support';
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
			'blockName' => 'test/no-states-support',
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
	 * Tests that block content is returned unchanged when no state styles are set.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_no_state_styles_set() {
		$this->register_block_with_states( 'test/states-no-state-style' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => 'test/states-no-state-style',
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
	 * Tests that block content is returned unchanged when the state key is an empty array.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_returns_unchanged_when_state_style_is_empty_array() {
		$this->register_block_with_states( 'test/states-empty-hover' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$block         = array(
			'blockName' => 'test/states-empty-hover',
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
	 * Tests that hover text color generates a scoped style tag with !important.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_text_color_generates_scoped_css() {
		$this->register_block_with_states( 'test/states-hover-text-color' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'text' => '#e6ffe8' ) ) );
		$block         = array(
			'blockName' => 'test/states-hover-text-color',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover background color generates a scoped style tag.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_background_color_generates_scoped_css() {
		$this->register_block_with_states( 'test/states-hover-bg-color' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'background' => '#ff00d0' ) ) );
		$block         = array(
			'blockName' => 'test/states-hover-bg-color',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover text and background color both appear in a single rule.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_text_and_background_color_in_same_rule() {
		$this->register_block_with_states( 'test/states-hover-both-colors' );

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
			'blockName' => 'test/states-hover-both-colors',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
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
		$this->register_block_with_states( 'test/states-hover-font-family' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'typography' => array( 'fontFamily' => 'var:preset|font-family|heading' ),
			),
		);
		$block         = array(
			'blockName' => 'test/states-hover-font-family',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover font size generates a scoped style tag.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_font_size_generates_scoped_css() {
		$this->register_block_with_states( 'test/states-hover-font-size' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'typography' => array( 'fontSize' => '1.5rem' ),
			),
		);
		$block         = array(
			'blockName' => 'test/states-hover-font-size',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover border width and color generate a scoped style tag.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_border_width_and_color_generate_scoped_css() {
		$this->register_block_with_states( 'test/states-hover-border' );

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
			'blockName' => 'test/states-hover-border',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that hover border radius generates a scoped style tag.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_hover_border_radius_generates_scoped_css() {
		$this->register_block_with_states( 'test/states-hover-border-radius' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array(
				'border' => array( 'radius' => '8px' ),
			),
		);
		$block         = array(
			'blockName' => 'test/states-hover-border-radius',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that multiple states each generate a separate scoped CSS rule.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_multiple_states_generate_separate_css_rules() {
		$this->register_block_with_states( 'test/states-multiple' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array(
			':hover' => array( 'color' => array( 'text' => '#ff0000' ) ),
			':focus' => array( 'color' => array( 'text' => '#00ff00' ) ),
		);
		$block         = array(
			'blockName' => 'test/states-multiple',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}

	/**
	 * Tests that the unique scoped class is added to the wrapper element for a
	 * block with no descendant root selector.
	 *
	 * @covers ::gutenberg_render_block_states_support
	 */
	public function test_unique_class_is_added_to_wrapper_when_no_root_selector() {
		$this->register_block_with_states( 'test/states-wrapper' );

		$block_content = '<div class="wp-block-test">Hello</div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'text' => '#ff0000' ) ) );
		$block         = array(
			'blockName' => 'test/states-wrapper',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-test ' . $parts['unique_class'] . '">Hello</div>';
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
		$this->register_block_with_states(
			'test/states-descendant',
			array( 'root' => '.wp-block-button .wp-block-button__link' )
		);

		$block_content = '<div class="wp-block-button"><a class="wp-block-button__link">Click me</a></div>';
		$state_styles  = array( ':hover' => array( 'color' => array( 'background' => '#ff00d0' ) ) );
		$block         = array(
			'blockName' => 'test/states-descendant',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-button"><a class="wp-block-button__link ' . $parts['unique_class'] . '">Click me</a></div>';
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
		$this->register_block_with_states(
			'test/states-button-full',
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
		$block         = array(
			'blockName' => 'test/states-button-full',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-accent-4-background-color has-text-color has-background has-link-color wp-element-button ' . $parts['unique_class'] . '" style="color:#bdfffb">Button 2 outline</a></div>';
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
		$this->register_block_with_states(
			'test/states-button-border',
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
			'blockName' => 'test/states-button-border',
			'attrs'     => array( 'style' => $state_styles ),
		);

		$parts    = $this->build_expected_state_output( $state_styles );
		$expected = $parts['style_tag'] . '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button ' . $parts['unique_class'] . '">Click</a></div>';
		$actual   = gutenberg_render_block_states_support( $block_content, $block );

		$this->assertSame( $expected, $actual );
	}
}
