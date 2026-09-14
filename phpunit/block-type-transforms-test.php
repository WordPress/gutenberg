<?php
/**
 * Tests for the `transforms` field of block types on the WordPress versions
 * that do not carry it themselves.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_register_block_transforms_from_metadata
 * @covers ::gutenberg_add_declared_block_transforms
 * @covers ::gutenberg_bootstrap_block_transforms
 * @covers ::gutenberg_prepare_transforms_for_editor
 * @covers ::gutenberg_remove_transform_objects
 * @covers ::gutenberg_register_block_type_transforms_rest_field
 * @covers ::gutenberg_get_block_type_transforms_for_rest
 */
class Gutenberg_Block_Type_Transforms_Test extends WP_Test_REST_TestCase {
	/**
	 * Administrator the REST requests run as.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Names of the block types registered for a single test.
	 *
	 * @var string[]
	 */
	private $registered = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function tear_down() {
		foreach ( $this->registered as $block_name ) {
			unregister_block_type( $block_name );
		}

		$this->registered = array();

		parent::tear_down();
	}

	/**
	 * Registers a block type for the duration of a single test.
	 *
	 * @param string $block_name Block name.
	 * @param array  $settings   Block type settings.
	 * @return void
	 */
	private function register( $block_name, $settings ) {
		register_block_type( $block_name, $settings );
		$this->registered[] = $block_name;
	}

	/**
	 * Fetches a block type over REST as the administrator.
	 *
	 * @param string $block_name Block name.
	 * @param array  $params     Optional. Request parameters.
	 * @return array Response data.
	 */
	private function get_block_type( $block_name, $params = array() ) {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/block-types/' . $block_name );
		foreach ( $params as $name => $value ) {
			$request->set_param( $name, $value );
		}

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		return $response->get_data();
	}

	/**
	 * A declaration mixing what JSON can carry with what only PHP can run.
	 *
	 * @return array Transforms declaration.
	 */
	private function declaration_with_callables() {
		return array(
			'from' => array(
				array(
					'type'       => 'raw',
					'selector'   => 'p:has(> img)',
					'schema'     => 'my_plugin_content_schema',
					'isMatch'    => static function () {
						return true;
					},
					'attributes' => array(
						'url' => array(
							'source'    => 'attribute',
							'selector'  => 'img',
							'attribute' => 'src',
						),
						'alt' => array(
							'source'    => 'attribute',
							'selector'  => 'img',
							'attribute' => 'alt',
							'shortcode' => static function () {
								return '';
							},
						),
					),
				),
				array(
					'type'      => 'enter',
					'regExp'    => '/^-{3,}$/',
					'transform' => static function () {
						return array();
					},
				),
				array(
					'type'      => 'files',
					'transform' => static function () {
						return array();
					},
				),
				array(
					'type'      => 'prefix',
					'prefix'    => '>',
					'transform' => static function () {
						return array();
					},
				),
				array(
					'type'       => 'shortcode',
					'tag'        => 'caption',
					'attributes' => array(
						'content' => array(
							'type'      => 'string',
							'shortcode' => static function () {
								return '';
							},
						),
					),
				),
				'not a transform',
			),
			'to'   => array(
				array(
					'type'      => 'block',
					'blocks'    => array( 'core/paragraph' ),
					'isMatch'   => static function () {
						return true;
					},
					'transform' => static function () {
						return array();
					},
				),
			),
		);
	}

