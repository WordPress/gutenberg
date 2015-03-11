<?php

/**
 * Test avatar related functions
 *
 * @group avatar
 */
class Tests_Avatar extends WP_UnitTestCase {
	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_gravatar_url() {
		$url = get_avatar_url( 1 );
		$this->assertEquals( preg_match( '|^http?://[0-9]+.gravatar.com/avatar/[0-9a-f]{32}\?|', $url ), 1 );
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_size() {
		$url = get_avatar_url( 1 );
		$this->assertEquals( preg_match( '|\?.*s=96|', $url ), 1 );

		$args = array( 'size' => 100 );
		$url = get_avatar_url( 1, $args );
		$this->assertEquals( preg_match( '|\?.*s=100|', $url ), 1 );
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_default() {
		$url = get_avatar_url( 1 );
		$this->assertEquals( preg_match( '|\?.*d=mm|', $url ), 1 );

		$args = array( 'default' => 'wavatar' );
		$url = get_avatar_url( 1, $args );
		$this->assertEquals( preg_match( '|\?.*d=wavatar|', $url ), 1 );

		$this->assertEquals( preg_match( '|\?.*f=y|', $url ), 0 );
		$args = array( 'force_default' => true );
		$url = get_avatar_url( 1, $args );
		$this->assertEquals( preg_match( '|\?.*f=y|', $url ), 1 );
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_rating() {
		$url = get_avatar_url( 1 );
		$this->assertEquals( preg_match( '|\?.*r=g|', $url ), 1 );

		$args = array( 'rating' => 'M' );
		$url = get_avatar_url( 1, $args );
		$this->assertEquals( preg_match( '|\?.*r=m|', $url ), 1 );
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_scheme() {
		$url = get_avatar_url( 1 );
		$this->assertEquals( preg_match( '|^http://|', $url ), 1 );

		$args = array( 'scheme' => 'https' );
		$url = get_avatar_url( 1, $args );
		$this->assertEquals( preg_match( '|^https://|', $url ), 1 );

		$args = array( 'scheme' => 'lolcat' );
		$url = get_avatar_url( 1, $args );
		$this->assertEquals( preg_match( '|^lolcat://|', $url ), 0 );
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_user() {
		$url = get_avatar_url( 1 );

		$url2 = get_avatar_url( WP_TESTS_EMAIL );
		$this->assertEquals( $url, $url2 );

		$url2 = get_avatar_url( md5( WP_TESTS_EMAIL ) . '@md5.gravatar.com' );
		$this->assertEquals( $url, $url2 );

		$user = get_user_by( 'id', 1 );
		$url2 = get_avatar_url( $user );
		$this->assertEquals( $url, $url2 );

		$post_id = $this->factory->post->create( array( 'post_author' => 1 ) );
		$post = get_post( $post_id );
		$url2 = get_avatar_url( $post );
		$this->assertEquals( $url, $url2 );

		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id, 'user_id' => 1 ) );
		$comment = get_comment( $comment_id );
		$url2 = get_avatar_url( $comment );
		$this->assertEquals( $url, $url2 );
	}

	protected $fakeURL;
	/**
	 * @ticket 21195
	 */
	public function test_pre_get_avatar_url_filter() {
		$this->fakeURL = 'haha wat';

		add_filter( 'pre_get_avatar_data', array( $this, 'pre_get_avatar_url_filter' ), 10, 1 );
		$url = get_avatar_url( 1 );
		remove_filter( 'pre_get_avatar_data', array( $this, 'pre_get_avatar_url_filter' ), 10 );

		$this->assertEquals( $url, $this->fakeURL );
	}
	public function pre_get_avatar_url_filter( $args ) {
		$args['url'] = $this->fakeURL;
		return $args;
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_url_filter() {
		$this->fakeURL = 'omg lol';

		add_filter( 'get_avatar_url', array( $this, 'get_avatar_url_filter' ), 10, 1 );
		$url = get_avatar_url( 1 );
		remove_filter( 'get_avatar_url', array( $this, 'get_avatar_url_filter' ), 10 );

		$this->assertEquals( $url, $this->fakeURL );
	}
	public function get_avatar_url_filter( $url ) {
		return $this->fakeURL;
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_comment_types_filter() {
		$url = get_avatar_url( 1 );

		$post_id = $this->factory->post->create( array( 'post_author' => 1 ) );
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id, 'user_id' => 1, 'comment_type' => 'pingback' ) );
		$comment = get_comment( $comment_id );

		$url2 = get_avatar_url( $comment );
		$this->assertFalse( $url2 );

		add_filter( 'get_avatar_comment_types', array( $this, 'get_avatar_comment_types_filter' ), 10, 1 );
		$url2 = get_avatar_url( $comment );
		remove_filter( 'get_avatar_comment_types', array( $this, 'get_avatar_comment_types_filter' ), 10 );

		$this->assertEquals( $url, $url2 );
	}
	public function get_avatar_comment_types_filter( $comment_types ) {
		$comment_types[] = 'pingback';
		return $comment_types;
	}

	public function test_get_avatar() {
		$img = get_avatar( 1 );
		$this->assertEquals( preg_match( "|^<img alt='[^']*' src='[^']*' srcset='[^']*' class='[^']*' height='[^']*' width='[^']*' />$|", $img ), 1 );
	}

	public function test_get_avatar_size() {
		$size = '100';
		$img = get_avatar( 1, $size );
		$this->assertEquals( preg_match( "|^<img .*height='$size'.*width='$size'|", $img ), 1 );
	}

	public function test_get_avatar_alt() {
		$alt = 'Mr Hyde';
		$img = get_avatar( 1, 96, '', $alt );
		$this->assertEquals( preg_match( "|^<img alt='$alt'|", $img ), 1 );
	}

	public function test_get_avatar_class() {
		$class = 'first';
		$img = get_avatar( 1, 96, '', '', array( 'class' => $class ) );
		$this->assertEquals( preg_match( "|^<img .*class='[^']*{$class}[^']*'|", $img ), 1 );
	}

	public function test_get_avatar_default_class() {
		$img = get_avatar( 1, 96, '', '', array( 'force_default' => true ) );
		$this->assertEquals( preg_match( "|^<img .*class='[^']*avatar-default[^']*'|", $img ), 1 );
	}

	public function test_get_avatar_force_display() {
		$old = get_option( 'show_avatars' );
		update_option( 'show_avatars', false );

		$this->assertFalse( get_avatar( 1 ) );

		$this->assertNotEmpty( get_avatar( 1, 96, '', '', array( 'force_display' => true ) ) );

		update_option( 'show_avatars', $old );
	}


	protected $fakeIMG;
	/**
	 * @ticket 21195
	 */
	public function test_pre_get_avatar_filter() {
		$this->fakeIMG = 'YOU TOO?!';

		add_filter( 'pre_get_avatar', array( $this, 'pre_get_avatar_filter' ), 10, 1 );
		$img = get_avatar( 1 );
		remove_filter( 'pre_get_avatar', array( $this, 'pre_get_avatar_filter' ), 10 );

		$this->assertEquals( $img, $this->fakeIMG );
	}
	public function pre_get_avatar_filter( $img ) {
		return $this->fakeIMG;
	}

	/**
	 * @ticket 21195
	 */
	public function test_get_avatar_filter() {
		$this->fakeURL = 'YA RLY';

		add_filter( 'get_avatar', array( $this, 'get_avatar_filter' ), 10, 1 );
		$img = get_avatar( 1 );
		remove_filter( 'get_avatar', array( $this, 'get_avatar_filter' ), 10 );

		$this->assertEquals( $img, $this->fakeURL );
	}
	public function get_avatar_filter( $img ) {
		return $this->fakeURL;
	}

}
