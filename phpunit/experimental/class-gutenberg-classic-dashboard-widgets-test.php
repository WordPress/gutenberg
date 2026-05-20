<?php
/**
 * Unit tests for classic dashboard widget bridging.
 *
 * @package gutenberg
 *
 * @covers gutenberg_classic_dashboard_widget_type_name
 * @covers gutenberg_register_classic_dashboard_widget_types
 * @covers gutenberg_register_core_dashboard_widgets_for_discovery
 */
class Gutenberg_Classic_Dashboard_Widgets_Test extends WP_UnitTestCase {

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

	public function test_classic_dashboard_widget_type_name_normalizes_ids() {
		$this->assertSame(
			'wp-classic/dashboard-primary',
			gutenberg_classic_dashboard_widget_type_name( 'dashboard_primary' )
		);
	}

	public function test_register_core_dashboard_widgets_for_discovery_registers_glance_and_activity() {
		if ( ! function_exists( 'gutenberg_register_core_dashboard_widgets_for_discovery' ) ) {
			$this->markTestSkipped( 'Classic dashboard widgets are not loaded.' );
		}

		global $wp_meta_boxes;

		$wp_meta_boxes = array();

		set_current_screen( 'dashboard' );

		gutenberg_register_core_dashboard_widgets_for_discovery();

		$this->assertArrayHasKey( 'dashboard', $wp_meta_boxes );
		$this->assertArrayHasKey( 'dashboard_activity', $wp_meta_boxes['dashboard']['normal']['core'] );

		if ( current_user_can( 'edit_posts' ) ) {
			$this->assertArrayHasKey( 'dashboard_right_now', $wp_meta_boxes['dashboard']['normal']['core'] );
		}
	}

	public function test_register_classic_dashboard_widget_types_registers_meta_boxes() {
		if ( ! function_exists( 'gutenberg_register_classic_dashboard_widget_types' ) ) {
			$this->markTestSkipped( 'Classic dashboard widgets are not loaded.' );
		}

		set_current_screen( 'dashboard' );

		wp_add_dashboard_widget(
			'gutenberg_test_classic_widget',
			'Test Classic Widget',
			static function () {
				echo '<p>Classic widget content</p>';
			}
		);

		gutenberg_register_classic_dashboard_widget_types();

		$name = gutenberg_classic_dashboard_widget_type_name( 'gutenberg_test_classic_widget' );
		$type = $this->registry->get_registered( $name );

		$this->assertNotNull( $type );
		$this->assertSame( 'gutenberg_test_classic_widget', $type->classic_id );
		$this->assertSame( 'Test Classic Widget', $type->title );
		$this->assertSame(
			gutenberg_get_classic_dashboard_render_module(),
			$type->render_module
		);
	}
}
