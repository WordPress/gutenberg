<?php

/**
 * @group oembed
 */
class Tests_WP_oEmbed extends WP_UnitTestCase {
	/**
	 * @var WP_oEmbed
	 */
	protected $oembed;

	public $pre_oembed_result_filtered = false;

	public function setUp() {
		parent::setUp();

		require_once ABSPATH . WPINC . '/class-oembed.php';
		$this->oembed = _wp_oembed_get_object();

		$this->pre_oembed_result_filtered = false;
	}

	public function _filter_pre_oembed_result( $result ) {
		// If this is not null, the oEmbed result has been filtered before any HTTP requests were made.
		$this->pre_oembed_result_filtered = $result;

		// Return false to prevent HTTP requests during tests.
		return $result ? $result : false;
	}

	public function test_wp_filter_pre_oembed_result_prevents_http_request_for_internal_permalinks() {
		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		$this->assertNotFalse( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
	}

	public function test_wp_filter_pre_oembed_result_prevents_http_request_when_viewing_the_post() {
		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		$this->go_to( $permalink );
		$this->assertQueryTrue( 'is_single', 'is_singular' );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		$this->assertNotFalse( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
	}

	public function test_wp_filter_pre_oembed_result_non_existent_post() {
		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		$this->go_to( $permalink );
		$this->assertQueryTrue( 'is_single', 'is_singular' );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( 'https://example.com/' );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		$this->assertNotFalse( $this->pre_oembed_result_filtered );
		$this->assertFalse( $actual );
	}

	/**
	 * @ticket 40673
	 * @group multisite
	 * @group ms-required
	 */
	public function test_wp_filter_pre_oembed_result_multisite_root_root() {
		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		$this->assertNotNull( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
	}

	/**
	 * @ticket 40673
	 * @group multisite
	 * @group ms-required
	 */
	public function test_wp_filter_pre_oembed_result_multisite_sub_samesub() {
		$user_id = self::factory()->user->create();

		$blog_id = self::factory()->blog->create( array(
			'user_id' => $user_id,
		) );

		switch_to_blog( $blog_id );

		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		restore_current_blog();

		$this->assertNotNull( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
	}

	/**
	 * @ticket 40673
	 * @group multisite
	 * @group ms-required
	 */
	public function test_wp_filter_pre_oembed_result_multisite_sub_othersub() {
		$user_id = self::factory()->user->create();

		$blog_id = self::factory()->blog->create( array(
			'user_id' => $user_id,
		) );

		switch_to_blog( $blog_id );

		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		$blog_id = self::factory()->blog->create( array(
			'user_id' => $user_id,
		) );

		switch_to_blog( $blog_id );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		restore_current_blog();

		$this->assertNotNull( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
	}

	/**
	 * @ticket 40673
	 * @group multisite
	 * @group ms-required
	 */
	public function test_wp_filter_pre_oembed_result_multisite_sub_main() {
		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );
		$user_id   = self::factory()->user->create();
		$blog_id   = self::factory()->blog->create( array(
			'user_id' => $user_id,
		) );

		switch_to_blog( $blog_id );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		restore_current_blog();

		$this->assertNotNull( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
	}

	/**
	 * @ticket 40673
	 * @group multisite
	 * @group ms-required
	 */
	public function test_wp_filter_pre_oembed_result_multisite_preserves_switched_state() {
		$user_id = self::factory()->user->create();

		$blog_id = self::factory()->blog->create( array( 'user_id' => $user_id ) );
		switch_to_blog( $blog_id );

		$expected_stack = $GLOBALS['_wp_switched_stack'];

		$post_id   = self::factory()->post->create();
		$permalink = get_permalink( $post_id );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		$actual_stack = $GLOBALS['_wp_switched_stack'];

		restore_current_blog();

		$this->assertNotNull( $this->pre_oembed_result_filtered );
		$this->assertEquals( $this->pre_oembed_result_filtered, $actual );
		$this->assertSame( $expected_stack, $actual_stack );
	}

	/**
	 * @ticket 40673
	 * @group multisite
	 * @group ms-required
	 */
	public function test_wp_filter_pre_oembed_result_multisite_restores_state_if_no_post_is_found() {
		$current_blog_id = get_current_blog_id();

		$user_id = self::factory()->user->create();
		$blog_id = self::factory()->blog->create( array(
			'user_id' => $user_id,
		) );

		$permalink = get_home_url( $blog_id, '/foo/' );

		add_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );
		$actual = $this->oembed->get_html( $permalink );
		remove_filter( 'pre_oembed_result', array( $this, '_filter_pre_oembed_result' ) );

		$this->assertNull( $this->pre_oembed_result_filtered );
		$this->assertFalse( $actual );
		$this->assertSame( $current_blog_id, get_current_blog_id() );
	}
}