	/**
	 * Asserts a declaration came out as the editor can read it.
	 *
	 * @param array $transforms Prepared transforms.
	 * @return void
	 */
	private function assert_prepared( $transforms ) {
		$this->assertSame( array( 'from', 'to' ), array_keys( $transforms ) );
		$this->assertSame( array( 0, 1 ), array_keys( $transforms['from'] ), 'Dropped entries leave no gaps behind them.' );

		$raw = $transforms['from'][0];
		$this->assertSame( 'raw', $raw['type'] );
		$this->assertSame( 'p:has(> img)', $raw['selector'] );
		$this->assertArrayNotHasKey( 'isMatch', $raw );
		$this->assertArrayNotHasKey( 'schema', $raw, 'A string names a PHP callable, which stays on the server.' );
		$this->assertSame(
			array(
				'source'    => 'attribute',
				'selector'  => 'img',
				'attribute' => 'src',
			),
			$raw['attributes']['url']
		);
		$this->assertSame(
			array(
				'source'    => 'attribute',
				'selector'  => 'img',
				'attribute' => 'alt',
			),
			$raw['attributes']['alt']
		);

		$shortcode = $transforms['from'][1];
		$this->assertSame( 'shortcode', $shortcode['type'] );
		$this->assertSame( array( 'type' => 'string' ), $shortcode['attributes']['content'] );

		$this->assertSame(
			array(
				array(
					'type'   => 'block',
					'blocks' => array( 'core/paragraph' ),
				),
			),
			$transforms['to']
		);
	}

	public function test_prepares_transforms_the_editor_can_read() {
		$prepared = gutenberg_prepare_transforms_for_editor( $this->declaration_with_callables() );

		$this->assert_prepared( $prepared );
		$this->assertSame( $prepared, json_decode( wp_json_encode( $prepared ), true ), 'Nothing is left that JSON cannot carry.' );
	}

	public function test_prepare_keeps_a_declared_schema_and_ignores_what_is_not_a_list() {
		$schema   = array( 'aside' => array( 'children' => 'phrasing' ) );
		$prepared = gutenberg_prepare_transforms_for_editor(
			array(
				'from' => array(
					array(
						'type'     => 'raw',
						'selector' => 'aside',
						'schema'   => $schema,
					),
				),
				'to'   => 'not a list',
			)
		);

		$this->assertSame( $schema, $prepared['from'][0]['schema'] );
		$this->assertSame( 'not a list', $prepared['to'] );
	}

	public function test_removes_objects_anywhere_in_transform_data() {
		$value = array(
			'keep'    => 'yes',
			'closure' => static function () {
				return true;
			},
			'nested'  => array(
				'object' => new stdClass(),
				'list'   => array(
					1,
					static function () {
						return true;
					},
					3,
				),
				'scalar' => 2,
			),
		);

		$this->assertSame(
			array(
				'keep'   => 'yes',
				'nested' => array(
					'list'   => array( 1, 3 ),
					'scalar' => 2,
				),
			),
			gutenberg_remove_transform_objects( $value )
		);
	}

	public function test_keeps_transforms_registered_from_php_over_declared_ones() {
		$registered = array(
			'from' => array(
				array(
					'type'     => 'raw',
					'selector' => 'aside',
					'isMatch'  => static function () {
						return true;
					},
				),
			),
		);
		$declared   = array(
			'from' => array(
				array(
					'type'     => 'raw',
					'selector' => 'aside',
				),
			),
		);

		// The arguments passed to `register_block_type()` are merged over the
		// metadata before the filter runs, as they are for every other field.
		$settings = gutenberg_add_declared_block_transforms( array( 'transforms' => $registered ), array( 'transforms' => $declared ) );

		$this->assertSame( $registered, $settings['transforms'] );

		$settings = gutenberg_add_declared_block_transforms( array(), array( 'transforms' => $declared ) );

		$this->assertSame( $declared, $settings['transforms'] );
	}

	public function test_reads_declared_transforms_from_block_json() {
		$block_type         = register_block_type_from_metadata( __DIR__ . '/fixtures/block-transforms' );
		$this->registered[] = 'test/declared-transforms';

		$this->assertInstanceOf( 'WP_Block_Type', $block_type );
		$this->assertSame(
			array(
				'from' => array(
					array(
						'type'     => 'raw',
						'selector' => 'aside',
						'priority' => 2,
					),
				),
			),
			$block_type->transforms
		);
	}

