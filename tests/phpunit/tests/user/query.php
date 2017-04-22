<?php
/**
 * Test WP_User Query, in wp-includes/user.php
 *
 * @group user
 */
class Tests_User_Query extends WP_UnitTestCase {
	protected static $author_ids;
	protected static $sub_ids;
	protected static $editor_ids;
	protected static $contrib_id;
	protected static $admin_ids;

	protected $user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$author_ids = $factory->user->create_many( 4, array(
			'role' => 'author'
		) );

		self::$sub_ids = $factory->user->create_many( 2, array(
			'role' => 'subscriber',
		) );

		self::$editor_ids = $factory->user->create_many( 3, array(
			'role' => 'editor',
		) );

		self::$contrib_id = $factory->user->create( array(
			'role' => 'contributor',
		) );

		self::$admin_ids = $factory->user->create_many( 2, array(
			'role' => 'administrator',
		) );
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
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => self::$author_ids[0],
		) );
		$ids = $q->get_results();

		$this->assertEquals( array( self::$author_ids[0] ), $ids );
	}

	public function test_include_comma_separated() {
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => self::$author_ids[0] . ', ' . self::$author_ids[2],
		) );
		$ids = $q->get_results();

		$this->assertEqualSets( array( self::$author_ids[0], self::$author_ids[2] ), $ids );
	}

	public function test_include_array() {
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => array( self::$author_ids[0], self::$author_ids[2] ),
		) );
		$ids = $q->get_results();

		$this->assertEqualSets( array( self::$author_ids[0], self::$author_ids[2] ), $ids );
	}

	public function test_include_array_bad_values() {
		$q = new WP_User_Query( array(
			'fields' => '',
			'include' => array( self::$author_ids[0], 'foo', self::$author_ids[2] ),
		) );
		$ids = $q->get_results();

		$this->assertEqualSets( array( self::$author_ids[0], self::$author_ids[2] ), $ids );
	}

	public function test_exclude() {
		$q = new WP_User_Query( array(
			'fields' => '',
			'exclude' => self::$author_ids[1],
		) );

		$ids = $q->get_results();

		// Indirect test in order to ignore default user created during installation.
		$this->assertNotEmpty( $ids );
		$this->assertNotContains( self::$author_ids[1], $ids );
	}

	public function test_get_all() {
		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id() ) );
		$users = $users->get_results();

		// +1 for the default user created during installation.
		$this->assertEquals( 13, count( $users ) );
		foreach ( $users as $user ) {
			$this->assertInstanceOf( 'WP_User', $user );
		}

		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id(), 'fields' => 'all_with_meta' ) );
		$users = $users->get_results();
		$this->assertEquals( 13, count( $users ) );
		foreach ( $users as $user ) {
			$this->assertInstanceOf( 'WP_User', $user );
		}
	}

	/**
	 * @ticket 39297
	 */
	public function test_get_total_is_int() {
		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id() ) );
		$total_users = $users->get_total();

		$this->assertSame( 13, $total_users );
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
		update_user_meta( self::$author_ids[0], 'last_name', 'Jones' );
		update_user_meta( self::$author_ids[1], 'last_name', 'Albert' );
		update_user_meta( self::$author_ids[2], 'last_name', 'Zorro' );

		$q = new WP_User_Query( array(
			'include' => self::$author_ids,
			'meta_key' => 'last_name',
			'orderby' => 'meta_value',
			'fields' => 'ids'
		) );

		$expected = array( self::$author_ids[3], self::$author_ids[1], self::$author_ids[0], self::$author_ids[2] );

		$this->assertEquals( $expected, $q->get_results() );
	}

	/**
	 * @ticket 27887
	 */
	public function test_orderby_meta_value_num() {
		update_user_meta( self::$author_ids[0], 'user_age', '101' );
		update_user_meta( self::$author_ids[1], 'user_age', '20' );
		update_user_meta( self::$author_ids[2], 'user_age', '25' );

		$q = new WP_User_Query( array(
			'include' => self::$author_ids,
			'meta_key' => 'user_age',
			'orderby' => 'meta_value_num',
			'fields' => 'ids'
		) );

		$expected = array( self::$author_ids[1], self::$author_ids[2], self::$author_ids[0] );

		$this->assertEquals( $expected, $q->get_results() );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_somekey_where_meta_key_is_somekey() {
		update_user_meta( self::$author_ids[0], 'foo', 'zzz' );
		update_user_meta( self::$author_ids[1], 'foo', 'aaa' );
		update_user_meta( self::$author_ids[2], 'foo', 'jjj' );

		$q = new WP_User_Query( array(
			'include' => self::$author_ids,
			'meta_key' => 'foo',
			'orderby' => 'foo',
			'fields' => 'ids'
		) );

		$expected = array( self::$author_ids[1], self::$author_ids[2], self::$author_ids[0] );

		$this->assertEquals( $expected, $q->get_results() );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_clause_key() {
		add_user_meta( self::$author_ids[0], 'foo', 'aaa' );
		add_user_meta( self::$author_ids[1], 'foo', 'zzz' );
		add_user_meta( self::$author_ids[2], 'foo', 'jjj' );

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

		$this->assertEquals( array( self::$author_ids[1], self::$author_ids[2], self::$author_ids[0] ), $q->results );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_clause_key_as_secondary_sort() {
		$u1 = self::factory()->user->create( array(
			'user_registered' => '2015-01-28 03:00:00',
		) );
		$u2 = self::factory()->user->create( array(
			'user_registered' => '2015-01-28 05:00:00',
		) );
		$u3 = self::factory()->user->create( array(
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
		add_user_meta( self::$author_ids[0], 'foo', 'jjj' );
		add_user_meta( self::$author_ids[1], 'foo', 'zzz' );
		add_user_meta( self::$author_ids[2], 'foo', 'jjj' );
		add_user_meta( self::$author_ids[0], 'bar', 'aaa' );
		add_user_meta( self::$author_ids[1], 'bar', 'ccc' );
		add_user_meta( self::$author_ids[2], 'bar', 'bbb' );

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

		$this->assertEquals( array( self::$author_ids[2], self::$author_ids[0], self::$author_ids[1] ), $q->results );
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

		$q = new WP_User_Query( array(
			'orderby' => 'include',
			'include' => array( self::$author_ids[1], self::$author_ids[0], self::$author_ids[3] ),
			'fields' => '',
		) );

		$expected_orderby = 'ORDER BY FIELD( ' . $wpdb->users . '.ID, ' . self::$author_ids[1] . ',' . self::$author_ids[0] . ',' . self::$author_ids[3] . ' )';
		$this->assertContains( $expected_orderby, $q->query_orderby );

		// assertEquals() respects order but ignores type (get_results() returns numeric strings).
		$this->assertEquals( array( self::$author_ids[1], self::$author_ids[0], self::$author_ids[3] ), $q->get_results() );
	}

	/**
	 * @ticket 30064
	 */
	public function test_orderby_include_duplicate_values() {
		global $wpdb;

		$q = new WP_User_Query( array(
			'orderby' => 'include',
			'include' => array( self::$author_ids[1], self::$author_ids[0], self::$author_ids[1], self::$author_ids[3] ),
			'fields' => '',
		) );

		$expected_orderby = 'ORDER BY FIELD( ' . $wpdb->users . '.ID, ' . self::$author_ids[1] . ',' . self::$author_ids[0] . ',' . self::$author_ids[3] . ' )';
		$this->assertContains( $expected_orderby, $q->query_orderby );

		// assertEquals() respects order but ignores type (get_results() returns numeric strings).
		$this->assertEquals( array( self::$author_ids[1], self::$author_ids[0], self::$author_ids[3] ), $q->get_results() );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_space_separated() {
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
		$q = new WP_User_Query( array(
			'orderby' => array( 'login', 'nicename' ),
		) );

		$this->assertContains( "ORDER BY user_login ASC, user_nicename ASC", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array_contains_invalid_item() {
		$q = new WP_User_Query( array(
			'orderby' => array( 'login', 'foo', 'nicename' ),
		) );

		$this->assertContains( "ORDER BY user_login ASC, user_nicename ASC", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array_contains_all_invalid_items() {
		$q = new WP_User_Query( array(
			'orderby' => array( 'foo', 'bar', 'baz' ),
		) );

		$this->assertContains( "ORDER BY user_login", $q->query_orderby );
	}

	/**
	 * @ticket 31265
	 */
	public function test_orderby_array() {
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
	 * @ticket 28631
	 */
	function test_number() {
		// +1 for the default user created by the test suite.
		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id() ) );
		$users = $users->get_results();
		$this->assertEquals( 13, count( $users ) );

		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id(), 'number' => 10 ) );
		$users = $users->get_results();
		$this->assertEquals( 10, count( $users ) );

		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id(), 'number' => 2 ) );
		$users = $users->get_results();
		$this->assertEquals( 2, count( $users ) );

		$users = new WP_User_Query( array( 'blog_id' => get_current_blog_id(), 'number' => -1 ) );
		$users = $users->get_results();
		$this->assertEquals( 13, count( $users ) );
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
		$this->assertEquals( 'LIMIT 0, 8', $query->query_limit );

		// All values get reset
		$query->prepare_query( array( 'fields' => 'all' ) );
		$this->assertEmpty( $query->query_limit );
		$this->assertEquals( '', $query->query_limit );
		$_query_vars = $query->query_vars;

		$query->prepare_query();
		$this->assertEquals( $_query_vars, $query->query_vars );

		$query->prepare_query( array( 'number' => -1 ) );
		$this->assertNotEquals( 'LIMIT -1', $query->query_limit );
		$this->assertEmpty( $query->query_limit );
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
		add_user_meta( self::$author_ids[0], 'foo', 'bar' );
		add_user_meta( self::$author_ids[1], 'foo', 'baz' );

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

		$this->assertEquals( array( self::$author_ids[0], self::$author_ids[1] ), $query->get_results() );
	}

	public function test_roles_and_caps_should_be_populated_for_default_value_of_blog_id() {
		$query = new WP_User_Query( array(
			'include' => self::$author_ids[0],
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	/**
	 * @group ms-excluded
	 */
	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_blog_id_on_nonms() {
		if ( is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a non-multisite-only test.' );
		}

		$query = new WP_User_Query( array(
			'include' => self::$author_ids[0],
			'blog_id' => get_current_blog_id(),
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	/**
	 * @group ms-required
	 */
	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_current_blog_id_on_ms() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$query = new WP_User_Query( array(
			'include' => self::$author_ids[0],
			'blog_id' => get_current_blog_id(),
		) );

		$found = $query->get_results();

		$this->assertNotEmpty( $found );
		$user = reset( $found );
		$this->assertSame( array( 'author' ), $user->roles );
		$this->assertSame( array( 'author' => true ), $user->caps );
	}

	/**
	 * @group ms-required
	 */
	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_different_blog_id_on_ms_when_fields_all_with_meta() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$b = self::factory()->blog->create();

		add_user_to_blog( $b, self::$author_ids[0], 'author' );

		$query = new WP_User_Query( array(
			'include' => self::$author_ids[0],
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
	 * @group ms-required
	 */
	public function test_roles_and_caps_should_be_populated_for_explicit_value_of_different_blog_id_on_ms_when_fields_all() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' is a multisite-only test.' );
		}

		$b = self::factory()->blog->create();
		add_user_to_blog( $b, self::$author_ids[0], 'author' );

		$query = new WP_User_Query( array(
			'fields' => 'all',
			'include' => self::$author_ids[0],
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
	 * @group ms-required
	 */
	public function test_who_authors() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$b = self::factory()->blog->create();

		add_user_to_blog( $b, self::$author_ids[0], 'subscriber' );
		add_user_to_blog( $b, self::$author_ids[1], 'author' );
		add_user_to_blog( $b, self::$author_ids[2], 'editor' );

		$q = new WP_User_Query( array(
			'who' => 'authors',
			'blog_id' => $b,
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );

		$this->assertNotContains( self::$author_ids[0], $found );
		$this->assertContains( self::$author_ids[1], $found );
		$this->assertContains( self::$author_ids[2], $found );
	}

	/**
	 * @ticket 32019
	 * @group ms-required
	 */
	public function test_who_authors_should_work_alongside_meta_query() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$b = self::factory()->blog->create();

		add_user_to_blog( $b, self::$author_ids[0], 'subscriber' );
		add_user_to_blog( $b, self::$author_ids[1], 'author' );
		add_user_to_blog( $b, self::$author_ids[2], 'editor' );

		add_user_meta( self::$author_ids[1], 'foo', 'bar' );
		add_user_meta( self::$author_ids[2], 'foo', 'baz' );

		$q = new WP_User_Query( array(
			'who' => 'authors',
			'blog_id' => $b,
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				)
			),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );

		$this->assertNotContains( self::$author_ids[0], $found );
		$this->assertContains( self::$author_ids[1], $found );
		$this->assertNotContains( self::$author_ids[2], $found );
	}

	/**
	 * @ticket 36724
	 * @group ms-required
	 */
	public function test_who_authors_should_work_alongside_meta_params() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$b = self::factory()->blog->create();

		add_user_to_blog( $b, self::$author_ids[0], 'subscriber' );
		add_user_to_blog( $b, self::$author_ids[1], 'author' );
		add_user_to_blog( $b, self::$author_ids[2], 'editor' );

		add_user_meta( self::$author_ids[1], 'foo', 'bar' );
		add_user_meta( self::$author_ids[2], 'foo', 'baz' );

		$q = new WP_User_Query( array(
			'who' => 'authors',
			'blog_id' => $b,
			'meta_key' => 'foo',
			'meta_value' => 'bar',
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );

		$this->assertNotContains( self::$author_ids[0], $found );
		$this->assertContains( self::$author_ids[1], $found );
		$this->assertNotContains( self::$author_ids[2], $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_with_value_true_should_show_authors_of_posts_in_public_post_types() {
		register_post_type( 'wptests_pt_public', array( 'public' => true ) );
		register_post_type( 'wptests_pt_private', array( 'public' => false ) );

		self::factory()->post->create( array( 'post_author' => self::$author_ids[0], 'post_status' => 'publish', 'post_type' => 'wptests_pt_public' ) );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[1], 'post_status' => 'publish', 'post_type' => 'wptests_pt_private' ) );

		$q = new WP_User_Query( array(
			'has_published_posts' => true,
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[0] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_should_obey_post_types() {
		register_post_type( 'wptests_pt_public', array( 'public' => true ) );
		register_post_type( 'wptests_pt_private', array( 'public' => false ) );

		self::factory()->post->create( array( 'post_author' => self::$author_ids[0], 'post_status' => 'publish', 'post_type' => 'wptests_pt_public' ) );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[1], 'post_status' => 'publish', 'post_type' => 'wptests_pt_private' ) );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[2], 'post_status' => 'publish', 'post_type' => 'post' ) );

		$q = new WP_User_Query( array(
			'has_published_posts' => array( 'wptests_pt_private', 'post' ),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[1], self::$author_ids[2] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32250
	 */
	public function test_has_published_posts_should_ignore_non_published_posts() {
		register_post_type( 'wptests_pt_public', array( 'public' => true ) );
		register_post_type( 'wptests_pt_private', array( 'public' => false ) );

		self::factory()->post->create( array( 'post_author' => self::$author_ids[0], 'post_status' => 'draft', 'post_type' => 'wptests_pt_public' ) );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[1], 'post_status' => 'inherit', 'post_type' => 'wptests_pt_private' ) );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[2], 'post_status' => 'publish', 'post_type' => 'post' ) );

		$q = new WP_User_Query( array(
			'has_published_posts' => array( 'wptests_pt_public', 'wptests_pt_private', 'post' ),
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[2] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32250
	 * @group ms-required
	 */
	public function test_has_published_posts_should_respect_blog_id() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$blogs = self::factory()->blog->create_many( 2 );

		add_user_to_blog( $blogs[0], self::$author_ids[0], 'author' );
		add_user_to_blog( $blogs[0], self::$author_ids[1], 'author' );
		add_user_to_blog( $blogs[1], self::$author_ids[0], 'author' );
		add_user_to_blog( $blogs[1], self::$author_ids[1], 'author' );

		switch_to_blog( $blogs[0] );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[0], 'post_status' => 'publish', 'post_type' => 'post' ) );
		restore_current_blog();

		switch_to_blog( $blogs[1] );
		self::factory()->post->create( array( 'post_author' => self::$author_ids[1], 'post_status' => 'publish', 'post_type' => 'post' ) );
		restore_current_blog();

		$q = new WP_User_Query( array(
			'has_published_posts' => array( 'post' ),
			'blog_id' => $blogs[1],
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[1] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32592
	 */
	public function test_top_level_or_meta_query_should_eliminate_duplicate_matches() {
		add_user_meta( self::$author_ids[0], 'foo', 'bar' );
		add_user_meta( self::$author_ids[1], 'foo', 'bar' );
		add_user_meta( self::$author_ids[0], 'foo2', 'bar2' );

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
		$expected = array( self::$author_ids[0], self::$author_ids[1] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 32592
	 */
	public function test_nested_or_meta_query_should_eliminate_duplicate_matches() {
		add_user_meta( self::$author_ids[0], 'foo', 'bar' );
		add_user_meta( self::$author_ids[1], 'foo', 'bar' );
		add_user_meta( self::$author_ids[0], 'foo2', 'bar2' );
		add_user_meta( self::$author_ids[1], 'foo3', 'bar3' );

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
		$expected = array( self::$author_ids[0], self::$author_ids[1] );

		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 36624
	 */
	public function test_nicename_returns_user_with_nicename() {
		wp_update_user( array(
			'ID' => self::$author_ids[0],
			'user_nicename' => 'peter'
		) );

		$q = new WP_User_Query( array (
			'nicename' => 'peter'
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[0] );

		$this->assertContains( "AND user_nicename = 'peter'", $q->query_where);
		$this->assertEqualSets( $expected, $found);
	}

	/**
	 * @ticket 36624
	 */
	public function test_nicename__in_returns_users_with_included_nicenames() {
		wp_update_user( array(
			'ID' => self::$author_ids[0],
			'user_nicename' => 'peter'
		) );

		wp_update_user( array(
			'ID' => self::$author_ids[1],
			'user_nicename' => 'paul'
		) );

		wp_update_user( array(
			'ID' => self::$author_ids[2],
			'user_nicename' => 'mary'
		) );

		$q = new WP_User_Query( array (
			'nicename__in' => array( 'peter', 'paul', 'mary' )
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[0], self::$author_ids[1], self::$author_ids[2] );

		$this->assertContains( "AND user_nicename IN ( 'peter','paul','mary' )", $q->query_where);
		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 36624
	 */
	public function test_nicename__not_in_returns_users_without_included_nicenames() {
		wp_update_user( array(
			'ID' => self::$author_ids[0],
			'user_nicename' => 'peter'
		) );

		wp_update_user( array(
			'ID' => self::$author_ids[1],
			'user_nicename' => 'paul'
		) );

		wp_update_user( array(
			'ID' => self::$author_ids[2],
			'user_nicename' => 'mary'
		) );

		$q = new WP_User_Query( array (
			'nicename__not_in' => array( 'peter', 'paul', 'mary' )
		) );

		$foundCount = count($q->get_results());
		$expectedCount = 10; // 13 total users minus 3 from query

		$this->assertContains( "AND user_nicename NOT IN ( 'peter','paul','mary' )", $q->query_where);
		$this->assertEquals( $expectedCount, $foundCount );
	}

	/**
	 * @ticket 36624
	 */
	public function test_orderby_nicename__in() {
		wp_update_user( array(
			'ID' => self::$author_ids[0],
			'user_nicename' => 'peter'
		) );

		wp_update_user( array(
			'ID' => self::$author_ids[1],
			'user_nicename' => 'paul'
		) );

		wp_update_user( array(
			'ID' => self::$author_ids[2],
			'user_nicename' => 'mary'
		) );

		$q = new WP_User_Query( array (
			'nicename__in' => array( 'mary', 'peter', 'paul' ),
			'orderby' => 'nicename__in'
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[2], self::$author_ids[0], self::$author_ids[1] );

		$this->assertContains( "FIELD( user_nicename, 'mary','peter','paul' )", $q->query_orderby);
		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 36624
	 */
	public function test_login_returns_user_with_login() {

		$user_login = get_userdata( self::$author_ids[0] )->user_login;

		$q = new WP_User_Query( array (
			'login' => $user_login
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[0] );

		$this->assertContains( "AND user_login = '$user_login'", $q->query_where);
		$this->assertEqualSets( $expected, $found);
	}

	/**
	 * @ticket 36624
	 */
	public function test_login__in_returns_users_with_included_logins() {
		$user_login1 = get_userdata( self::$author_ids[0] )->user_login;
		$user_login2 = get_userdata( self::$author_ids[1] )->user_login;
		$user_login3 = get_userdata( self::$author_ids[2] )->user_login;

		$q = new WP_User_Query( array (
			'login__in' => array( $user_login1, $user_login2, $user_login3 )
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[0], self::$author_ids[1], self::$author_ids[2] );

		$this->assertContains( "AND user_login IN ( '$user_login1','$user_login2','$user_login3' )", $q->query_where);
		$this->assertEqualSets( $expected, $found );
	}

	/**
	 * @ticket 36624
	 */
	public function test_login__not_in_returns_users_without_included_logins() {
		$user_login1 = get_userdata( self::$author_ids[0] )->user_login;
		$user_login2 = get_userdata( self::$author_ids[1] )->user_login;
		$user_login3 = get_userdata( self::$author_ids[2] )->user_login;

		$q = new WP_User_Query( array (
			'login__not_in' => array( $user_login1, $user_login2, $user_login3 )
		) );

		$foundCount = count($q->get_results());
		$expectedCount = 10; // 13 total users minus 3 from query

		$this->assertContains( "AND user_login NOT IN ( '$user_login1','$user_login2','$user_login3' )", $q->query_where);
		$this->assertEquals( $expectedCount, $foundCount );
	}

	/**
	 * @ticket 36624
	 */
	public function test_orderby_login__in() {
		$user_login1 = get_userdata( self::$author_ids[0] )->user_login;
		$user_login2 = get_userdata( self::$author_ids[1] )->user_login;
		$user_login3 = get_userdata( self::$author_ids[2] )->user_login;

		$q = new WP_User_Query( array (
			'login__in' => array( $user_login2, $user_login3, $user_login1 ),
			'orderby' => 'login__in'
		) );

		$found = wp_list_pluck( $q->get_results(), 'ID' );
		$expected = array( self::$author_ids[1], self::$author_ids[2], self::$author_ids[0] );

		$this->assertContains( "FIELD( user_login, '$user_login2','$user_login3','$user_login1' )", $q->query_orderby);
		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 25145
	 */
	public function test_paged() {
		$q = new WP_User_Query( array(
			'number' => 2,
			'paged' => 2,
			'orderby' => 'ID',
			'order' => 'DESC', // Avoid funkiness with user 1.
			'fields' => 'ids',
		) );

		$this->assertEquals( array( self::$contrib_id, self::$editor_ids[2] ), $q->results );
	}

	/**
	 * @ticket 33449
	 */
	public function test_query_vars_should_be_filled_in_after_pre_get_users() {
		$query_vars = array( 'blog_id', 'role', 'meta_key', 'meta_value', 'meta_compare', 'include', 'exclude', 'search', 'search_columns', 'orderby', 'order', 'offset', 'number', 'paged', 'count_total', 'fields', 'who', 'has_published_posts' );

		add_action( 'pre_get_users', array( $this, 'filter_pre_get_users_args' ) );
		$q = new WP_User_Query( array_fill_keys( $query_vars, '1' ) );
		remove_action( 'pre_get_users', array( $this, 'filter_pre_get_users_args' ) );

		foreach ( $query_vars as $query_var ) {
			$this->assertTrue( array_key_exists( $query_var, $q->query_vars ), "$query_var does not exist." );
		}

	}

	public function filter_pre_get_users_args( $q ) {
		foreach ( $q->query_vars as $k => $v ) {
			unset( $q->query_vars[ $k ] );
		}
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_single_role_by_user_query() {
		$wp_user_search = new WP_User_Query( array( 'role' => 'subscriber' ) );
		$users          = $wp_user_search->get_results();

		$this->assertEquals( 2, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_multiple_roles_by_user_query() {
		$wp_user_search = new WP_User_Query( array( 'role__in' => array( 'subscriber', 'editor' ) ) );
		$users          = $wp_user_search->get_results();
		$this->assertEquals( 5, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_single_role_by_string() {
		$users = get_users( array(
			'role' => 'subscriber',
		) );

		$this->assertEquals( 2, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_single_role_by_string_which_is_similar() {
		$another_editor = self::factory()->user->create( array(
			'user_email' => 'another_editor@another_editor.com',
			'user_login' => 'another_editor',
			'role' => 'another-editor',
		) );

		$users = get_users( array(
			'role' => 'editor',
			'fields' => 'ids',
		) );

		$this->assertEqualSets( self::$editor_ids, $users );
	}


	/**
	 * @ticket 22212
	 */
	public function test_get_single_role_by_array() {
		$users = get_users( array(
			'role' => array( 'subscriber' ),
		) );

		$this->assertEquals( 2, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_multiple_roles_should_only_match_users_who_have_each_role() {
		$users = new WP_User_Query( array( 'role' => array( 'subscriber', 'editor' ) ) );
		$users = $users->get_results();

		$this->assertEmpty( $users );

		foreach ( self::$sub_ids as $subscriber ) {
			$subscriber = get_user_by( 'ID', $subscriber );
			$subscriber->add_role( 'editor' );
		}

		$users = new WP_User_Query( array( 'role' => array( 'subscriber', 'editor' ) ) );
		$users = $users->get_results();

		$this->assertEquals( 2, count( $users ) );

		foreach ( $users as $user ) {
			$this->assertInstanceOf( 'WP_User', $user );
		}
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_multiple_roles_or() {
		$users = new WP_User_Query( array( 'role__in' => array( 'subscriber', 'editor', 'administrator' ) ) );
		$users = $users->get_results();

		// +1 for the default user created during installation.
		$this->assertEquals( 8, count( $users ) );
		foreach ( $users as $user ) {
			$this->assertInstanceOf( 'WP_User', $user );
		}
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_multiple_roles_by_comma_separated_list() {
		$users = get_users( array(
			'role' => 'subscriber, editor',
		) );

		$this->assertEmpty( $users );

		foreach ( self::$sub_ids as $subscriber ) {
			$subscriber = get_user_by( 'ID', $subscriber );
			$subscriber->add_role( 'editor' );
		}

		$users = get_users( array(
			'role' => 'subscriber, editor',
		) );

		$this->assertEquals( 2, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_get_multiple_roles_with_meta() {
		// Create administrator user + meta
		update_user_meta( self::$admin_ids[0], 'mk1', 1 );
		update_user_meta( self::$admin_ids[0], 'mk2', 1 );

		// Create editor user + meta
		update_user_meta( self::$editor_ids[0], 'mk1', 1 );
		update_user_meta( self::$editor_ids[0], 'mk2', 2 );

		// Create subscriber user + meta
		update_user_meta( self::$sub_ids[0], 'mk1', 1 );
		update_user_meta( self::$sub_ids[0], 'mk2', 1 );

		// Create contributor user + meta
		update_user_meta( self::$contrib_id, 'mk1', 1 );
		update_user_meta( self::$contrib_id, 'mk2', 2 );

		// Fetch users
		$users = get_users( array(
			'role__in'   => array( 'administrator', 'editor', 'subscriber' ),
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key'     => 'mk1',
					'value'   => '1',
					'compare' => "=",
					'type'    => 'numeric',
				),
				array(
					'key'     => 'mk2',
					'value'   => '2',
					'compare' => "=",
					'type'    => 'numeric',
				),
			),
		) );

		// Check results
		$this->assertEquals( 1, count( $users ) );
		$this->assertSame( self::$editor_ids[0], (int) $users[0]->ID );
	}

	/**
	 * @ticket 22212
	 */
	public function test_role_exclusion() {
		$users = get_users( array(
			'role__not_in' => 'subscriber',
		) );

		// +1 for the default user created during installation.
		$this->assertEquals( 11, count( $users ) );

		$users = get_users( array(
			'role__not_in' => 'editor',
		) );

		// +1 for the default user created during installation.
		$this->assertEquals( 10, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_role__in_role__not_in_combined() {
		foreach ( self::$sub_ids as $subscriber ) {
			$subscriber = get_user_by( 'ID', $subscriber );
			$subscriber->add_role( 'editor' );
		}

		$users = get_users( array(
			'role__in'     => 'editor',
		) );

		$this->assertEquals( 5, count( $users ) );

		$users = get_users( array(
			'role__in'     => 'editor',
			'role__not_in' => 'subscriber',
		) );

		$this->assertEquals( 3, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_role__not_in_role_combined() {
		$subscriber = get_user_by( 'ID', self::$sub_ids[0] );
		$subscriber->add_role( 'editor' );

		$users = get_users( array(
			'role'         => 'subscriber',
			'role__not_in' => array( 'editor' ),
		) );

		$this->assertEquals( 1, count( $users ) );
	}

	/**
	 * @ticket 22212
	 */
	public function test_role__not_in_user_without_role() {
		$user_without_rule = get_user_by( 'ID', self::$sub_ids[0] );

		$user_without_rule->remove_role( 'subscriber' );

		$users = get_users( array(
			'role__not_in' => 'subscriber',
		) );

		// +1 for the default user created during installation.
		$this->assertEquals( 12, count( $users ) );

		$users = get_users( array(
			'role__not_in' => 'editor',
		) );

		// +1 for the default user created during installation.
		$this->assertEquals( 10, count( $users ) );
	}

	/**
	 * @ticket 22212
	 * @group ms-required
	 */
	public function test_blog_id_should_restrict_by_blog_without_requiring_a_named_role() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires multisite.' );
		}

		$sites = self::factory()->blog->create_many( 2 );

		add_user_to_blog( $sites[0], self::$author_ids[0], 'author' );
		add_user_to_blog( $sites[1], self::$author_ids[1], 'author' );

		$found = get_users( array(
			'blog_id' => $sites[1],
			'fields' => 'ID',
		) );

		$this->assertEqualSets( array( self::$author_ids[1] ), $found );
	}

	/**
	 * @ticket 22212
	 * @ticket 21119
	 * @group ms-required
	 */
	public function test_calling_prepare_query_a_second_time_should_not_add_another_cap_query_on_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( __METHOD__ . ' requires Multisite.' );
		}

		$site_id = get_current_blog_id();
		add_user_to_blog( $site_id, self::$author_ids[0], 'author' );

		$q = new WP_User_Query( array(
			'include' => self::$author_ids[0],
		) );

		$r1 = $q->request;

		$q->prepare_query( array(
			'include' => self::$author_ids[0],
		) );

		$r2 = $q->request;

		$q->prepare_query( array(
			'include' => self::$author_ids[0],
		) );

		$r3 = $q->request;

		$this->assertSame( $r1, $r2 );
		$this->assertSame( $r1, $r3 );
	}
}
