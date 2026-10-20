<?php
/**
 * Tests for the dashboard default layout filter.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_inject_dashboard_default_layout
 * @covers ::gutenberg_get_dashboard_default_layout
 * @covers ::gutenberg_get_dashboard_default_layout_record
 * @covers ::gutenberg_sanitize_dashboard_layout_geometry
 */
class Gutenberg_Dashboard_Default_Layout_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();
		$this->user_id = self::factory()->user->create();

		// Each test starts with no callbacks so the seed shipped with
		// the experiment does not leak into the test scenarios.
		remove_all_filters( 'gutenberg_dashboard_default_layout' );
		remove_all_filters( 'gutenberg_dashboard_default_layout_geometry' );
	}

	public function tear_down() {
		remove_all_filters( 'gutenberg_dashboard_default_layout' );
		remove_all_filters( 'gutenberg_dashboard_default_layout_geometry' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	private function meta_key() {
		global $wpdb;
		return $wpdb->get_blog_prefix() . 'persisted_preferences';
	}

	public function test_injects_default_when_user_has_no_layout() {
		$default = array(
			array(
				'uuid' => 'a',
				'type' => 'core/quick-draft',
			),
		);
		add_filter(
			'gutenberg_dashboard_default_layout',
			static function () use ( $default ) {
				return $default;
			}
		);

		$value = get_user_meta( $this->user_id, $this->meta_key(), true );

		$this->assertSame( GUTENBERG_DASHBOARD_LAYOUT_GEOMETRY, $value['core/dashboard']['dashboardLayout']['geometry'] );
		$this->assertSame( $default, $value['core/dashboard']['dashboardLayout']['widgets'] );
	}

	public function test_preserves_user_layout_when_already_committed() {
		$committed = array(
			array(
				'uuid' => 'user-1',
				'type' => 'core/site-activity',
			),
		);
		update_user_meta(
			$this->user_id,
			$this->meta_key(),
			array(
				'core/dashboard' => array( 'dashboardLayout' => $committed ),
			)
		);

		add_filter(
			'gutenberg_dashboard_default_layout',
			static function () {
				return array(
					array(
						'uuid' => 'default',
						'type' => 'core/quick-draft',
					),
				);
			}
		);

		$value = get_user_meta( $this->user_id, $this->meta_key(), true );

		$this->assertSame( $committed, $value['core/dashboard']['dashboardLayout'] );
	}

	public function test_no_op_when_no_default_registered() {
		$value = get_user_meta( $this->user_id, $this->meta_key(), true );
		$this->assertEmpty( $value );
	}

	public function test_ignores_other_meta_keys() {
		add_filter(
			'gutenberg_dashboard_default_layout',
			static function () {
				return array(
					array(
						'uuid' => 'a',
						'type' => 'core/quick-draft',
					),
				);
			}
		);

		$value = get_user_meta( $this->user_id, 'some_other_meta', true );
		$this->assertEmpty( $value );
	}

	public function test_preserves_other_preference_scopes() {
		update_user_meta(
			$this->user_id,
			$this->meta_key(),
			array(
				'core/edit-post' => array( 'fixedToolbar' => true ),
			)
		);

		$default = array(
			array(
				'uuid' => 'a',
				'type' => 'core/quick-draft',
			),
		);
		add_filter(
			'gutenberg_dashboard_default_layout',
			static function () use ( $default ) {
				return $default;
			}
		);

		$value = get_user_meta( $this->user_id, $this->meta_key(), true );

		$this->assertSame( $default, $value['core/dashboard']['dashboardLayout']['widgets'] );
		$this->assertSame( true, $value['core/edit-post']['fixedToolbar'] );
	}

	public function test_default_layout_route_returns_the_record() {
		$default = array(
			array(
				'uuid' => 'a',
				'type' => 'core/quick-draft',
			),
		);
		add_filter(
			'gutenberg_dashboard_default_layout',
			static function () use ( $default ) {
				return $default;
			}
		);
		wp_set_current_user( $this->user_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/dashboards/gutenberg_dashboard/default-layout' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'geometry' => GUTENBERG_DASHBOARD_LAYOUT_GEOMETRY,
				'widgets'  => $default,
			),
			$response->get_data()
		);
	}

	public function test_default_layout_route_takes_the_geometry_a_dashboard_declares() {
		add_filter(
			'gutenberg_dashboard_default_layout_geometry',
			static function ( $geometry, $dashboard_name ) {
				return 'acme_dashboard' === $dashboard_name
					? array(
						'columns'   => 12,
						'rowHeight' => 100,
					)
					: $geometry;
			},
			10,
			2
		);
		wp_set_current_user( $this->user_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/dashboards/acme_dashboard/default-layout' ) );
		$data     = $response->get_data();

		$this->assertSame(
			array(
				'columns'   => 12,
				'rowHeight' => 100,
			),
			$data['geometry']
		);
		$this->assertSame( array(), $data['widgets'] );
	}

	public function test_default_layout_route_falls_back_when_a_geometry_is_invalid() {
		add_filter(
			'gutenberg_dashboard_default_layout_geometry',
			static function () {
				return array( 'columns' => 0 );
			}
		);
		wp_set_current_user( $this->user_id );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/dashboards/gutenberg_dashboard/default-layout' ) );

		$this->assertSame( GUTENBERG_DASHBOARD_LAYOUT_GEOMETRY, $response->get_data()['geometry'] );
	}

	public function test_sanitize_dashboard_layout_geometry_requires_positive_tracks() {
		$this->assertSame(
			array(
				'columns'   => 4,
				'rowHeight' => 40,
			),
			gutenberg_sanitize_dashboard_layout_geometry(
				array(
					'columns'   => 4,
					'rowHeight' => 40,
				)
			)
		);
		$this->assertSame(
			array(
				'columns'   => 12,
				'rowHeight' => 32.5,
			),
			gutenberg_sanitize_dashboard_layout_geometry(
				array(
					'columns'   => '12',
					'rowHeight' => '32.5',
				)
			)
		);

		$this->assertNull( gutenberg_sanitize_dashboard_layout_geometry( null ) );
		$this->assertNull( gutenberg_sanitize_dashboard_layout_geometry( array( 'columns' => 4 ) ) );
		$this->assertNull(
			gutenberg_sanitize_dashboard_layout_geometry(
				array(
					'columns'   => 0,
					'rowHeight' => 40,
				)
			)
		);
		$this->assertNull(
			gutenberg_sanitize_dashboard_layout_geometry(
				array(
					'columns'   => 4,
					'rowHeight' => -1,
				)
			)
		);
	}
}
