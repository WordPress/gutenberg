<?php
/**
 * Tests for the server-defined widget definitions: the code-registered
 * registry, the `widget_def` CPT (post type, meta, capabilities), and their
 * resolution into `WP_Widget_Type_Registry`.
 *
 * @package gutenberg
 *
 * @group widget-type-composer
 *
 * @covers ::gutenberg_register_widget_def
 * @covers ::gutenberg_get_registered_widget_defs
 * @covers ::gutenberg_register_widget_def_post_type
 * @covers ::gutenberg_register_widget_def_post_meta
 * @covers ::gutenberg_widget_def_synthesize_cap
 */

require_once __DIR__ . '/trait-widget-type-composer-registry-reset.php';

class Gutenberg_Widget_Type_Composer_Widget_Definitions_Test extends WP_UnitTestCase {

	use Widget_Type_Composer_Registry_Reset;

	const SAMPLE_CONTENT = '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->';

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	/**
	 * @var int Subscriber user ID (no special caps).
	 */
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	public function set_up() {
		parent::set_up();
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();

		// WP_UnitTestCase::tear_down() calls unregister_all_meta_keys after every
		// test, wiping the widget_def metas registered on `init`. Re-register them
		// so each test starts with the schema in place.
		gutenberg_register_widget_def_post_meta();
	}

	public function tear_down() {
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();
		parent::tear_down();
	}

	/*
	 * Code-registered origin.
	 */

	public function test_register_widget_def_stores_content_and_metadata() {
		$this->assertTrue(
			gutenberg_register_widget_def(
				'test/full',
				array(
					'title'       => 'Full',
					'description' => 'A full definition.',
					'icon'        => 'admin-plugins',
					'category'    => 'dashboard',
					'content'     => self::SAMPLE_CONTENT,
				)
			)
		);

		$registry = gutenberg_get_registered_widget_defs();
		$this->assertArrayHasKey( 'test/full', $registry );

		$definition = $registry['test/full'];
		$this->assertSame( 'test/full', $definition['name'] );
		$this->assertSame( 'Full', $definition['title'] );
		$this->assertSame( 'A full definition.', $definition['description'] );
		$this->assertSame( 'admin-plugins', $definition['icon'] );
		$this->assertSame( 'dashboard', $definition['category'] );
		$this->assertSame( self::SAMPLE_CONTENT, $definition['content'] );
	}

	public function test_register_widget_def_applies_defaults() {
		gutenberg_register_widget_def( 'test/minimal', array( 'content' => self::SAMPLE_CONTENT ) );

		$definition = gutenberg_get_registered_widget_defs()['test/minimal'];
		$this->assertSame( 'test/minimal', $definition['name'] );
		$this->assertSame( '', $definition['title'] );
		$this->assertSame( '', $definition['description'] );
		$this->assertSame( '', $definition['icon'] );
		$this->assertSame( '', $definition['category'] );
		$this->assertSame( self::SAMPLE_CONTENT, $definition['content'] );
	}

	public function test_register_widget_def_validates_inputs() {
		$this->setExpectedIncorrectUsage( 'gutenberg_register_widget_def' );

		// Empty name fails.
		$this->assertFalse(
			gutenberg_register_widget_def( '', array( 'content' => self::SAMPLE_CONTENT ) )
		);

		// Missing content fails.
		$this->assertFalse(
			gutenberg_register_widget_def( 'test/no-content', array( 'title' => 'No content' ) )
		);

		// Empty content fails.
		$this->assertFalse(
			gutenberg_register_widget_def( 'test/empty-content', array( 'content' => '' ) )
		);

		$registry = gutenberg_get_registered_widget_defs();
		$this->assertArrayNotHasKey( '', $registry );
		$this->assertArrayNotHasKey( 'test/no-content', $registry );
		$this->assertArrayNotHasKey( 'test/empty-content', $registry );
	}

