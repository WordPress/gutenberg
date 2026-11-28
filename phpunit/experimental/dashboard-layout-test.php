<?php
/**
 * Tests for the dashboard default layout filter.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_inject_dashboard_default_layout
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
	}

	public function tear_down() {
		remove_all_filters( 'gutenberg_dashboard_default_layout' );
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

		$this->assertSame( $default, $value['core/dashboard']['dashboardLayout'] );
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

		$this->assertSame( $default, $value['core/dashboard']['dashboardLayout'] );
		$this->assertSame( true, $value['core/edit-post']['fixedToolbar'] );
	}
}