	public function test_bootstraps_declared_transforms_for_the_editor() {
		if ( property_exists( 'WP_Block_Type', 'transforms' ) ) {
			$this->markTestSkipped( 'WordPress sends the field in its own bootstrap.' );
		}

		$this->register( 'test/bootstrapped', array( 'transforms' => $this->declaration_with_callables() ) );
		$this->register( 'test/silent', array( 'title' => 'Declares nothing' ) );

		$scripts = wp_scripts();
		if ( ! $scripts->query( 'wp-blocks', 'registered' ) ) {
			$scripts->add( 'wp-blocks', false );
		}
		$before = $scripts->get_data( 'wp-blocks', 'after' );

		gutenberg_bootstrap_block_transforms();

		$after = $scripts->get_data( 'wp-blocks', 'after' );
		if ( false === $before ) {
			unset( $scripts->registered['wp-blocks']->extra['after'] );
		} else {
			$scripts->add_data( 'wp-blocks', 'after', $before );
		}

		$this->assertIsArray( $after );

		$script = end( $after );
		$prefix = 'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(';
		$this->assertStringStartsWith( $prefix, $script );
		$this->assertStringEndsWith( ');', $script );
		$this->assertStringNotContainsString( '<', $script, 'An angle bracket could end the inline script early.' );
		$this->assertStringNotContainsString( '>', $script );

		$definitions = json_decode( substr( $script, strlen( $prefix ), -2 ), true );

		$this->assertIsArray( $definitions );
		$this->assertArrayHasKey( 'test/bootstrapped', $definitions );
		$this->assertArrayNotHasKey( 'test/silent', $definitions, 'A block declaring nothing adds nothing to the payload.' );
		$this->assertSame( array( 'transforms' ), array_keys( $definitions['test/bootstrapped'] ) );
		$this->assert_prepared( $definitions['test/bootstrapped']['transforms'] );
	}

	public function test_rest_response_carries_declared_transforms() {
		$declared = array(
			'from' => array(
				array(
					'type'     => 'raw',
					'selector' => 'aside',
					'priority' => 2,
					'schema'   => array( 'aside' => array( 'children' => 'phrasing' ) ),
				),
			),
			'to'   => array(
				array(
					'type'   => 'block',
					'blocks' => array( 'core/paragraph' ),
				),
			),
		);
		$this->register(
			'test/declared',
			array(
				'title'      => 'Declared',
				'transforms' => $declared,
			)
		);
		$this->register( 'test/silent', array( 'title' => 'Declares nothing' ) );

		$this->assertSame( $declared, $this->get_block_type( 'test/declared' )['transforms'] );

		$data = $this->get_block_type( 'test/silent' );
		$this->assertArrayHasKey( 'transforms', $data );
		$this->assertNull( $data['transforms'] );
	}

	public function test_rest_response_keeps_what_the_editor_can_read() {
		if ( property_exists( 'WP_Block_Type', 'transforms' ) ) {
			$this->markTestSkipped( 'WordPress prepares the field itself.' );
		}

		$this->register(
			'test/callables',
			array(
				'title'      => 'Callables',
				'transforms' => $this->declaration_with_callables(),
			)
		);

		$this->assert_prepared( $this->get_block_type( 'test/callables' )['transforms'] );
	}

	public function test_rest_fields_can_select_transforms_alone() {
		$declared = array(
			'from' => array(
				array(
					'type'     => 'raw',
					'selector' => 'aside',
				),
			),
		);
		$this->register(
			'test/declared',
			array(
				'title'      => 'Declared',
				'transforms' => $declared,
			)
		);

		$data = $this->get_block_type( 'test/declared', array( '_fields' => 'transforms' ) );

		$this->assertSame( array( 'transforms' => $declared ), $data );
	}

	public function test_rest_schema_describes_transforms() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/block-types' );
		$response = rest_get_server()->dispatch( $request );
		$schema   = $response->get_data()['schema']['properties'];

		$this->assertArrayHasKey( 'transforms', $schema );
		$this->assertSame( array( 'object', 'null' ), $schema['transforms']['type'] );
		$this->assertSame( array( 'from', 'to' ), array_keys( $schema['transforms']['properties'] ) );
		$this->assertSame( array( 'embed', 'view', 'edit' ), $schema['transforms']['context'] );
	}
}
