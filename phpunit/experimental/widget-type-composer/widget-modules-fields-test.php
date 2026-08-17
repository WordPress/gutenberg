<?php
/**
 * Tests that `/wp/v2/widget-modules` carries the server-defined fields
 * (origin, content, definition_id, title, description, icon) per origin, and
 * that the schema declares them.
 *
 * @package gutenberg
 *
 * @group widget-type-composer
 *
 * @covers WP_REST_Widget_Modules_Controller
 */

require_once __DIR__ . '/trait-widget-type-composer-registry-reset.php';

class Gutenberg_Widget_Type_Composer_Widget_Modules_Fields_Test extends WP_UnitTestCase {

	use Widget_Type_Composer_Registry_Reset;

	const SAMPLE_CONTENT = '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->';

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
	}

	public function tear_down() {
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();
		parent::tear_down();
	}

	/**
	 * Fetches `/wp/v2/widget-modules` as an admin, indexed by widget type name.
	 *
	 * @return array Map of `$name => $item`.
	 */
	private function fetch_modules_by_name() {
		wp_set_current_user( self::$admin_id );
		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/widget-modules' ) );
		$this->assertSame( 200, $response->get_status() );

		$by_name = array();
		foreach ( $response->get_data() as $item ) {
			$by_name[ $item['name'] ] = $item;
		}
		return $by_name;
	}

	public function test_code_registered_fields_in_rest() {
		gutenberg_register_widget_def(
			'plugin/meta-check',
			array(
				'title'       => 'Meta check',
				'description' => 'Meta details.',
				'icon'        => 'wordpress/plugins',
				'content'     => self::SAMPLE_CONTENT,
				'actions'     => array(
					array(
						'id'    => 'visit',
						'label' => 'Visit',
						'href'  => 'https://example.com/',
					),
				),
			)
		);
		gutenberg_register_widget_types();

		$by_name = $this->fetch_modules_by_name();

		$this->assertArrayHasKey( 'plugin/meta-check', $by_name );
		$code = $by_name['plugin/meta-check'];
		$this->assertSame( 'code-registered', $code['origin'] );
		$this->assertSame( 'Meta check', $code['title'] );
		$this->assertSame( 'Meta details.', $code['description'] );
		$this->assertSame( 'wordpress/plugins', $code['icon'] );
		$this->assertSame( self::SAMPLE_CONTENT, $code['content'] );
		$this->assertNull( $code['definition_id'] );
		$this->assertCount( 1, $code['actions'] );
		$this->assertSame( 'visit', $code['actions'][0]['id'] );
	}

	public function test_cpt_fields_in_rest() {
		$cpt_post_id = self::factory()->post->create(
			array(
				'post_type'    => 'widget_def',
				'post_status'  => 'publish',
				'post_name'    => 'meta-cpt',
				'post_title'   => 'Meta CPT',
				'post_content' => self::SAMPLE_CONTENT,
			)
		);
		gutenberg_register_widget_types();

		$by_name = $this->fetch_modules_by_name();

		$this->assertArrayHasKey( 'widget-def/meta-cpt', $by_name );
		$cpt = $by_name['widget-def/meta-cpt'];
		$this->assertSame( 'cpt', $cpt['origin'] );
		// CPT title comes from the post_title; content carries the post
		// composition inline; definition_id points at the post.
		$this->assertSame( 'Meta CPT', $cpt['title'] );
		$this->assertSame( self::SAMPLE_CONTENT, $cpt['content'] );
		$this->assertSame( $cpt_post_id, $cpt['definition_id'] );
	}

	public function test_built_in_fields_are_null_in_rest() {
		// Register a built-in widget type directly; the resolver is not needed.
		WP_Widget_Type_Registry::get_instance()->register(
			'test/built-in-rest',
			array(
				'render_module' => 'wp/widgets/built-in-rest/render',
				'origin'        => 'built-in',
			)
		);

		$by_name = $this->fetch_modules_by_name();

		$this->assertArrayHasKey( 'test/built-in-rest', $by_name );
		$item = $by_name['test/built-in-rest'];
		$this->assertSame( 'built-in', $item['origin'] );
		$this->assertNull( $item['title'] );
		$this->assertNull( $item['description'] );
		$this->assertNull( $item['icon'] );
		$this->assertNull( $item['content'] );
		$this->assertNull( $item['definition_id'] );
	}

	public function test_origin_defaults_to_built_in_when_unset() {
		// No origin set at all: the controller defaults it to built-in.
		WP_Widget_Type_Registry::get_instance()->register(
			'test/no-origin',
			array( 'render_module' => 'wp/widgets/no-origin/render' )
		);

		$item = $this->fetch_modules_by_name()['test/no-origin'];
		$this->assertSame( 'built-in', $item['origin'] );
		$this->assertNull( $item['content'] );
	}

	public function test_schema_declares_server_defined_fields() {
		$controller = new WP_REST_Widget_Modules_Controller();
		$props      = $controller->get_item_schema()['properties'];

		foreach ( array( 'origin', 'content', 'definition_id', 'title', 'description', 'icon' ) as $field ) {
			$this->assertArrayHasKey( $field, $props, "Schema should declare '$field'" );
		}

		$this->assertSame( array( 'built-in', 'code-registered', 'cpt' ), $props['origin']['enum'] );
		$this->assertSame( array( 'integer', 'null' ), $props['definition_id']['type'] );
		$this->assertSame( array( 'string', 'null' ), $props['content']['type'] );
	}
}
