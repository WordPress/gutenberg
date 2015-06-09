<?php
/**
 * Test WP_User Query, in wp-includes/user.php
 *
 * @group user
 */
class Tests_User_Query extends WP_UnitTestCase {

	protected $user_id;

	function setUp() {
		parent::setUp();
	}

	function test_get_and_set() {
		$users = new WP_User_Query();

		$this->assertEquals( '', $users->get( 'fields' ) );
		$this->assertEquals( '', @$users->query_vars['fields'] );

		$users->set( 'fields', 'all' );

		$this->assertEquals( 'all', $users->get( 'fields' ) );
		$this->assertEquals( 'all', $users->query_vars['fields'] );

		$users->set( 'fields', '' );
		$this->assertEquals( '', $users->get( 'fields' ) );
		$this->assertEquals( '', $users->query_vars['fields'] );

		$this->assertNull( $users->get( 'does-not-exist' ) );
	}

	public function test_include_single() {
		$users = $this->factory->user->create_many( 2 );
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => $users[0],
		) );
		$ids = $q->get_results();

		$this->assertEquals( array( $users[0] ), $ids );
	}

	public function test_include_comma_separated() {
		$users = $this->factory->user->create_many( 3 );
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => $users[0] . ', ' . $users[2],
		) );
		$ids = $q->get_results();

		$this->assertEqualSets( array( $users[0], $users[2] ), $ids );
	}

	public function test_include_array() {
		$users = $this->factory->user->create_many( 3 );
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => array( $users[0], $users[2] ),
		) );
		$ids = $q->get_results();

		$this->assertEqualSets( array( $users[0], $users[2] ), $ids );
	}

	public function test_include_array_bad_values() {
		$users = $this->factory->user->create_many( 3 );
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => array( $users[0], 'foo', $users[2] ),
		) );
		$ids = $q->get_results();

		$this->assertEqualSets( array( $users[0], $users[2] ), $ids );
	}

	public function test_exclude() {
		$users = $this->factory->user->create_many( 3, array(
			'role' => 'author',
		) );

		$q = new WP_User_Query( array(
			'fields' => '',
			'exclude' => $users[1],
		) );

		$ids = $q->get_results();

		// Indirect test in order to ignore default user created during installation.
		$this->assertNotEmpty( $ids );
		$this->assertNotContains( $users[1], $ids );
	}

	public function test_get_all() {
		$this->factory->user->create_many( 3, array(
			'role' => 'author'
		) );

		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id() ) );
		$users = $users->get_results();

		// +1 for the default user created during installation.
		$this->assertEquals( 4, count( $users ) );
		foreach ( $users as $user ) {
			$this->assertInstanceOf( 'WP_User', $user );
		}

		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id(), 'fields' => 'all_with_meta' ) );
		$users = $users->get_results();
		$this->assertEquals( 4, count( $users ) );
		foreach ( $users as $user ) {
			$this->assertInstanceOf( 'WP_User', $user );
		}
	}

	/**
	 * @dataProvider orderby_should_convert_non_prefixed_keys_data
	 */
	public function test_orderby_should_convert_non_prefixed_keys( $short_key, $full_key ) {
		$q = new WP_User_Query( array(
			'orderby' => $short_key,
		) );

		$this->assertContains( "ORDER BY $full_key", $q->query_orderby );
	}

	public function orderby_should_convert_non_prefixed_keys_data() {
		return array(
			array( 'nicename', 'user_nicename' ),
			array( 'email', 'user_email' ),
			array( 'url', 'user_url' ),
			array( 'registered', 'user_registered' ),
			array( 'name', 'display_name' ),
		);
	}

	public function test_orderby_meta_value() {
		$users = $this->factory->user->create_many( 3, array(
			'role' => 'author'
		) );

		update_user_meta( $users[0], 'last_name', 'Jones' );
		update_user_meta( $users[1], 'last_name', 'Albert' );
		update_user_meta( $users[2], 'last_name', 'Zorro' );

		$q = new WP_User_Query( array(
			'include' => $users,
			'meta_key' => 'last_name',
			'orderby' => 'meta_value',
			'fields' => 'ids'
		) );

		$expected = array( $users[1], $users[0], $users[2] );

		$this->assertEquals( $expected, $q->get_results() );
	}

	/**
	 * @ticket 27887
	 */
	public function test_orderby_meta_value_num() {
		$users = $this->factory->user->create_many( 3, array(
			'role' => 'author'
		) );

		update_user_meta( $users[0], 'user_age', '101' );
		update_user_meta( $users[1], 'user_age', '20' );
		update_user_meta( $users[2], 'user_age', '25' );

		$q = new WP_User_Query( array(
			'include' => $users,
			'meta_key' => 'user_age',
			'orderby' => 'meta_value_num',
			'fields' => 'ids'
		) );

		$expected = array( $users[1], $users[2], $users[0] );

		$this->assertEquals( $expected, $q->get_results() );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_somekey_where_meta_key_is_somekey() {
		$users = $this->factory->user->create_many( 3, array(
			'role' => 'author'
		) );

		update_user_meta( $users[0], 'foo', 'zzz' );
		update_user_meta( $users[1], 'foo', 'aaa' );
		update_user_meta( $users[2], 'foo', 'jjj' );

		$q = new WP_User_Query( array(
			'include' => $users,
			'meta_key' => 'foo',
			'orderby' => 'foo',
			'fields' => 'ids'
		) );

		$expected = array( $users[1], $users[2], $users[0] );

		$this->assertEquals( $expected, $q->get_results() );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_clause_key() {
		$users = $this->factory->user->create_many( 3 );
		add_user_meta( $users[0], 'foo', 'aaa' );
		add_user_meta( $users[1], 'foo', 'zzz' );
		add_user_meta( $users[2], 'foo', 'jjj' );

		$q = new WP_User_Query( array(
			'fields' => 'ids',
			'meta_query' => array(
				'foo_key' => array(
					'key' => 'foo',
					'compare' => 'EXISTS',
				),
			),
			'orderby' => 'foo_key',
			'order' => 'DESC',
		) );

		$this->assertEquals( array( $users[1], $users[2], $users[0] ), $q->results );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_clause_key_as_secondary_sort() {
		$u1 = $this->factory->user->create( array(
			'user_registered' => '2015-01-28 03:00:00',
		) );
		$u2 = $this->factory->user->create( array(
			'user_registered' => '2015-01-28 05:00:00',
		) );
		$u3 = $this->factory->user->create( array(
			'user_registered' => '2015-01-28 03:00:00',
		) );

		add_user_meta( $u1, 'foo', 'jjj' );
		add_user_meta( $u2, 'foo', 'zzz' );
		add_user_meta( $u3, 'foo', 'aaa' );

		$q = new WP_User_Query( array(
			'fields' => 'ids',
			'meta_query' => array(
				'foo_key' => array(
					'key' => 'foo',
					'compare' => 'EXISTS',
				),
			),
			'orderby' => array(
				'comment_date' => 'asc',
				'foo_key' => 'asc',
			),
		) );

		$this->assertEquals( array( $u3, $u1, $u2 ), $q->results );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_more_than_one_clause_key() {
		$users = $this->factory->user->create_many( 3 );

		add_user_meta( $users[0], 'foo', 'jjj' );
		add_user_meta( $users[1], 'foo', 'zzz' );
		add_user_meta( $users[2], 'foo', 'jjj' );
		add_user_meta( $users[0], 'bar', 'aaa' );
		add_user_meta( $users[1], 'bar', 'ccc' );
		add_user_meta( $users[2], 'bar', 'bbb' );

		$q = new WP_User_Query( array(
			'fields' => 'ids',
			'meta_query' => array(
				'foo_key' => array(
					'key' => 'foo',
					'compare' => 'EXISTS',
				),
				'bar_key' => array(
					'key' => 'bar',
					'compare' => 'EXISTS',
				),
			),
			'orderby' => array(
				'foo_key' => 'asc',
				'bar_key' => 'desc',
			),
		) );

		$this->assertEquals( array( $users[2], $users[0], $users[1] ), $q->results );
	}

	/**
	 * @ticket 30064
	 */
	public function test_orderby_include_with_empty_include() {
		$q = new WP_User_Query( array(
			'orderby' => 'include',
		) );

		$this->assertContains( 'ORDER BY user_login', $q->query_orderby );
	}

	/**
	 * @ticket 30064
	 */
	public function test_orderby_include() {
		global $wpdb;

		$users = $this->factory->user->create_many( 4 );
		$q = new WP_User_Query( array(
			'orderby' => 'include',
			'include' => array( $users[1], $users[0], $users[3] ),
			'fields' => '',
		) );

		$expected_orderby = 'ORDER BY FIELD( ' . $wpdb->users . '.ID, ' . $users[1] . ',' . $users[0] . ',' . $users[3] . ' )';
		$this->assertContains( $expected_orderby, $q->query_orderby );

		// assertEquals() respects order but ignores type (get_results() returns numeric strings).
		$this->assertEquals( array( $users[1], $users[0], $users[3] ), $q->get_results() );
	}

	/**
	 * @ticket 30064
	 */
	public function test_orderby_include_duplicate_values() {
		global $wpdb;

		$users = $this->factory->user->create_many( 4 );
		$q = new WP_User_Query( array(
			'orderby' => 'include',
			'include' => array( $users[1], $users[0], $users[1], $users[3] ),
			'fields' => '',
		) );

		$expected_orderby = 'ORDER BY FIELD( ' . $wpdb->users . '.ID, ' . $users[1] . ',' . $users[0] . ',' . $users[3] . ' )';
		$this->assertContains( $expected_orderby, $q->query_orderby );

		// assertEquals() respects order but ignores type (get_results() returns numeric strings).
		$this->assertEquals( array( $users[1], $users[0], $users[3] ), $q->get_results() );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_space_separated() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => 'login nicename',
			'order' => 'ASC',
		) );

		$this->assertContains( "ORDER BY user_login ASC, user_nicename ASC", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_flat_array() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => array( 'login', 'nicename' ),
		) );

		$this->assertContains( "ORDER BY user_login ASC, user_nicename ASC", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array_contains_invalid_item() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => array( 'login', 'foo', 'nicename' ),
		) );

		$this->assertContains( "ORDER BY user_login ASC, user_nicename ASC", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array_contains_all_invalid_items() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => array( 'foo', 'bar', 'baz' ),
		) );

		$this->assertContains( "ORDER BY user_login", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => array(
				'login' => 'DESC',
				'nicename' => 'ASC',
				'email' => 'DESC',
			),
		) );

		$this->assertContains( "ORDER BY user_login DESC, user_nicename ASC, user_email DESC", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array_should_discard_invalid_columns() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => array(
				'login' => 'DESC',
				'foo' => 'ASC',
				'email' => 'ASC',
			),
		) );

		$this->assertContains( "ORDER BY user_login DESC, user_email ASC", $q->query_orderby );
	}

	/**
	 * @ticket 21119
	 */
	function test_prepare_query() {
		$query = new WP_User_Query();
		$this->assertEmpty( $query->query_fields );
		$this->assertEmpty( $query->query_from );
		$this->assertEmpty( $query->query_limit );
		$this->assertEmpty( $query->query_orderby );
		$this->assertEmpty( $query->query_where );
		$this->assertEmpty( $query->query_vars );
		$_query_vars = $query->query_vars;

		$query->prepare_query();
		$this->assertNotEmpty( $query->query_fields );
		$this->assertNotEmpty( $query->query_from );
		$this->assertEmpty( $query->query_limit );
		$this->assertNotEmpty( $query->query_orderby );
		$this->assertNotEmpty( $query->query_where );
		$this->assertNotEmpty( $query->query_vars );
		$this->assertNotEquals( $_query_vars, $query->query_vars );

		// All values get reset
		$query->prepare_query( array( 'number' => 8 ) );
		$this->assertNotEmpty( $query->query_limit );
		$this->assertEquals( 'LIMIT 8', $query->query_limit );

		// All values get reset
		$query->prepare_query( array( 'fields' => 'all' ) );
		$this->assertEmpty( $query->query_limit );
		$this->assertEquals( '', $query->query_limit );
		$_query_vars = $query->query_vars;

		$query->prepare_query();
		$this->assertEquals( $_query_vars, $query->query_vars );
	}

	public function test_meta_vars_should_be_converted_to_meta_query() {
		$q = new WP_User_Query( array(
			'meta_key' => 'foo',
			'meta_value' => '5',
			'meta_compare' => '>',
			'meta_type' => 'SIGNED',
		) );

		// Multisite adds a 'blog_id' clause, so we have to find the 'foo' clause.
		$mq_clauses = $q->meta_query->get_clauses();
		foreach ( $mq_clauses as $mq_clause ) {
			if ( 'foo' === $mq_clause['key'] ) {
				$clause = $mq_clause;
			}
		}

		$this->assertSame( 'foo', $clause['key'] );
		$this->assertSame( '5', $clause['value'] );
		$this->assertSame( '>', $clause['compare'] );
		$this->assertSame( 'SIGNED', $clause['type'] );
	}

	/**
	 * @ticket 23849
	 */
	function test_meta_query_with_role() {
		$author_ids = $this->factory->user->create_many( 4, array( 'role' => 'author' ) );

		add_user_meta( $author_ids[0], 'foo', 'bar' );
		add_user_meta( $author_ids[1], 'foo', 'baz' );

		// Users with foo = bar or baz restricted to the author role.
		$query = new WP_User_Query( array(
			'fields' => '',
			'role' => 'author',
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'key' => 'foo',
					'value' => 'baz',
				),
			),
		) );

		$this->assertEquals( array( $author_ids[0], $author_ids[1] ), $query->get_results() );
	}

	public function test_roles_and_caps_should_be_populated_for_default_value_of_blog_id() {
		$u = $this->factory->user->create( array( 'role' => 'author' ) );

		$query = new WP_User_Query( array(
			'include' => $u,
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_blog_id_on_nonms() {
		if ( is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a non-multisite-only test.' );
		}

		$u = $this->factory->user->create( array( 'role' => 'author' ) );

		$query = new WP_User_Query( array(
			'include' => $u,
			'blog_id' => get_current_blog_id(),
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_current_blog_id_on_ms() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$u = $this->factory->user->create( array( 'role' => 'author' ) );

		$query = new WP_User_Query( array(
			'include' => $u,
			'blog_id' => get_current_blog_id(),
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_different_blog_id_on_ms_when_fields_all_with_meta() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$b = $this->factory->blog->create();
		$u = $this->factory->user->create();
		add_user_to_blog( $b, $u, 'author' );

		$query = new WP_User_Query( array(
			'include' => $u,
			'blog_id' => $b,
			'fields' => 'all_with_meta',
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	/**
	 * @ticket 31878
	 */
	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_different_blog_id_on_ms_when_fields_all() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$b = $this->factory->blog->create();
		$u = $this->factory->user->create();
		add_user_to_blog( $b, $u, 'author' );

		$query = new WP_User_Query( array(
			'fields' => 'all',
			'include' => $u,
			'blog_id' => $b,
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	/**
	 * @ticket 32019
	 */
	public function test_who_authors() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$b = $this->factory->blog->create();
		$users = $this->factory->user->create_many( 3 );

		add_user_to_blog( $b, $users[0], 'subscriber' );
		add_user_to_blog( $b, $users[1], 'author' );
		add_user_to_blog( $b, $users[2], 'editor' );

		$q = new WP_User_Query( array(
			'who' => 'authors',
			'blog_id' => $b,
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );

		$this->assertNotContains( $users[0], $found );
		$this->assertContains( $users[1], $found );
		$this->assertContains( $users[2], $found );
	}

	/**
	 * @ticket 32019
	 */
	public function test_who_authors_should_work_alongside_meta_query() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$b = $this->factory->blog->create();
		$users = $this->factory->user->create_many( 3 );

		add_user_to_blog( $b, $users[0], 'subscriber' );
		add_user_to_blog( $b, $users[1], 'author' );
		add_user_to_blog( $b, $users[2], 'editor' );

		add_user_meta( $users[1], 'foo', 'bar' );
		add_user_meta( $users[2], 'foo', 'baz' );

		$q = new WP_User_Query( array(
			'who' => 'authors',
			'blog_id' => $b,
			'meta_query' => array(
				'key' => 'foo',
				'value' => 'bar',
			),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );

		$this->assertNotContains( $users[0], $found );
		$this->assertContains( $users[1], $found );
		$this->assertNotContains( $users[2], $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_with_value_true_should_show_authors_of_posts_in_public_post_types() {
		register_post_type( 'wptests_pt_public', array( 'public' => true ) );
		register_post_type( 'wptests_pt_private', array( 'public' => false ) );

		$users = $this->factory->user->create_many( 3 );

		$this->factory->post->create( array( 'post_author' => $users[0], 'post_status' => 'publish', 'post_type' => 'wptests_pt_public' ) );
		$this->factory->post->create( array( 'post_author' => $users[1], 'post_status' => 'publish', 'post_type' => 'wptests_pt_private' ) );

		$q = new WP_User_Query( array(
			'has_published_posts' => true,
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( $users[0] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_should_obey_post_types() {
		register_post_type( 'wptests_pt_public', array( 'public' => true ) );
		register_post_type( 'wptests_pt_private', array( 'public' => false ) );

		$users = $this->factory->user->create_many( 3 );

		$this->factory->post->create( array( 'post_author' => $users[0], 'post_status' => 'publish', 'post_type' => 'wptests_pt_public' ) );
		$this->factory->post->create( array( 'post_author' => $users[1], 'post_status' => 'publish', 'post_type' => 'wptests_pt_private' ) );
		$this->factory->post->create( array( 'post_author' => $users[2], 'post_status' => 'publish', 'post_type' => 'post' ) );

		$q = new WP_User_Query( array(
			'has_published_posts' => array( 'wptests_pt_private', 'post' ),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( $users[1], $users[2] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_should_ignore_non_published_posts() {
		register_post_type( 'wptests_pt_public', array( 'public' => true ) );
		register_post_type( 'wptests_pt_private', array( 'public' => false ) );

		$users = $this->factory->user->create_many( 3 );

		$this->factory->post->create( array( 'post_author' => $users[0], 'post_status' => 'draft', 'post_type' => 'wptests_pt_public' ) );
		$this->factory->post->create( array( 'post_author' => $users[1], 'post_status' => 'inherit', 'post_type' => 'wptests_pt_private' ) );
		$this->factory->post->create( array( 'post_author' => $users[2], 'post_status' => 'publish', 'post_type' => 'post' ) );

		$q = new WP_User_Query( array(
			'has_published_posts' => array( 'wptests_pt_public', 'wptests_pt_private', 'post' ),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( $users[2] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_should_respect_blog_id() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$users = $this->factory->user->create_many( 3 );
		$blogs = $this->factory->blog->create_many( 2 );

		add_user_to_blog( $blogs[0], $users[0], 'author' );
		add_user_to_blog( $blogs[0], $users[1], 'author' );
		add_user_to_blog( $blogs[1], $users[0], 'author' );
		add_user_to_blog( $blogs[1], $users[1], 'author' );

		switch_to_blog( $blogs[0] );
		$this->factory->post->create( array( 'post_author' => $users[0], 'post_status' => 'publish', 'post_type' => 'post' ) );
		restore_current_blog();

		switch_to_blog( $blogs[1] );
		$this->factory->post->create( array( 'post_author' => $users[1], 'post_status' => 'publish', 'post_type' => 'post' ) );
		restore_current_blog();

		$q = new WP_User_Query( array(
			'has_published_posts' => array( 'post' ),
			'blog_id' => $blogs[1],
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( $users[1] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32592
	 */
	public function test_top_level_or_meta_query_should_eliminate_duplicate_matches() {
		$users = $this->factory->user->create_many( 3 );

		add_user_meta( $users[0], 'foo', 'bar' );
		add_user_meta( $users[1], 'foo', 'bar' );
		add_user_meta( $users[0], 'foo2', 'bar2' );

		$q = new WP_User_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar2',
				),
			),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( $users[0], $users[1] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32592
	 */
	public function test_nested_or_meta_query_should_eliminate_duplicate_matches() {
		$users = $this->factory->user->create_many( 3 );

		add_user_meta( $users[0], 'foo', 'bar' );
		add_user_meta( $users[1], 'foo', 'bar' );
		add_user_meta( $users[0], 'foo2', 'bar2' );
		add_user_meta( $users[1], 'foo3', 'bar3' );

		$q = new WP_User_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'relation' => 'OR',
					array(
						'key' => 'foo',
						'value' => 'bar',
					),
					array(
						'key' => 'foo2',
						'value' => 'bar2',
					),
				),
			),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( $users[0], $users[1] );

		$this->assertEqualSets( $expected, $found );
	}
}
