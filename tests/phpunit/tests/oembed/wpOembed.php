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

		return $result;
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
}
