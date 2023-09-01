<?php
/**
 * Tests_Get_Block_CSS_Selector class
 *
 * @package WordPress
 */

class WP_Get_Block_CSS_Selector_Test extends WP_UnitTestCase {
	private $test_block_name;

	public function set_up() {
		parent::set_up();
		$this->test_block_name = null;
	}

	public function tear_down() {
		unregister_block_type( $this->test_block_name );
		$this->test_block_name = null;
		parent::tear_down();
	}

	private function register_test_block( $name, $selectors = null, $supports = null ) {
		$this->test_block_name = $name;

		return register_block_type(
			$this->test_block_name,
			array(
				'api_version' => 2,
				'attributes'  => array(),
				'selectors'   => $selectors,
				'supports'    => $supports,
			)
		);
	}

	public function test_get_root_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/block-with-selectors',
			array( 'root' => '.wp-custom-block-class' )
		);

		$selector = wp_get_block_css_selector( $block_type );
		$this->assertEquals( '.wp-custom-block-class', $selector );
	}

	public function test_get_root_selector_via_experimental_property() {
		$block_type = self::register_test_block(
			'test/block-without-selectors',
			null,
			array( '__experimentalSelector' => '.experimental-selector' )
		);

		$selector = wp_get_block_css_selector( $block_type );
		$this->assertEquals( '.experimental-selector', $selector );
	}

	public function test_default_root_selector_generation_for_core_block() {
		$block_type = self::register_test_block(
			'core/without-selectors-or-supports',
			null,
			null
		);

		$selector = wp_get_block_css_selector( $block_type );
		$this->assertEquals( '.wp-block-without-selectors-or-supports', $selector );
	}

	public function test_default_root_selector_generation() {
		$block_type = self::register_test_block(
			'test/without-selectors-or-supports',
			null,
			null
		);

		$selector = wp_get_block_css_selector( $block_type );
		$this->assertEquals( '.wp-block-test-without-selectors-or-supports', $selector );
	}

	public function test_get_feature_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/feature-selector',
			array( 'typography' => array( 'root' => '.typography' ) ),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography' );
		$this->assertEquals( '.typography', $selector );
	}

	public function test_get_feature_selector_via_selectors_api_shorthand_property() {
		$block_type = self::register_test_block(
			'test/shorthand-feature-selector',
			array( 'typography' => '.typography' ),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography' );
		$this->assertEquals( '.typography', $selector );
	}

	public function test_no_feature_level_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/null-feature-selector',
			array( 'root' => '.fallback-root-selector' ),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography' );
		$this->assertEquals( null, $selector );
	}

	public function test_fallback_feature_level_selector_via_selectors_api_to_generated_class() {
		$block_type = self::register_test_block(
			'test/fallback-feature-selector',
			array(),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography', true );
		$this->assertEquals( '.wp-block-test-fallback-feature-selector', $selector );
	}


	public function test_fallback_feature_level_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/fallback-feature-selector',
			array( 'root' => '.fallback-root-selector' ),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography', true );
		$this->assertEquals( '.fallback-root-selector', $selector );
	}

	public function test_get_feature_selector_via_experimental_property() {
		$block_type = self::register_test_block(
			'test/experimental-feature-selector',
			null,
			array(
				'typography' => array(
					'__experimentalSelector' => '.experimental-typography',
				),
			)
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography' );
		$this->assertEquals( '.wp-block-test-experimental-feature-selector .experimental-typography', $selector );
	}

	public function test_fallback_feature_selector_via_experimental_property() {
		$block_type = self::register_test_block(
			'test/fallback-feature-selector',
			null,
			array()
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography', true );
		$this->assertEquals( '.wp-block-test-fallback-feature-selector', $selector );
	}

	public function test_no_feature_selector_via_experimental_property() {
		$block_type = self::register_test_block(
			'test/null-experimental-feature-selector',
			null,
			array()
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography' );
		$this->assertEquals( null, $selector );
	}

	public function test_get_subfeature_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/subfeature-selector',
			array(
				'typography' => array(
					'textDecoration' => '.root .typography .text-decoration',
				),
			),
			null
		);

		$selector = wp_get_block_css_selector(
			$block_type,
			array( 'typography', 'textDecoration' )
		);

		$this->assertEquals( '.root .typography .text-decoration', $selector );
	}

	public function test_fallback_subfeature_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/subfeature-selector',
			array(
				'typography' => array( 'root' => '.root .typography' ),
			),
			null
		);

		$selector = wp_get_block_css_selector(
			$block_type,
			array( 'typography', 'textDecoration' ),
			true
		);

		$this->assertEquals( '.root .typography', $selector );
	}

	public function test_no_subfeature_level_selector_via_selectors_api() {
		$block_type = self::register_test_block(
			'test/null-subfeature-selector',
			array(),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, array( 'typography', 'fontSize' ) );
		$this->assertEquals( null, $selector );
	}

	public function test_fallback_subfeature_selector_via_experimental_property() {
		$block_type = self::register_test_block(
			'test/fallback-subfeature-selector',
			null,
			array()
		);

		$selector = wp_get_block_css_selector(
			$block_type,
			array( 'typography', 'fontSize' ),
			true
		);
		$this->assertEquals( '.wp-block-test-fallback-subfeature-selector', $selector );
	}

	public function test_no_subfeature_selector_via_experimental_property() {
		$block_type = self::register_test_block(
			'test/null-experimental-subfeature-selector',
			null,
			array()
		);

		$selector = wp_get_block_css_selector(
			$block_type,
			array( 'typography', 'fontSize' )
		);
		$this->assertEquals( null, $selector );
	}

	public function test_empty_target_returns_null() {
		$block_type = self::register_test_block(
			'test/null-experimental-subfeature-selector',
			null,
			array()
		);

		$selector = wp_get_block_css_selector( $block_type, array() );
		$this->assertEquals( null, $selector );

		$selector = wp_get_block_css_selector( $block_type, '' );
		$this->assertEquals( null, $selector );
	}

	public function test_string_targets_for_features() {
		$block_type = self::register_test_block(
			'test/target-types-for-features',
			array( 'typography' => '.found' ),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography' );
		$this->assertEquals( '.found', $selector );

		$selector = wp_get_block_css_selector( $block_type, array( 'typography' ) );
		$this->assertEquals( '.found', $selector );
	}

	public function test_string_targets_for_subfeatures() {
		$block_type = self::register_test_block(
			'test/target-types-for-features',
			array(
				'typography' => array( 'fontSize' => '.found' ),
			),
			null
		);

		$selector = wp_get_block_css_selector( $block_type, 'typography.fontSize' );
		$this->assertEquals( '.found', $selector );

		$selector = wp_get_block_css_selector( $block_type, array( 'typography', 'fontSize' ) );
		$this->assertEquals( '.found', $selector );
	}
}
