<?php
/**
 * Tests for enqueueing additional block view scripts.
 *
 * @package gutenberg
 */

/**
 * @group blocks
 * @group script-loader
 * @covers ::wp_enqueue_block_view_script
 */
class Tests_Blocks_Enqueue_Block_View_Script extends WP_UnitTestCase {

	/**
	 * Original scripts registry.
	 *
	 * @var WP_Scripts|null
	 */
	private $original_wp_scripts;

	/**
	 * Sets up the block types and an isolated scripts registry.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts']     = new WP_Scripts();

		register_block_type( 'tests/view-script' );
		register_block_type( 'tests/other' );
	}

	/**
	 * Restores the scripts registry and unregisters the test blocks.
	 */
	public function tear_down() {
		unregister_block_type( 'tests/view-script' );
		unregister_block_type( 'tests/other' );

		$GLOBALS['wp_scripts'] = $this->original_wp_scripts;

		parent::tear_down();
	}

	/**
	 * Registers and enqueues a script using array or query-string arguments.
	 *
	 * @dataProvider data_registration_argument_formats
	 *
	 * @param bool $query_string Whether to pass the arguments as a query string.
	 */
	public function test_supports_script_registration_arguments( $query_string ) {
		$src  = includes_url( 'test-view.js' );
		$args = array(
			'handle'    => 'test-view-script',
			'src'       => $src,
			'deps'      => array( 'wp-dom-ready' ),
			'ver'       => '1.2.3',
			'in_footer' => array(
				'in_footer' => true,
				'strategy'  => 'defer',
			),
		);

		wp_enqueue_block_view_script(
			'tests/view-script',
			$query_string ? http_build_query( $args ) : $args
		);

		$this->assertFalse( wp_script_is( 'test-view-script', 'registered' ) );

		$this->render_test_block();

		$this->assertTrue( wp_script_is( 'test-view-script' ) );
		$script = wp_scripts()->registered['test-view-script'];
		$this->assertSame( $src, $script->src );
		$this->assertSame( array( 'wp-dom-ready' ), $script->deps );
		$this->assertSame( '1.2.3', $script->ver );
		$this->assertSame( 1, wp_scripts()->get_data( 'test-view-script', 'group' ) );
		$this->assertSame( 'defer', wp_scripts()->get_data( 'test-view-script', 'strategy' ) );
	}

	/**
	 * Enqueues an existing script without changing its registration or attached data.
	 */
	public function test_preserves_registered_script_with_handle_argument() {
		wp_register_script(
			'test-view-script',
			includes_url( 'test-view.js' ),
			array( 'wp-dom-ready' ),
			'1.2.3',
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);
		wp_add_inline_script( 'test-view-script', 'window.testViewScript = true;' );
		wp_set_script_translations( 'test-view-script', 'gutenberg', GUTENBERG_DIR_TESTDATA . 'languages' );
		$script = clone wp_scripts()->registered['test-view-script'];

		wp_enqueue_block_view_script( 'tests/view-script', 'test-view-script' );
		$this->render_test_block();

		$this->assertTrue( wp_script_is( 'test-view-script' ) );
		$this->assertEquals( $script, wp_scripts()->registered['test-view-script'] );
	}

	/**
	 * Does not enqueue the script until the matching block is rendered.
	 *
	 * @dataProvider data_script_arguments
	 *
	 * @param string|array $args Script handle, argument array, or query string.
	 */
	public function test_only_enqueues_script_when_target_block_is_rendered( $args ) {
		wp_register_script( 'test-view-script', includes_url( 'test-view.js' ) );
		wp_enqueue_block_view_script( 'tests/view-script', $args );

		$this->assertFalse( wp_script_is( 'test-view-script' ) );
		$this->render_test_block( 'tests/other' );
		$this->assertFalse( wp_script_is( 'test-view-script' ) );

		$this->render_test_block();
		$this->assertTrue( wp_script_is( 'test-view-script' ) );
	}

	/**
	 * Allows the helper to be called before or after the block is registered.
	 *
	 * @dataProvider data_block_registration_order
	 *
	 * @param bool $register_first Whether to register the block before calling the helper.
	 */
	public function test_can_be_called_before_or_after_block_registration( $register_first ) {
		unregister_block_type( 'tests/view-script' );
		wp_register_script( 'test-view-script', includes_url( 'test-view.js' ) );

		if ( $register_first ) {
			register_block_type( 'tests/view-script' );
		}

		wp_enqueue_block_view_script( 'tests/view-script', 'test-view-script' );

		if ( ! $register_first ) {
			register_block_type( 'tests/view-script' );
		}

		$this->render_test_block();
		$this->assertTrue( wp_script_is( 'test-view-script' ) );
	}

	/**
	 * Prints a script once even when the helper and block are used repeatedly.
	 *
	 * @dataProvider data_script_arguments
	 *
	 * @param string|array $args Script handle, argument array, or query string.
	 */
	public function test_prints_script_once_for_repeated_calls_and_block_instances( $args ) {
		wp_register_script( 'test-view-script', includes_url( 'test-view.js' ) );
		wp_enqueue_block_view_script( 'tests/view-script', $args );
		wp_enqueue_block_view_script( 'tests/view-script', $args );

		$this->render_test_block();
		$this->render_test_block();

		$output = get_echo( 'wp_print_scripts' );
		$this->assertSame( 1, substr_count( $output, 'id="test-view-script-js"' ) );
	}

	/**
	 * Provides the supported ways of passing a registered script to the helper.
	 *
	 * @return array Script arguments.
	 */
	public function data_script_arguments() {
		return array(
			'handle'       => array( 'test-view-script' ),
			'array'        => array( array( 'handle' => 'test-view-script' ) ),
			'query string' => array( 'handle=test-view-script' ),
		);
	}

	/**
	 * Provides formats for passing script registration arguments.
	 *
	 * @return array Argument formats.
	 */
	public function data_registration_argument_formats() {
		return array(
			'array'        => array( false ),
			'query string' => array( true ),
		);
	}

	/**
	 * Provides both block registration orders.
	 *
	 * @return array Block registration orders.
	 */
	public function data_block_registration_order() {
		return array(
			'before registration' => array( false ),
			'after registration'  => array( true ),
		);
	}

	/**
	 * Renders a non-empty static block through the normal rendering pipeline.
	 *
	 * @param string $block_name Block name.
	 */
	private function render_test_block( $block_name = 'tests/view-script' ) {
		$content = '<p>Block content</p>';

		$this->assertSame(
			$content,
			render_block(
				array(
					'blockName'    => $block_name,
					'attrs'        => array(),
					'innerBlocks'  => array(),
					'innerHTML'    => $content,
					'innerContent' => array( $content ),
				)
			)
		);
	}
}
