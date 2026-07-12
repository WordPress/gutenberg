<?php
/**
 * Tests for experimental structural block bindings.
 *
 * @package gutenberg
 */

class Tests_Block_Bindings_InnerBlocks extends WP_UnitTestCase {

	const SOURCE_NAME = 'test/inner-blocks';

	private static $value          = null;
	private static $source_context = array();

	public static function wpSetUpBeforeClass() {
		register_block_type(
			'test/inner-host',
			array(
				'render_callback' => static function ( $attributes, $content ) {
					return '<div class="inner-host">' . $content . '</div>';
				},
			)
		);
		register_block_type( 'test/static-inner-host', array() );
		register_block_type(
			'test/context-provider',
			array(
				'attributes'       => array(
					'provided' => array(
						'type' => 'string',
					),
				),
				'provides_context' => array(
					'test/provided' => 'provided',
				),
				'render_callback'  => static function ( $attributes, $content ) {
					return '<div class="context-provider">' . $content . '</div>';
				},
			)
		);
	}

	public static function wpTearDownAfterClass() {
		unregister_block_type( 'test/inner-host' );
		unregister_block_type( 'test/static-inner-host' );
		unregister_block_type( 'test/context-provider' );
	}

	public function set_up() {
		parent::set_up();
		self::$value          = null;
		self::$source_context = array();

		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => 'Inner blocks test source',
				'uses_context'       => array( 'test/provided', 'test/filter' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					self::$source_context = $block_instance->context;
					return 'innerBlocks' === $attribute_name ? self::$value : null;
				},
			)
		);
	}

	public function tear_down() {
		unregister_block_bindings_source( self::SOURCE_NAME );
		parent::tear_down();
	}

	private function block_markup( $name, $children, $attributes = array() ) {
		$attributes['metadata']['bindings']['innerBlocks'] = array( 'source' => self::SOURCE_NAME );

		return '<!-- wp:' . $name . ' ' . wp_json_encode( $attributes ) . ' -->' .
			$children .
			'<!-- /wp:' . $name . ' -->';
	}

	private function fallback_paragraph( $content = 'Fallback' ) {
		return '<!-- wp:paragraph --><p>' . $content . '</p><!-- /wp:paragraph -->';
	}

	private function sourced_paragraph( $content = 'Sourced' ) {
		return '<!-- wp:paragraph --><p>' . $content . '</p><!-- /wp:paragraph -->';
	}

	public function test_registered_source_replaces_fallback_children() {
		self::$value = $this->sourced_paragraph();
		$parsed      = parse_blocks( $this->block_markup( 'test/inner-host', $this->fallback_paragraph() ) );
		$result      = render_block( $parsed[0] );

		$this->assertStringContainsString( 'Sourced', $result );
		$this->assertStringNotContainsString( 'Fallback', $result );
	}

	/**
	 * @dataProvider data_absent_values
	 */
	public function test_absent_or_invalid_values_preserve_fallback_children( $value ) {
		self::$value = $value;
		$parsed      = parse_blocks( $this->block_markup( 'test/inner-host', $this->fallback_paragraph() ) );
		$result      = render_block( $parsed[0] );

		$this->assertStringContainsString( 'Fallback', $result );
	}

	public function data_absent_values() {
		return array(
			'null'        => array( null ),
			'integer'     => array( 1 ),
			'block array' => array( array() ),
		);
	}

	public function test_empty_string_intentionally_removes_fallback_children() {
		self::$value = '';
		$parsed      = parse_blocks( $this->block_markup( 'test/inner-host', $this->fallback_paragraph() ) );
		$result      = render_block( $parsed[0] );

		$this->assertStringContainsString( 'class="inner-host"', $result );
		$this->assertStringNotContainsString( 'Fallback', $result );
	}

	public function test_empty_string_removes_fallback_children_from_a_nested_dynamic_host() {
		self::$value = '';
		$bound       = $this->block_markup( 'test/inner-host', $this->fallback_paragraph() );
		$parsed      = parse_blocks(
			'<!-- wp:test/context-provider -->' .
			$bound .
			'<!-- /wp:test/context-provider -->'
		);
		$result      = render_block( $parsed[0] );

		$this->assertStringContainsString( 'class="inner-host"', $result );
		$this->assertStringNotContainsString( 'Fallback', $result );
	}

	public function test_static_host_keeps_its_wrapper() {
		self::$value = $this->sourced_paragraph();
		$markup      = $this->block_markup(
			'test/static-inner-host',
			'<section class="static-wrapper">' . $this->fallback_paragraph() . '</section>'
		);
		$parsed      = parse_blocks( $markup );
		$result      = render_block( $parsed[0] );

		$this->assertStringContainsString( '<section class="static-wrapper">', $result );
		$this->assertStringContainsString( 'Sourced', $result );
		$this->assertStringNotContainsString( 'Fallback', $result );
	}

	public function test_nested_source_receives_context_from_a_provider() {
		self::$value = $this->sourced_paragraph();
		$bound       = $this->block_markup( 'test/inner-host', $this->fallback_paragraph() );
		$parsed      = parse_blocks(
			'<!-- wp:test/context-provider {"provided":"from-provider"} -->' .
			$bound .
			'<!-- /wp:test/context-provider -->'
		);

		render_block( $parsed[0] );

		$this->assertSame( 'from-provider', self::$source_context['test/provided'] );
	}

	public function test_top_level_takeover_applies_context_filters_once() {
		self::$value = $this->sourced_paragraph();
		$calls       = 0;
		$filter      = static function ( $context, $parsed_block ) use ( &$calls ) {
			if ( 'test/inner-host' !== ( $parsed_block['blockName'] ?? null ) ) {
				return $context;
			}

			++$calls;
			$context['test/filter'] = 'from-filter';
			return $context;
		};
		add_filter( 'render_block_context', $filter, 10, 3 );

		try {
			$parsed = parse_blocks( $this->block_markup( 'test/inner-host', $this->fallback_paragraph() ) );
			render_block( $parsed[0] );
		} finally {
			remove_filter( 'render_block_context', $filter, 10 );
		}

		$this->assertSame( 1, $calls );
		$this->assertSame( 'from-filter', self::$source_context['test/filter'] );
	}

	public function test_nonempty_value_fails_closed_without_a_parsed_slot() {
		self::$value = $this->sourced_paragraph();
		$markup      = $this->block_markup( 'test/static-inner-host', '<section class="static-wrapper"></section>' );
		$parsed      = parse_blocks( $markup );
		$result      = render_block( $parsed[0] );

		$this->assertStringContainsString( '<section class="static-wrapper"></section>', $result );
		$this->assertStringNotContainsString( 'Sourced', $result );
	}
}
