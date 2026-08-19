<?php
/**
 * Tests for the `widget-def/site-health-counts` dynamic block.
 *
 * @package gutenberg
 *
 * @group widget-type-composer
 *
 * @covers ::gutenberg_render_site_health_counts_block
 * @covers ::gutenberg_get_site_health_counts
 */

class Gutenberg_Widget_Type_Composer_Site_Health_Counts_Block_Test extends WP_UnitTestCase {

	const BLOCK_MARKUP = '<!-- wp:widget-def/site-health-counts /-->';

	const TRANSIENT_KEY = 'health-check-site-status-result';

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
		delete_transient( self::TRANSIENT_KEY );
		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		delete_transient( self::TRANSIENT_KEY );
		parent::tear_down();
	}

	public function test_renders_the_counts_from_the_transient() {
		set_transient(
			self::TRANSIENT_KEY,
			wp_json_encode(
				array(
					'good'        => 15,
					'recommended' => 3,
					'critical'    => 1,
				)
			)
		);

		$rendered = do_blocks( self::BLOCK_MARKUP );

		$this->assertStringContainsString( '15', $rendered );
		$this->assertStringContainsString( 'Should be improved', $rendered );
		$this->assertStringContainsString( 'Critical', $rendered );

		// The render is a core-block composition resolved by a nested
		// `do_blocks()`, not hand-rolled markup.
		$this->assertStringContainsString( 'wp-block-group', $rendered );
		$this->assertStringContainsString( 'wp-block-list', $rendered );
	}

	public function test_casts_string_counts() {
		// Core stores the counts as posted, so they may arrive as strings.
		set_transient(
			self::TRANSIENT_KEY,
			wp_json_encode(
				array(
					'good'        => '12',
					'recommended' => '0',
					'critical'    => '2',
				)
			)
		);

		$this->assertSame(
			array(
				'good'        => 12,
				'recommended' => 0,
				'critical'    => 2,
			),
			gutenberg_get_site_health_counts()
		);
	}

	public function test_renders_the_empty_state_without_results() {
		$rendered = do_blocks( self::BLOCK_MARKUP );

		$this->assertStringContainsString( 'No health check results yet', $rendered );
	}

	public function test_treats_a_malformed_transient_as_no_results() {
		// Valid JSON of the wrong shape: the common failure, not broken JSON.
		set_transient( self::TRANSIENT_KEY, wp_json_encode( array( 'unrelated' => true ) ) );

		$rendered = do_blocks( self::BLOCK_MARKUP );

		$this->assertStringContainsString( 'No health check results yet', $rendered );
	}

	public function test_renders_nothing_below_the_capability() {
		wp_set_current_user( self::$subscriber_id );
		set_transient(
			self::TRANSIENT_KEY,
			wp_json_encode(
				array(
					'good'        => 15,
					'recommended' => 3,
					'critical'    => 1,
				)
			)
		);

		$this->assertSame( '', do_blocks( self::BLOCK_MARKUP ) );
	}
}
