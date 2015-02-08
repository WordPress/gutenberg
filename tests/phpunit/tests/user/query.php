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
}
