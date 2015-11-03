<?php
/**
 * @group link
 */
class Tests_Link extends WP_UnitTestCase {

	function _get_pagenum_link_cb( $url ) {
		return $url . '/WooHoo';
	}

	/**
	 * @ticket 8847
	 */
	function test_get_pagenum_link_case_insensitivity() {
		$old_req_uri = $_SERVER['REQUEST_URI'];

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		add_filter( 'home_url', array( $this, '_get_pagenum_link_cb' ) );
		$_SERVER['REQUEST_URI'] = '/woohoo';
		$paged = get_pagenum_link( 2 );

		remove_filter( 'home_url', array( $this, '_get_pagenum_link_cb' ) );
		$this->assertEquals( $paged, home_url( '/WooHoo/page/2/' ) );

		$_SERVER['REQUEST_URI'] = $old_req_uri;
	}

	function test_wp_get_shortlink() {
		$post_id = self::factory()->post->create();
		$post_id2 = self::factory()->post->create();

		// Basic case
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		unset( $GLOBALS['post'] );

		// Global post is not set
		$this->assertEquals( '', wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( '', wp_get_shortlink( 0 ) );
		$this->assertEquals( '', wp_get_shortlink() );

		$GLOBALS['post'] = get_post( $post_id );

		// Global post is set
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink( 0 ) );
		$this->assertEquals( get_permalink( $post_id ), wp_get_shortlink() );

		// Not the global post
		$this->assertEquals( get_permalink( $post_id2 ), wp_get_shortlink( $post_id2, 'post' ) );

		unset( $GLOBALS['post'] );

		// Global post is not set, once again
		$this->assertEquals( '', wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( '', wp_get_shortlink( 0 ) );
		$this->assertEquals( '', wp_get_shortlink() );

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		// With a permalink structure set, get_permalink() will no longer match.
		$this->assertNotEquals( get_permalink( $post_id ), wp_get_shortlink( $post_id, 'post' ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		// Global post and permalink structure are set
		$GLOBALS['post'] = get_post( $post_id );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( 0, 'post' ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( 0 ) );
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink() );
	}

	function test_wp_get_shortlink_with_page() {
		$post_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

		// Basic case
		// Don't test against get_permalink() since it uses ?page_id= for pages.
		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$this->assertEquals( home_url( '?p=' . $post_id ), wp_get_shortlink( $post_id, 'post' ) );
	}

	/**
	 * @ticket 26871
	 */
	function test_wp_get_shortlink_with_home_page() {
		$post_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $post_id );

		$this->assertEquals( home_url( '/' ), wp_get_shortlink( $post_id, 'post' ) );

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$this->assertEquals( home_url( '/' ), wp_get_shortlink( $post_id, 'post' ) );
	}

	/**
	 * @ticket 17807
	 */
	function test_get_adjacent_post() {
		// Need some sample posts to test adjacency
		$post_one = self::factory()->post->create_and_get( array(
			'post_title' => 'First',
			'post_date' => '2012-01-01 12:00:00'
		) );

		$post_two = self::factory()->post->create_and_get( array(
			'post_title' => 'Second',
			'post_date' => '2012-02-01 12:00:00'
		) );

		$post_three = self::factory()->post->create_and_get( array(
			'post_title' => 'Third',
			'post_date' => '2012-03-01 12:00:00'
		) );

		$post_four = self::factory()->post->create_and_get( array(
			'post_title' => 'Fourth',
			'post_date' => '2012-04-01 12:00:00'
		) );

		// Assign some terms
		wp_set_object_terms( $post_one->ID, 'wordpress', 'category', false );
		wp_set_object_terms( $post_three->ID, 'wordpress', 'category', false );

		wp_set_object_terms( $post_two->ID, 'plugins', 'post_tag', false );
		wp_set_object_terms( $post_four->ID, 'plugins', 'post_tag', false );

		// Test normal post adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( $post_one, get_adjacent_post( false, '', true ) );
		$this->assertEquals( $post_three, get_adjacent_post( false, '', false ) );

		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', true ) );
		$this->assertNotEquals( $post_two, get_adjacent_post( false, '', false ) );

		// Test category adjacency
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'category' ) );
		$this->assertEquals( $post_three, get_adjacent_post( true, '', false, 'category' ) );

