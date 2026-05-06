<?php
/**
 * Unit tests covering WP_Widget_Type and WP_Widget_Type_Registry.
 *
 * @package gutenberg
 *
 * @covers WP_Widget_Type
 * @covers WP_Widget_Type_Registry
 */
class WP_Widget_Type_Registry_Test extends WP_UnitTestCase {

	/**
	 * Registry instance under test.
	 *
	 * @var WP_Widget_Type_Registry
	 */
	private $registry;

	public function set_up() {
		parent::set_up();
		$this->reset_singleton();
		$this->registry = WP_Widget_Type_Registry::get_instance();
	}

	public function tear_down() {
		$this->reset_singleton();
		$this->registry = null;
		parent::tear_down();
	}

	/**
	 * Resets the singleton between tests so each test starts with a clean
	 * registry. Mirrors the pattern used by `WP_Test_Icons_Registry_Gutenberg`.
	 */
	private function reset_singleton() {
		$instance_property = new ReflectionProperty( WP_Widget_Type_Registry::class, 'instance' );

		/*
		 * ReflectionProperty::setAccessible is:
		 * - redundant as of 8.1.0, which made all properties accessible
		 * - deprecated as of 8.5.0
		 * - needed until 8.1.0, as `instance` is private.
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}

		$instance_property->setValue( null, null );
	}

	public function test_get_instance_returns_singleton() {
		$a = WP_Widget_Type_Registry::get_instance();
		$b = WP_Widget_Type_Registry::get_instance();

		$this->assertSame( $a, $b );
	}

	public function test_register_returns_widget_type_with_resolved_props() {
		$widget_type = $this->registry->register(
			'test-plugin/my-widget',
			array(
				'render_module' => 'wp/widgets/my-widget/render',
				'widget_module' => 'wp/widgets/my-widget/widget',
			)
		);

		$this->assertInstanceOf( WP_Widget_Type::class, $widget_type );
		$this->assertSame( 'test-plugin/my-widget', $widget_type->name );
		$this->assertSame( 'wp/widgets/my-widget/render', $widget_type->render_module );
		$this->assertSame( 'wp/widgets/my-widget/widget', $widget_type->widget_module );
		$this->assertTrue( $this->registry->is_registered( 'test-plugin/my-widget' ) );
	}

	public function test_register_accepts_widget_type_instance() {
		$widget_type = new WP_Widget_Type(
			'test-plugin/my-widget',
			array( 'render_module' => 'wp/widgets/my-widget/render' )
		);

		$result = $this->registry->register( $widget_type );

		$this->assertSame( $widget_type, $result );
		$this->assertTrue( $this->registry->is_registered( 'test-plugin/my-widget' ) );
	}

	public function test_register_rejects_non_string_name() {
		$this->setExpectedIncorrectUsage( 'WP_Widget_Type_Registry::register' );

		$result = $this->registry->register( array( 'invalid' ) );

		$this->assertFalse( $result );
	}

	public function test_register_rejects_uppercase_name() {
		$this->setExpectedIncorrectUsage( 'WP_Widget_Type_Registry::register' );

		$result = $this->registry->register( 'test-plugin/MyWidget' );

		$this->assertFalse( $result );
	}

	public function test_register_rejects_name_without_namespace() {
		$this->setExpectedIncorrectUsage( 'WP_Widget_Type_Registry::register' );

		$result = $this->registry->register( 'no-namespace' );

		$this->assertFalse( $result );
	}

	public function test_register_rejects_duplicate_name() {
		$this->registry->register( 'test-plugin/my-widget' );

		$this->setExpectedIncorrectUsage( 'WP_Widget_Type_Registry::register' );
		$result = $this->registry->register( 'test-plugin/my-widget' );

		$this->assertFalse( $result );
	}

	public function test_unregister_returns_unregistered_type() {
		$widget_type = $this->registry->register( 'test-plugin/my-widget' );

		$result = $this->registry->unregister( 'test-plugin/my-widget' );

		$this->assertSame( $widget_type, $result );
		$this->assertFalse( $this->registry->is_registered( 'test-plugin/my-widget' ) );
	}

	public function test_unregister_accepts_widget_type_instance() {
		$widget_type = $this->registry->register( 'test-plugin/my-widget' );

		$result = $this->registry->unregister( $widget_type );

		$this->assertSame( $widget_type, $result );
		$this->assertFalse( $this->registry->is_registered( 'test-plugin/my-widget' ) );
	}

	public function test_unregister_rejects_unknown_name() {
		$this->setExpectedIncorrectUsage( 'WP_Widget_Type_Registry::unregister' );

		$result = $this->registry->unregister( 'test-plugin/unknown' );

		$this->assertFalse( $result );
	}

	public function test_get_registered_returns_null_for_unknown_name() {
		$this->assertNull( $this->registry->get_registered( 'test-plugin/unknown' ) );
	}

	public function test_get_registered_returns_instance_for_known_name() {
		$widget_type = $this->registry->register( 'test-plugin/my-widget' );

		$this->assertSame( $widget_type, $this->registry->get_registered( 'test-plugin/my-widget' ) );
	}

	public function test_get_all_registered_returns_keyed_array() {
		$this->registry->register( 'test-plugin/widget-a' );
		$this->registry->register( 'test-plugin/widget-b' );

		$all = $this->registry->get_all_registered();

		$this->assertCount( 2, $all );
		$this->assertArrayHasKey( 'test-plugin/widget-a', $all );
		$this->assertArrayHasKey( 'test-plugin/widget-b', $all );
		$this->assertInstanceOf( WP_Widget_Type::class, $all['test-plugin/widget-a'] );
	}

	public function test_widget_type_is_renderable_when_render_module_present() {
		$widget_type = new WP_Widget_Type(
			'test-plugin/widget',
			array( 'render_module' => 'wp/widgets/widget/render' )
		);

		$this->assertTrue( $widget_type->is_renderable() );
	}

	public function test_widget_type_is_not_renderable_without_render_module() {
		$widget_type = new WP_Widget_Type( 'test-plugin/widget' );

		$this->assertFalse( $widget_type->is_renderable() );
	}

	public function test_widget_type_set_props_passes_through_extra_keys() {
		$widget_type = new WP_Widget_Type(
			'test-plugin/widget',
			array(
				'render_module' => 'handle/render',
				'widget_module' => 'handle/widget',
				'extra'         => 'value',
			)
		);

		$this->assertSame( 'handle/render', $widget_type->render_module );
		$this->assertSame( 'handle/widget', $widget_type->widget_module );
		$this->assertSame( 'value', $widget_type->extra );
	}

	public function test_widget_type_set_props_protects_name_from_overwrite() {
		$widget_type = new WP_Widget_Type(
			'test-plugin/widget',
			array(
				'name'          => 'rogue-plugin/spoofed',
				'render_module' => 'handle/render',
			)
		);

		$this->assertSame( 'test-plugin/widget', $widget_type->name );
		$this->assertSame( 'handle/render', $widget_type->render_module );
	}

	public function test_widget_type_set_props_ignores_non_array_args() {
		$widget_type = new WP_Widget_Type( 'test-plugin/widget', null );

		$this->assertSame( 'test-plugin/widget', $widget_type->name );
		$this->assertNull( $widget_type->render_module );
		$this->assertNull( $widget_type->widget_module );
	}

	public function test_bootstrap_populates_registry_from_manifest() {
		if ( ! function_exists( 'gutenberg_register_widget_types' ) ) {
			$this->markTestSkipped( 'gutenberg_register_widget_types() is not available; the dashboard-widgets experiment must be enabled.' );
		}

		gutenberg_register_widget_types();

		$registered       = $this->registry->get_all_registered();
		$manifest_widgets = function_exists( 'gutenberg_get_registered_widget_modules' )
			? gutenberg_get_registered_widget_modules()
			: array();

		$expected_names = array_filter(
			array_map(
				static function ( $widget ) {
					return $widget['name'] ?? null;
				},
				$manifest_widgets
			)
		);

		foreach ( $expected_names as $name ) {
			$this->assertArrayHasKey( $name, $registered, "Expected $name to be registered from the manifest." );
		}
	}

	public function test_bootstrap_is_idempotent() {
		if ( ! function_exists( 'gutenberg_register_widget_types' ) ) {
			$this->markTestSkipped( 'gutenberg_register_widget_types() is not available; the dashboard-widgets experiment must be enabled.' );
		}

		gutenberg_register_widget_types();
		$first_count = count( $this->registry->get_all_registered() );

		gutenberg_register_widget_types();
		$second_count = count( $this->registry->get_all_registered() );

		$this->assertSame( $first_count, $second_count );
	}
}