	public function test_register_widget_def_silent_on_identical_args() {
		$args = array(
			'title'   => 'X',
			'content' => self::SAMPLE_CONTENT,
		);

		$this->assertTrue( gutenberg_register_widget_def( 'test/x', $args ) );

		// A second call with identical args must not emit `_doing_it_wrong`;
		// if it did, WP_UnitTestCase::tear_down() would flag the unexpected
		// usage and fail the test. That is the assertion.
		$this->assertTrue( gutenberg_register_widget_def( 'test/x', $args ) );

		$this->assertArrayHasKey( 'test/x', gutenberg_get_registered_widget_defs() );
	}

	public function test_register_widget_def_warns_and_overwrites_on_differing_args() {
		$this->setExpectedIncorrectUsage( 'gutenberg_register_widget_def' );

		gutenberg_register_widget_def(
			'test/x',
			array(
				'title'   => 'First',
				'content' => self::SAMPLE_CONTENT,
			)
		);
		gutenberg_register_widget_def(
			'test/x',
			array(
				'title'   => 'Second',
				'content' => self::SAMPLE_CONTENT,
			)
		);

		$this->assertSame( 'Second', gutenberg_get_registered_widget_defs()['test/x']['title'] );
	}

	public function test_code_registered_def_flows_through_resolver() {
		gutenberg_register_widget_def(
			'test/code-def',
			array(
				'title'       => 'Code def',
				'description' => 'Declared in PHP.',
				'icon'        => 'wordpress/plugins',
				'category'    => 'dashboard',
				'content'     => self::SAMPLE_CONTENT,
			)
		);

		gutenberg_register_widget_types();

		$entry = WP_Widget_Type_Registry::get_instance()->get_registered( 'test/code-def' );

		$this->assertNotNull( $entry );
		$this->assertSame( 'code-registered', $entry->origin );
		$this->assertSame( 'Code def', $entry->title );
		$this->assertSame( 'Declared in PHP.', $entry->description );
		$this->assertSame( 'wordpress/plugins', $entry->icon );
		$this->assertSame( 'dashboard', $entry->category );
		$this->assertSame( self::SAMPLE_CONTENT, $entry->content );

		// Server-defined widget types render through the admin block renderer,
		// not a build module.
		$this->assertNull( $entry->render_module );
		$this->assertNull( $entry->widget_module );
	}

	public function test_earlier_origin_wins_over_code_registered() {
		// Simulate an earlier source (e.g. built-in) already holding the name.
		WP_Widget_Type_Registry::get_instance()->register(
			'test/dup',
			array(
				'origin'        => 'built-in',
				'render_module' => 'wp/widgets/dup/render',
			)
		);

		gutenberg_register_widget_def(
			'test/dup',
			array(
				'title'   => 'Shadowed',
				'content' => self::SAMPLE_CONTENT,
			)
		);

		gutenberg_register_widget_types();

		// The code-registered entry is skipped: the earlier registration stands.
		$entry = WP_Widget_Type_Registry::get_instance()->get_registered( 'test/dup' );
		$this->assertSame( 'built-in', $entry->origin );
		$this->assertSame( 'wp/widgets/dup/render', $entry->render_module );
	}

	/*
	 * CPT origin: the `widget_def` post type.
	 */