		// Test tag adjacency
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( '', get_adjacent_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( $post_four, get_adjacent_post( true, '', false, 'post_tag' ) );

		// Test normal boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( false, '', true ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( false, '', false ) );

		// Test category boundary post
		$this->go_to( get_permalink( $post_one->ID ) );

		$this->assertEquals( array( $post_one ), get_boundary_post( true, '', true, 'category' ) );
		$this->assertEquals( array( $post_three ), get_boundary_post( true, '', false, 'category' ) );

		// Test tag boundary post
		$this->go_to( get_permalink( $post_two->ID ) );

		$this->assertEquals( array( $post_two ), get_boundary_post( true, '', true, 'post_tag' ) );
		$this->assertEquals( array( $post_four ), get_boundary_post( true, '', false, 'post_tag' ) );
	}

	/**
	 * @ticket 22112
	 */
	function test_get_adjacent_post_exclude_self_term() {
		// Bump term_taxonomy to mimic shared term offsets.
		global $wpdb;
		$wpdb->insert( $wpdb->term_taxonomy, array( 'taxonomy' => 'foo', 'term_id' => 12345, 'description' => '' ) );

		$include = self::factory()->term->create( array(
			'taxonomy' => 'category',
			'name' => 'Include',
		) );
		$exclude = self::factory()->category->create();

		$one = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-01 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		$two = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-02 12:00:00',
			'post_category' => array(),
		) );

		$three = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-03 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		$four = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-04 12:00:00',
			'post_category' => array( $include ),
		) );

		$five = self::factory()->post->create_and_get( array(
			'post_date' => '2012-01-05 12:00:00',
			'post_category' => array( $include, $exclude ),
		) );

		// First post
		$this->go_to( get_permalink( $one ) );
		$this->assertEquals( $two, get_adjacent_post( false, array(), false ) );
		$this->assertEquals( $three, get_adjacent_post( true, array(), false ) );
		$this->assertEquals( $two, get_adjacent_post( false, array( $exclude ), false ) );
		$this->assertEquals( $four, get_adjacent_post( true, array( $exclude ), false ) );
		$this->assertEmpty( get_adjacent_post( false, array(), true ) );

		// Fourth post
		$this->go_to( get_permalink( $four ) );
		$this->assertEquals( $five, get_adjacent_post( false, array(), false ) );
		$this->assertEquals( $five, get_adjacent_post( true, array(), false ) );
		$this->assertEmpty( get_adjacent_post( false, array( $exclude ), false ) );
		$this->assertEmpty( get_adjacent_post( true, array( $exclude ), false ) );

		$this->assertEquals( $three, get_adjacent_post( false, array(), true ) );
		$this->assertEquals( $three, get_adjacent_post( true, array(), true ) );
		$this->assertEquals( $two, get_adjacent_post( false, array( $exclude ), true ) );
		$this->assertEmpty( get_adjacent_post( true, array( $exclude ), true ) );

		// Last post
		$this->go_to( get_permalink( $five ) );
		$this->assertEquals( $four, get_adjacent_post( false, array(), true ) );
		$this->assertEquals( $four, get_adjacent_post( true, array(), true ) );
		$this->assertEquals( $four, get_adjacent_post( false, array( $exclude ), true ) );
		$this->assertEquals( $four, get_adjacent_post( true, array( $exclude ), true ) );
		$this->assertEmpty( get_adjacent_post( false, array(), false ) );
	}

	/**
	 * @ticket 32833
	 */
	public function test_get_adjacent_post_excluded_terms() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$p1 = self::factory()->post->create( array( 'post_date' => '2015-08-27 12:00:00' ) );
		$p2 = self::factory()->post->create( array( 'post_date' => '2015-08-26 12:00:00' ) );
		$p3 = self::factory()->post->create( array( 'post_date' => '2015-08-25 12:00:00' ) );

		wp_set_post_terms( $p2, array( $t ), 'wptests_tax' );

		// Fake current page.
		$_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
		$GLOBALS['post'] = get_post( $p1 );

		$found = get_adjacent_post( false, array( $t ), true, 'wptests_tax' );

		if ( ! is_null( $_post ) ) {
			$GLOBALS['post'] = $_post;
		} else {
			unset( $GLOBALS['post'] );
		}

		// Should skip $p2, which belongs to $t.
		$this->assertEquals( $p3, $found->ID );
	}

	/**
	 * @ticket 32833
	 */
	public function test_get_adjacent_post_excluded_terms_should_not_require_posts_to_have_terms_in_any_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$p1 = self::factory()->post->create( array( 'post_date' => '2015-08-27 12:00:00' ) );
		$p2 = self::factory()->post->create( array( 'post_date' => '2015-08-26 12:00:00' ) );
		$p3 = self::factory()->post->create( array( 'post_date' => '2015-08-25 12:00:00' ) );

		wp_set_post_terms( $p2, array( $t ), 'wptests_tax' );

		// Make sure that $p3 doesn't have the 'Uncategorized' category.
		wp_delete_object_term_relationships( $p3, 'category' );

		// Fake current page.
		$_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
		$GLOBALS['post'] = get_post( $p1 );

		$found = get_adjacent_post( false, array( $t ), true, 'wptests_tax' );

		if ( ! is_null( $_post ) ) {
			$GLOBALS['post'] = $_post;
		} else {
			unset( $GLOBALS['post'] );
		}

		// Should skip $p2, which belongs to $t.
		$this->assertEquals( $p3, $found->ID );
	}

	/**
	 * @ticket 30910
	 */
	public function test_get_permalink_should_not_reveal_post_name_for_post_with_post_status_future() {
		update_option( 'permalink_structure','/%year%/%monthnum%/%day%/%postname%/' );

		flush_rewrite_rules();

		$p = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_date'   => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) )
		) );

		$non_pretty_permalink = add_query_arg( 'p', $p, trailingslashit( home_url() ) );

		$this->assertEquals( $non_pretty_permalink, get_permalink( $p ) );
	}

	/**
	 * @ticket 30910
	 */
	public function test_get_permalink_should_not_reveal_post_name_for_cpt_with_post_status_future() {
		update_option( 'permalink_structure','/%year%/%monthnum%/%day%/%postname%/' );

		register_post_type( 'wptests_pt', array( 'public' => true ) );

		flush_rewrite_rules();

		$p = self::factory()->post->create( array(
			'post_status' => 'future',
			'post_type'   => 'wptests_pt',
			'post_date'   => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) )
		) );

		$non_pretty_permalink = add_query_arg( array(
			'post_type' => 'wptests_pt',
			'p' => $p,
		), trailingslashit( home_url() ) );

		$this->assertEquals( $non_pretty_permalink, get_permalink( $p ) );
	}

	/**
	 * @ticket 1914
	 */
	public function test_unattached_attachment_has_a_pretty_permalink() {
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		$attachment_id = self::factory()->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment',
			'post_title' => 'An Attachment!',
			'post_status' => 'inherit',
		) );

		$attachment = get_post( $attachment_id );

		$this->assertSame( home_url( user_trailingslashit( $attachment->post_name ) ), get_permalink( $attachment_id ) );
	}

	/**
	 * @ticket 1914
	 */
	public function test_attachment_attached_to_non_existent_post_type_has_a_pretty_permalink() {
		global $wp_post_types;

		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );

		register_post_type( 'not_a_post_type', array( 'public' => true ) );

		flush_rewrite_rules();

		$post_id = self::factory()->post->create( array( 'post_type' => 'not_a_post_type' ) );

		$attachment_id = self::factory()->attachment->create_object( 'image.jpg', $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment',
			'post_title' => 'An Attachment!',
			'post_status' => 'inherit',
		) );

		$attachment = get_post( $attachment_id );

		$this->assertSame( get_permalink( $post_id ) . user_trailingslashit( $attachment->post_name ), get_permalink( $attachment_id ) );

		foreach( $wp_post_types as $id => $pt ) {
			if ( 'not_a_post_type' === $pt->name ) {
				unset( $wp_post_types[ $id ] );
				break;
			}
		}

		$this->assertSame( home_url( user_trailingslashit( $attachment->post_name ) ), get_permalink( $attachment_id ) );
	}
}
