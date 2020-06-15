<?php
/**
 * Test block supported styles.
 *
 * @package Gutenberg
 */

class Block_Supported_Styles_Test extends WP_UnitTestCase {

	/**
	 * Registered block names.
	 *
	 * @var string[]
	 */
	private $registered_block_names = array();

	/**
	 * Sets up each test method.
	 */
	public function setUp() {
		global $post;

		parent::setUp();

		$args = array(
			'post_content' => 'example',
			'post_excerpt' => '',
		);

		$post = $this->factory()->post->create_and_get( $args );
		setup_postdata( $post );
	}

	/**
	 * Tear down each test method.
	 */
	public function tearDown() {
		parent::tearDown();

		while ( ! empty( $this->registered_block_names ) ) {
			$block_name = array_pop( $this->registered_block_names );
			unregister_block_type( $block_name );
		}
	}

	/**
	 * Registers a block type.
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance. In case a WP_Block_Type
	 *                                   is provided, the $args parameter will be ignored.
	 * @param array                $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 */
	protected function register_block_type( $name, $args ) {
		register_block_type( $name, $args );

		$this->registered_block_names[] = $name;
	}

	private function get_attribute_from_block( $attribute, $block ) {
		$pos = strpos( $block, $attribute . '="' );
		$split_arr = substr( $block, $pos + strlen( $attribute ) + 2 );
		$pos2 = strpos( $split_arr, '"' );
		return substr( $split_arr, 0, $pos2 );
	}

	function test_supported_styles_applied_on_render() {
		$block_type_settings = array(
			'attributes' => array(
				'textColor' => array(
					'type' => 'string'
				),
			),
			'supports' => array(
				'__experimentalColor' => true
			),
		);
		$this->register_block_type( 'core/example', $block_type_settings );

		$block = array(
			'blockName'    => 'core/example',
			'attrs'        => array( 'textColor' => 'red' ),
			'innerBlock'   => array(),
			'innerContent' => array(),
			'innerHTML'    => array(),
		);
		$block_content = '<div>So say we all.</div>';

		$styled_block = apply_filters( 'render_block', $block_content, $block );
		$class_list = $this->get_attribute_from_block( 'class', $styled_block );

		$expected_classes = 'has-text-color has-red-color';

		$this->assertEquals( $expected_classes, $class_list );
	}
}