	public function test_widget_def_post_type_is_registered() {
		$this->assertTrue( post_type_exists( 'widget_def' ) );

		$post_type = get_post_type_object( 'widget_def' );
		$this->assertNotNull( $post_type );
		$this->assertFalse( $post_type->public );
		$this->assertTrue( $post_type->show_in_rest );
		$this->assertSame( 'widget-defs', $post_type->rest_base );
		$this->assertTrue( $post_type->map_meta_cap );

		$this->assertTrue( post_type_supports( 'widget_def', 'editor' ) );
		$this->assertTrue( post_type_supports( 'widget_def', 'revisions' ) );
		$this->assertTrue( post_type_supports( 'widget_def', 'author' ) );
		$this->assertTrue( post_type_supports( 'widget_def', 'custom-fields' ) );

		// Every primitive cap collapses to manage_widget_definitions; the meta
		// caps (edit_post, read_post, delete_post) are intentionally left alone
		// so map_meta_cap = true can resolve them via ownership.
		$primitives = array(
			'edit_posts',
			'edit_others_posts',
			'edit_published_posts',
			'edit_private_posts',
			'publish_posts',
			'read_private_posts',
			'create_posts',
			'delete_posts',
			'delete_others_posts',
			'delete_published_posts',
			'delete_private_posts',
		);
		foreach ( $primitives as $primitive ) {
			$this->assertSame(
				'manage_widget_definitions',
				$post_type->cap->{$primitive},
				"Primitive cap '$primitive' should alias to manage_widget_definitions"
			);
		}
	}

	public function test_widget_def_meta_fields_are_registered() {
		$keys = get_registered_meta_keys( 'post', 'widget_def' );

		$this->assertArrayHasKey( 'attributes_schema', $keys );
		$this->assertArrayHasKey( 'sources', $keys );
		$this->assertArrayHasKey( 'category', $keys );
		$this->assertArrayHasKey( 'icon', $keys );

		foreach ( array( 'attributes_schema', 'sources', 'category', 'icon' ) as $key ) {
			$this->assertTrue( $keys[ $key ]['single'], "$key should be single" );
			$this->assertNotEmpty( $keys[ $key ]['show_in_rest'], "$key should be show_in_rest" );
		}

		$this->assertSame( array(), $keys['attributes_schema']['default'] );
		$this->assertSame( array(), $keys['sources']['default'] );
		$this->assertSame( '', $keys['category']['default'] );
		$this->assertSame( '', $keys['icon']['default'] );

		// Custom REST schema: attributes_schema items require `id`.
		$attributes_rest_schema = $keys['attributes_schema']['show_in_rest']['schema'];
		$this->assertSame( 'array', $attributes_rest_schema['type'] );
		$this->assertSame( array( 'id' ), $attributes_rest_schema['items']['required'] );

		// Custom REST schema: sources items require `name`.
		$sources_rest_schema = $keys['sources']['show_in_rest']['schema'];
		$this->assertSame( 'array', $sources_rest_schema['type'] );
		$this->assertSame( array( 'name' ), $sources_rest_schema['items']['required'] );
	}

	public function test_widget_def_rest_endpoint_responds() {
		wp_set_current_user( self::$admin_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/widget-defs' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $response->get_data() );
	}

	public function test_widget_def_meta_round_trip() {
		$attributes_schema = array(
			array(
				'id'    => 'postsToShow',
				'type'  => 'integer',
				'label' => 'Posts to show',
			),
		);
		$sources           = array(
			array(
				'name'  => 'core/instance-attribute',
				'label' => 'Instance attributes',
				'args'  => array( 'attribute' => 'postsToShow' ),
			),
		);

		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'widget_def',
				'post_status'  => 'publish',
				'post_title'   => 'Round trip',
				'post_content' => self::SAMPLE_CONTENT,
				'meta_input'   => array(
					'attributes_schema' => $attributes_schema,
					'sources'           => $sources,
					'category'          => 'dashboard',
					'icon'              => 'smiley',
				),
			)
		);

		wp_set_current_user( self::$admin_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/widget-defs/' . $post_id ) );
		$this->assertSame( 200, $response->get_status() );

		$meta = $response->get_data()['meta'];
		$this->assertSame( $attributes_schema, $meta['attributes_schema'] );
		$this->assertSame( $sources, $meta['sources'] );
		$this->assertSame( 'dashboard', $meta['category'] );
		$this->assertSame( 'smiley', $meta['icon'] );
	}

