<?php

/**
 * @group rewrite
 */
class Tests_Rewrite_OldDateRedirect extends WP_UnitTestCase {
	protected $old_date_redirect_url;

	public static $post_id;

	public static $attachment_id;

	public static function wpSetUpBeforeClass() {
		self::$post_id = self::factory()->post->create( array(
			'post_title' => 'Foo Bar',
			'post_name'  => 'foo-bar',
		) );

		self::$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => DIR_TESTDATA . '/images/canola.jpg',
				'post_mime_type' => 'image/jpeg',
				'post_name'      => 'my-attachment',
				'post_parent'    => self::$post_id,
			)
		);
	}

	public function setUp() {
		parent::setUp();

		add_filter( 'old_slug_redirect_url', array( $this, 'filter_old_date_redirect_url' ), 10, 1 );

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		add_rewrite_endpoint( 'custom-endpoint', EP_PERMALINK );
		add_rewrite_endpoint( 'second-endpoint', EP_PERMALINK, 'custom' );

		flush_rewrite_rules();
	}

	public function tearDown() {
		parent::tearDown();

		$this->old_date_redirect_url = null;
	}

	public function test_old_date_redirect() {
		$old_permalink = user_trailingslashit( get_permalink( self::$post_id ) );

		$time = '2004-01-03 00:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
		) );

		$permalink = user_trailingslashit( get_permalink( self::$post_id ) );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertSame( $permalink, $this->old_date_redirect_url );
	}

	public function test_old_date_slug_redirect() {
		$old_permalink = user_trailingslashit( get_permalink( self::$post_id ) );

		$time = '2004-01-03 00:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
			'post_name'     => 'bar-baz',
		) );

		$permalink = user_trailingslashit( get_permalink( self::$post_id ) );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertSame( $permalink, $this->old_date_redirect_url );
	}

	public function test_old_date_redirect_attachment() {
		$old_permalink = get_attachment_link( self::$attachment_id );

		$time = '2004-01-03 00:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
		) );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertNull( $this->old_date_redirect_url );
		$this->assertQueryTrue( 'is_attachment', 'is_singular', 'is_single' );

		$old_permalink = get_attachment_link( self::$attachment_id );

		wp_update_post( array(
			'ID'        => self::$attachment_id,
			'post_name' => 'the-attachment',
		) );

		$permalink = user_trailingslashit( trailingslashit( get_permalink( self::$post_id ) ) . 'the-attachment' );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertSame( $permalink, $this->old_date_redirect_url );
	}

	public function test_old_date_slug_redirect_attachment() {
		$old_permalink = get_attachment_link( self::$attachment_id );

		$time = '2004-01-03 00:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
			'post_name'     => 'bar-baz',
		) );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertNull( $this->old_date_redirect_url );
		$this->assertQueryTrue( 'is_attachment', 'is_singular', 'is_single' );

		$old_permalink = get_attachment_link( self::$attachment_id );

		wp_update_post( array(
			'ID'        => self::$attachment_id,
			'post_name' => 'the-attachment',
		) );

		$permalink = user_trailingslashit( trailingslashit( get_permalink( self::$post_id ) ) . 'the-attachment' );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertSame( $permalink, $this->old_date_redirect_url );
	}

	public function test_old_date_redirect_paged() {
		wp_update_post( array(
			'ID'           => self::$post_id,
			'post_content' => 'Test<!--nextpage-->Test',
		) );

		$old_permalink = user_trailingslashit( trailingslashit( get_permalink( self::$post_id ) ) . 'page/2' );

		$time = '2004-01-03 00:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
		) );

		$permalink = user_trailingslashit( trailingslashit( get_permalink( self::$post_id ) ) . 'page/2' );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertSame( $permalink, $this->old_date_redirect_url );
	}

	public function test_old_date_slug_redirect_paged() {
		wp_update_post( array(
			'ID'           => self::$post_id,
			'post_content' => 'Test<!--nextpage-->Test',
		) );

		$old_permalink = user_trailingslashit( trailingslashit( get_permalink( self::$post_id ) ) . 'page/2' );

		$time = '2004-01-04 12:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
			'post_name'     => 'bar-baz',
		) );

		$permalink = user_trailingslashit( trailingslashit( get_permalink( self::$post_id ) ) . 'page/2' );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertSame( $permalink, $this->old_date_redirect_url );
	}

	public function test_old_date_slug_doesnt_redirect_when_reused() {
		$old_permalink = user_trailingslashit( get_permalink( self::$post_id ) );

		$time = '2004-01-04 12:00:00';
		wp_update_post( array(
			'ID'            => self::$post_id,
			'post_date'     => $time,
			'post_date_gmt' => get_gmt_from_date( $time ),
			'post_name'     => 'bar-baz',
		) );

		$new_post_id = self::factory()->post->create( array(
			'post_title' => 'Foo Bar',
			'post_name'  => 'foo-bar',
		) );

		$permalink = user_trailingslashit( get_permalink( $new_post_id ) );

		$this->assertSame( $old_permalink, $permalink );

		$this->go_to( $old_permalink );
		wp_old_slug_redirect();
		$this->assertNull( $this->old_date_redirect_url );
	}

	public function filter_old_date_redirect_url( $url ) {
		$this->old_date_redirect_url = $url;
		return false;
	}
}
