<?php

/**
 * @group meta
 */
class Tests_Meta extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->author = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );
		$this->meta_id = add_metadata( 'user', $this->author->ID, 'meta_key', 'meta_value' );
		$this->delete_meta_id = add_metadata( 'user', $this->author->ID, 'delete_meta_key', 'delete_meta_value' );
	}

	function _meta_sanitize_cb ( $meta_value, $meta_key, $meta_type ) {
		return 'sanitized';
	}

	function test_sanitize_meta() {
		$meta = sanitize_meta( 'some_meta', 'unsanitized', 'post' );
		$this->assertEquals( 'unsanitized', $meta );

		register_meta( 'post', 'some_meta', array( $this, '_meta_sanitize_cb' ) );
		$meta = sanitize_meta( 'some_meta', 'unsanitized', 'post' );
		$this->assertEquals( 'sanitized', $meta );
	}

	function test_delete_metadata_by_mid() {
		// Let's try and delete a non-existing ID, non existing meta
		$this->assertFalse( delete_metadata_by_mid( 'user', 0 ) );
		$this->assertFalse( delete_metadata_by_mid( 'non_existing_meta', $this->delete_meta_id ) );

		// Now let's delete the real meta data
		$this->assertTrue( delete_metadata_by_mid( 'user', $this->delete_meta_id ) );

		// And make sure it's been deleted
		$this->assertFalse( get_metadata_by_mid( 'user', $this->delete_meta_id ) );

		// Make sure the caches are cleared
		$this->assertFalse( (bool) get_user_meta( $this->author->ID, 'delete_meta_key' ) );
	}

	function test_update_metadata_by_mid() {
		// Setup
		$meta = get_metadata_by_mid( 'user', $this->meta_id );

		// Update the meta value
		$this->assertTrue( update_metadata_by_mid( 'user', $this->meta_id, 'meta_new_value' ) );
		$meta = get_metadata_by_mid( 'user', $this->meta_id );
		$this->assertEquals( 'meta_new_value', $meta->meta_value );

		// Update the meta value
		$this->assertTrue( update_metadata_by_mid( 'user', $this->meta_id, 'meta_new_value', 'meta_new_key' ) );
		$meta = get_metadata_by_mid( 'user', $this->meta_id );
		$this->assertEquals( 'meta_new_key', $meta->meta_key );

		// Update the key and value
		$this->assertTrue( update_metadata_by_mid( 'user', $this->meta_id, 'meta_value', 'meta_key' ) );
		$meta = get_metadata_by_mid( 'user', $this->meta_id );
		$this->assertEquals( 'meta_key', $meta->meta_key );
		$this->assertEquals( 'meta_value', $meta->meta_value );

		// Update the value that has to be serialized
		$this->assertTrue( update_metadata_by_mid( 'user', $this->meta_id, array( 'first', 'second' ) ) );
		$meta = get_metadata_by_mid( 'user', $this->meta_id );
		$this->assertEquals( array( 'first', 'second' ), $meta->meta_value );

		// Let's try some invalid meta data
		$this->assertFalse( update_metadata_by_mid( 'user', 0, 'meta_value' ) );
		$this->assertFalse( update_metadata_by_mid( 'user', $this->meta_id, 'meta_value', array('invalid', 'key' ) ) );

		// Let's see if caches get cleared after updates.
		$meta = get_metadata_by_mid( 'user', $this->meta_id );
		$first = get_user_meta( $meta->user_id, $meta->meta_key );
		$this->assertTrue( update_metadata_by_mid( 'user', $this->meta_id, 'other_meta_value' ) );
		$second = get_user_meta( $meta->user_id, $meta->meta_key );
		$this->assertFalse( $first === $second );
	}

	function test_metadata_exists() {
		$this->assertFalse( metadata_exists( 'user',  $this->author->ID, 'foobarbaz' ) );
		$this->assertTrue( metadata_exists( 'user',  $this->author->ID, 'meta_key' ) );
		$this->assertFalse( metadata_exists( 'user',  1234567890, 'foobarbaz' ) );
		$this->assertFalse( metadata_exists( 'user',  1234567890, 'meta_key' ) );
	}

	/**
	 * @ticket 22746
	 */
	function test_metadata_exists_with_filter() {
		// Let's see if it returns the correct value when adding a filter.
		add_filter( 'get_user_metadata', '__return_zero' );
		$this->assertFalse( metadata_exists( 'user', $this->author->ID, 'meta_key' ) ); // existing meta key
		$this->assertFalse( metadata_exists( 'user', 1234567890, 'meta_key' ) );
		remove_filter( 'get_user_metadata', '__return_zero' );
	}

	/**
	 * @ticket 18158
	 */
	function test_user_metadata_not_exists() {
		$u = get_users( array(
			'meta_query' => array(
				array( 'key' => 'meta_key', 'compare' => 'NOT EXISTS' )
			)
		) );

		$this->assertEquals( 1, count( $u ) );

		// User found is not locally defined author (it's the admin)
		$this->assertNotEquals( $this->author->user_login, $u[0]->user_login );

		// Test EXISTS and NOT EXISTS together, no users should be found
		$this->assertEquals( 0, count( get_users( array(
			'meta_query' => array(
				array( 'key' => 'meta_key', 'compare' => 'NOT EXISTS' ),
				array( 'key' => 'delete_meta_key', 'compare' => 'EXISTS' )
			)
		) ) ) );

		$this->assertEquals( 2, count( get_users( array(
			'meta_query' => array(
				array( 'key' => 'non_existing_meta', 'compare' => 'NOT EXISTS' )
			)
		) ) ) );

		delete_metadata( 'user', $this->author->ID, 'meta_key' );

		$this->assertEquals( 2, count( get_users( array(
			'meta_query' => array(
				array( 'key' => 'meta_key', 'compare' => 'NOT EXISTS' )
			)
		) ) ) );
	}

	function test_metadata_slashes() {
		$key = rand_str();
		$value = 'Test\\singleslash';
		$expected = 'Testsingleslash';
		$value2 = 'Test\\\\doubleslash';
		$expected2 = 'Test\\doubleslash';
		$this->assertFalse( metadata_exists( 'user', $this->author->ID, $key ) );
		$this->assertFalse( delete_metadata( 'user', $this->author->ID, $key ) );
		$this->assertSame( '', get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertInternalType( 'int', add_metadata( 'user', $this->author->ID, $key, $value ) );
		$this->assertEquals( $expected, get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertTrue( delete_metadata( 'user', $this->author->ID, $key ) );
		$this->assertSame( '', get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertInternalType( 'int', update_metadata( 'user', $this->author->ID, $key, $value ) );
		$this->assertEquals( $expected, get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertTrue( update_metadata( 'user', $this->author->ID, $key, 'blah' ) );
		$this->assertEquals( 'blah', get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertTrue( delete_metadata( 'user', $this->author->ID, $key ) );
		$this->assertSame( '', get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertFalse( metadata_exists( 'user', $this->author->ID, $key ) );

		// Test overslashing
		$this->assertInternalType( 'int', add_metadata( 'user', $this->author->ID, $key, $value2 ) );
		$this->assertEquals( $expected2, get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertTrue( delete_metadata( 'user', $this->author->ID, $key ) );
		$this->assertSame( '', get_metadata( 'user', $this->author->ID, $key, true ) );
		$this->assertInternalType( 'int', update_metadata( 'user', $this->author->ID, $key, $value2 ) );
		$this->assertEquals( $expected2, get_metadata( 'user', $this->author->ID, $key, true ) );
	}

	function test_meta_type_cast() {
		$post_id1 = $this->factory->post->create();
		add_post_meta( $post_id1, 'num_as_longtext', 123 );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'num_as_longtext', 99 );

		$posts = new WP_Query( array(
			'fields' => 'ids',
			'post_type' => 'any',
			'meta_key' => 'num_as_longtext',
			'meta_value' => '0',
			'meta_compare' => '>',
			'meta_type' => 'UNSIGNED',
			'orderby' => 'meta_value',
			'order' => 'ASC'
		) );

		$this->assertEquals( array( $post_id2, $post_id1 ), $posts->posts );
		$this->assertEquals( 2, substr_count( $posts->request, 'CAST(' ) );
	}

	function test_meta_cache_order_asc() {
		$post_id = $this->factory->post->create();
		$colors = array( 'red', 'blue', 'yellow', 'green' );
		foreach ( $colors as $color )
			add_post_meta( $post_id, 'color', $color );

		foreach ( range( 1, 10 ) as $i ) {
			$meta = get_post_meta( $post_id, 'color' );
			$this->assertEquals( $meta, $colors );

			if ( 0 === $i % 2 )
				wp_cache_delete( $post_id, 'post_meta' );
		}
	}

	function test_query_meta_query_order() {
		$post1 = $this->factory->post->create( array( 'post_title' => 'meta-value-1', 'post_date' => '2007-01-01 00:00:00' ) );
		$post2 = $this->factory->post->create( array( 'post_title' => 'meta-value-2', 'post_date' => '2007-01-01 00:00:00' ) );
		$post3 = $this->factory->post->create( array( 'post_title' => 'meta-value-3', 'post_date' => '2007-01-01 00:00:00' ) );

		add_post_meta( $post1, 'order', 1 );
		add_post_meta( $post2, 'order', 2 );
		add_post_meta( $post3, 'order', 3 );

		$args = array(
			'post_type' => 'post',
			'meta_key' => 'order',
			'meta_value' => 1,
			'meta_compare' => '>=',
			'orderby' => 'meta_value'
		);

		$args2 = array(
			'post_type' => 'post',
			'meta_key' => 'order',
			'meta_value' => 1,
			'meta_compare' => '>=',
			'orderby' => 'meta_value',
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'order',
					'compare' => '>=',
					'value' => 1
				)
			)
		);

		$posts = get_posts( $args );
		$posts2 = get_posts( $args2 );

		$this->assertEquals( wp_list_pluck( $posts, 'post_title' ), wp_list_pluck( $posts2, 'post_title' ) );
	}
}