	public function test_widget_def_rest_schema_validates_input() {
		wp_set_current_user( self::$admin_id );

		// 1. Invalid attributes_schema: item missing the required `id`.
		$bad_attrs = new WP_REST_Request( 'POST', '/wp/v2/widget-defs' );
		$bad_attrs->set_header( 'Content-Type', 'application/json' );
		$bad_attrs->set_body(
			wp_json_encode(
				array(
					'title'   => 'Bad attrs',
					'status'  => 'publish',
					'content' => self::SAMPLE_CONTENT,
					'meta'    => array(
						'attributes_schema' => array( array( 'type' => 'integer' ) ),
					),
				)
			)
		);
		$this->assertSame( 400, rest_do_request( $bad_attrs )->get_status() );

		// 2. Invalid sources: item missing the required `name`.
		$bad_src = new WP_REST_Request( 'POST', '/wp/v2/widget-defs' );
		$bad_src->set_header( 'Content-Type', 'application/json' );
		$bad_src->set_body(
			wp_json_encode(
				array(
					'title'   => 'Bad sources',
					'status'  => 'publish',
					'content' => self::SAMPLE_CONTENT,
					'meta'    => array(
						'sources' => array( array( 'label' => 'no name' ) ),
					),
				)
			)
		);
		$this->assertSame( 400, rest_do_request( $bad_src )->get_status() );

		// 3. Valid payload round-trips and returns 201.
		$attributes_schema = array(
			array(
				'id'    => 'count',
				'type'  => 'integer',
				'label' => 'Count',
			),
		);
		$sources           = array( array( 'name' => 'core/instance-attribute' ) );

		$good = new WP_REST_Request( 'POST', '/wp/v2/widget-defs' );
		$good->set_header( 'Content-Type', 'application/json' );
		$good->set_body(
			wp_json_encode(
				array(
					'title'   => 'Good',
					'status'  => 'publish',
					'content' => self::SAMPLE_CONTENT,
					'meta'    => array(
						'attributes_schema' => $attributes_schema,
						'sources'           => $sources,
					),
				)
			)
		);
		$response = rest_do_request( $good );
		$this->assertSame( 201, $response->get_status() );

		$meta = $response->get_data()['meta'];
		$this->assertSame( $attributes_schema, $meta['attributes_schema'] );
		$this->assertSame( $sources, $meta['sources'] );
	}

	public function test_widget_def_cap_synthesized_for_admin() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( current_user_can( 'manage_widget_definitions' ) );

		wp_set_current_user( self::$subscriber_id );
		$this->assertFalse( current_user_can( 'manage_widget_definitions' ) );

		// Unhook the synthesizer: even admin loses the cap.
		remove_filter( 'user_has_cap', 'gutenberg_widget_def_synthesize_cap', 10 );
		wp_set_current_user( self::$admin_id );
		$this->assertFalse( current_user_can( 'manage_widget_definitions' ) );

		// Restore so other tests are unaffected.
		add_filter( 'user_has_cap', 'gutenberg_widget_def_synthesize_cap', 10, 4 );
		$this->assertTrue( current_user_can( 'manage_widget_definitions' ) );
	}

	public function test_admin_passes_create_posts_cap_check() {
		wp_set_current_user( self::$admin_id );
		$post_type = get_post_type_object( 'widget_def' );
		$this->assertTrue( current_user_can( $post_type->cap->create_posts ) );
	}

	public function test_cpt_def_flows_through_resolver() {
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'widget_def',
				'post_status'  => 'publish',
				'post_name'    => 'recent-things',
				'post_title'   => 'Recent things',
				'post_content' => self::SAMPLE_CONTENT,
			)
		);

		gutenberg_register_widget_types();

		$entry = WP_Widget_Type_Registry::get_instance()->get_registered( 'widget-def/recent-things' );

		$this->assertNotNull( $entry );
		$this->assertSame( 'cpt', $entry->origin );
		$this->assertSame( $post_id, $entry->definition_id );
		$this->assertSame( self::SAMPLE_CONTENT, $entry->content );
		$this->assertNull( $entry->render_module );
		$this->assertNull( $entry->widget_module );
	}
}
