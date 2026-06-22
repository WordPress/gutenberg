<?php
/**
 * Tests for the `core/instance-attribute` block bindings source and the
 * `/wp/v2/widget-defs/render` endpoint that seeds `widget/instanceAttributes`
 * per request.
 *
 * @package gutenberg
 *
 * @group widget-type-composer
 *
 * @covers ::gutenberg_render_widget_def_markup
 * @covers ::gutenberg_instance_attribute_binding_get_value
 */

require_once __DIR__ . '/trait-widget-type-composer-registry-reset.php';

class Gutenberg_Widget_Type_Composer_Instance_Attribute_Test extends WP_UnitTestCase {

	use Widget_Type_Composer_Registry_Reset;

	/**
	 * Composition whose heading `content` is bound to the instance attribute
	 * `name`. The default text shows only when no value is set.
	 *
	 * @var string
	 */
	const BOUND_HEADING = '<!-- wp:heading {"metadata":{"bindings":{"content":{"source":"core/instance-attribute","args":{"field":"name"}}}}} --><h3>Hello, World</h3><!-- /wp:heading -->';

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();
		gutenberg_register_widget_def_post_meta();

		/*
		 * Routes register on `rest_api_init`, which does not fire during the
		 * phpunit bootstrap. Trigger it once per test so the render route is
		 * reachable through `rest_do_request`.
		 */
		do_action( 'rest_api_init' );
	}

	public function tear_down() {
		wp_set_current_user( 0 );
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();
		parent::tear_down();
	}

	/*
	 * Posts to the render route as the administrator. A null `$attributes`
	 * omits the param so the route default applies.
	 */
	private function request_render( $content, $attributes = null ) {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/widget-defs/render' );
		$request->set_param( 'content', $content );
		if ( null !== $attributes ) {
			$request->set_param( 'attributes', $attributes );
		}
		return rest_do_request( $request );
	}

	public function test_instance_attribute_source_is_registered() {
		$sources = get_all_registered_block_bindings_sources();

		$this->assertArrayHasKey( 'core/instance-attribute', $sources );
		$this->assertSame(
			array( 'widget/instanceAttributes' ),
			$sources['core/instance-attribute']->uses_context
		);
	}

	public function test_render_endpoint_seeds_instance_attributes() {
		$marketing = $this->request_render( self::BOUND_HEADING, array( 'name' => 'Marketing' ) );
		$sales     = $this->request_render( self::BOUND_HEADING, array( 'name' => 'Sales' ) );

		$this->assertSame( 200, $marketing->get_status() );
		$this->assertSame( 200, $sales->get_status() );

		$marketing_html = $marketing->get_data()['rendered'];
		$sales_html     = $sales->get_data()['rendered'];

		// The binding replaces the heading content with the instance value.
		$this->assertStringContainsString( 'Marketing', $marketing_html );
		$this->assertStringNotContainsString( 'Hello, World', $marketing_html );

		$this->assertStringContainsString( 'Sales', $sales_html );
		$this->assertStringNotContainsString( 'Hello, World', $sales_html );

		// Same composition, different attributes, different output.
		$this->assertNotSame( $marketing_html, $sales_html );
	}

	public function test_render_endpoint_leaves_default_when_attributes_missing() {
		// Param omitted entirely: the route default seeds an empty context.
		$missing = $this->request_render( self::BOUND_HEADING );
		// Explicit empty attributes: same outcome through a different path.
		$empty = $this->request_render( self::BOUND_HEADING, array() );

		$this->assertSame( 200, $missing->get_status() );
		$this->assertSame( 200, $empty->get_status() );

		// With no value for `name`, the source returns null and the block keeps
		// its default content.
		$this->assertStringContainsString( 'Hello, World', $missing->get_data()['rendered'] );
		$this->assertStringContainsString( 'Hello, World', $empty->get_data()['rendered'] );
	}

	public function test_render_endpoint_empty_content_returns_empty() {
		$response = $this->request_render( '', array( 'name' => 'Marketing' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', $response->get_data()['rendered'] );
	}

	public function test_render_endpoint_requires_read_permission() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'POST', '/wp/v2/widget-defs/render' );
		$request->set_param( 'content', self::BOUND_HEADING );

		$this->assertSame( 401, rest_do_request( $request )->get_status() );
	}

	public function test_cpt_composition_resolves_through_render_endpoint() {
		// A cpt definition carries its composition inline; rendering it through
		// the same endpoint with an instance attribute proves both server-defined
		// origins share one render path.
		self::factory()->post->create(
			array(
				'post_type'    => 'widget_def',
				'post_status'  => 'publish',
				'post_name'    => 'bound-cpt',
				'post_title'   => 'Bound CPT def',
				'post_content' => self::BOUND_HEADING,
			)
		);
		gutenberg_register_widget_types();

		$entry = WP_Widget_Type_Registry::get_instance()->get_registered( 'widget-def/bound-cpt' );
		$this->assertNotNull( $entry );

		$rendered = $this->request_render( $entry->content, array( 'name' => 'Sales' ) );
		$this->assertSame( 200, $rendered->get_status() );
		$this->assertStringContainsString( 'Sales', $rendered->get_data()['rendered'] );
		$this->assertStringNotContainsString( 'Hello, World', $rendered->get_data()['rendered'] );
	}
}
