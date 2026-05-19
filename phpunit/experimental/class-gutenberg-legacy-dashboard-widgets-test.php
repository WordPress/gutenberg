<?php
/**
 * Unit tests for legacy dashboard widget bridging.
 *
 * @package gutenberg
 *
 * @covers gutenberg_legacy_dashboard_widget_type_name
 * @covers gutenberg_register_legacy_dashboard_widget_types
 */
class Gutenberg_Legacy_Dashboard_Widgets_Test extends WP_UnitTestCase {

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
	 * Resets the registry singleton between tests.
	 */
	private function reset_singleton() {
		$instance_property = new ReflectionProperty( WP_Widget_Type_Registry::class, 'instance' );

		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}

		$instance_property->setValue( null, null );
	}

	public function test_legacy_dashboard_widget_type_name_normalizes_ids() {
		$this->assertSame(
			'wp-legacy/dashboard-primary',
			gutenberg_legacy_dashboard_widget_type_name( 'dashboard_primary' )
		);
	}

	public function test_register_legacy_dashboard_widget_types_registers_meta_boxes() {
		if ( ! function_exists( 'gutenberg_register_legacy_dashboard_widget_types' ) ) {
			$this->markTestSkipped( 'Legacy dashboard widgets are not loaded.' );
		}

		set_current_screen( 'dashboard' );

		wp_add_dashboard_widget(
			'gutenberg_test_legacy_widget',
			'Test Legacy Widget',
			static function () {
				echo '<p>Legacy widget content</p>';
			}
		);

		gutenberg_register_legacy_dashboard_widget_types();

		$name = gutenberg_legacy_dashboard_widget_type_name( 'gutenberg_test_legacy_widget' );
		$type = $this->registry->get_registered( $name );

		$this->assertNotNull( $type );
		$this->assertSame( 'gutenberg_test_legacy_widget', $type->legacy_id );
		$this->assertSame( 'Test Legacy Widget', $type->title );
		$this->assertSame(
			gutenberg_get_legacy_dashboard_render_module(),
			$type->render_module
		);
	}
}
