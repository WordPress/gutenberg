<?php

/**
 * @group post
 */
class Tests_Post_Objects extends WP_UnitTestCase {

	function test_get_post() {
		$id = $this->factory->post->create();

		$post = get_post( $id );
		$this->assertInstanceOf( 'WP_Post', $post );
		$this->assertEquals( $id, $post->ID );
		$this->assertTrue( isset( $post->ancestors ) );
		$this->assertEquals( array(), $post->ancestors );

		// Unset and then verify that the magic method fills the property again
		unset( $post->ancestors );
		$this->assertEquals( array(), $post->ancestors );

		// Magic get should make meta accessible as properties
		add_post_meta( $id, 'test', 'test' );
		$this->assertEquals( 'test', get_post_meta( $id, 'test', true ) );
		$this->assertEquals( 'test', $post->test );

		// Make sure meta does not eclipse true properties
		add_post_meta( $id, 'post_type', 'dummy' );
		$this->assertEquals( 'dummy', get_post_meta( $id, 'post_type', true ) );
		$this->assertEquals( 'post', $post->post_type );

		// Excercise the output argument
		$post = get_post( $id, ARRAY_A );
		$this->assertInternalType( 'array', $post );
		$this->assertEquals( 'post', $post[ 'post_type' ] );

		$post = get_post( $id, ARRAY_N );
		$this->assertInternalType( 'array', $post );
		$this->assertFalse( isset( $post[ 'post_type' ] ) );
		$this->assertTrue( in_array( 'post', $post ) );

		$post = get_post( $id );
		$post = get_post( $post, ARRAY_A );
		$this->assertInternalType( 'array', $post );
		$this->assertEquals( 'post', $post[ 'post_type' ] );
		$this->assertEquals( $id, $post[ 'ID' ] );

		// Should default to OBJECT when given invalid output argument
		$post = get_post( $id, 'invalid-output-value' );
		$this->assertInstanceOf( 'WP_Post', $post );
		$this->assertEquals( $id, $post->ID );

		// Make sure stdClass in $GLOBALS['post'] is handled
		$post_std = $post->to_array();
		$this->assertInternalType( 'array', $post_std );
		$post_std = (object) $post_std;
		$GLOBALS['post'] = $post_std;
		$post = get_post( null );
		$this->assertInstanceOf( 'WP_Post', $post );
		$this->assertEquals( $id, $post->ID );
		unset( $GLOBALS['post'] );

		// If no global post and passing empty value, expect null.
		$this->assertNull( get_post( null ) );
		$this->assertNull( get_post( 0 ) );
		$this->assertNull( get_post( '' ) );
		$this->assertNull( get_post( false ) );
	}

	function test_get_post_ancestors() {
		$parent_id = $this->factory->post->create();
		$child_id = $this->factory->post->create();
		$grandchild_id = $this->factory->post->create();
		$updated = wp_update_post( array( 'ID' => $child_id, 'post_parent' => $parent_id ) );
		$this->assertEquals( $updated, $child_id );
		$updated = wp_update_post( array( 'ID' => $grandchild_id, 'post_parent' => $child_id ) );
		$this->assertEquals( $updated, $grandchild_id );

		$this->assertEquals( array( $parent_id ), get_post( $child_id )->ancestors );
		$this->assertEquals( array( $parent_id ), get_post_ancestors( $child_id ) );
		$this->assertEquals( array( $parent_id ), get_post_ancestors( get_post( $child_id ) ) );

		$this->assertEquals( array( $child_id, $parent_id ), get_post( $grandchild_id )->ancestors );
		$this->assertEquals( array( $child_id, $parent_id ), get_post_ancestors( $grandchild_id ) );
		$this->assertEquals( array( $child_id, $parent_id ), get_post_ancestors( get_post( $grandchild_id ) ) );

		$this->assertEquals( array(), get_post( $parent_id )->ancestors );
		$this->assertEquals( array(), get_post_ancestors( $parent_id ) );
		$this->assertEquals( array(), get_post_ancestors( get_post( $parent_id ) ) );
	}

	/**
	 * @ticket 22882
	 */
	function test_get_post_ancestors_with_falsey_values() {
		foreach ( array( null, 0, false, '0', '' ) as $post_id ) {
			$this->assertInternalType( 'array', get_post_ancestors( $post_id ) );
			$this->assertEquals( array(), get_post_ancestors( $post_id ) );
		}
	}

	function test_get_post_category_property() {
		$post_id = $this->factory->post->create();
		$post = get_post( $post_id );

		$this->assertInternalType( 'array', $post->post_category );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = wp_insert_term( 'Bar', 'category' );
		$term3 = wp_insert_term( 'Baz', 'category' );
		wp_set_post_categories( $post_id, array( $term1['term_id'], $term2['term_id'], $term3['term_id'] ) );
		$this->assertEquals( 3, count( $post->post_category ) );
		$this->assertEquals( array( $term2['term_id'], $term3['term_id'], $term1['term_id'] ) , $post->post_category );

		$post = get_post( $post_id, ARRAY_A );
		$this->assertEquals( 3, count( $post['post_category'] ) );
		$this->assertEquals( array( $term2['term_id'], $term3['term_id'], $term1['term_id'] ) , $post['post_category'] );
	}

	function test_get_tags_input_property() {
		$post_id = $this->factory->post->create();
		$post = get_post( $post_id );

		$this->assertInternalType( 'array', $post->tags_input );
		$this->assertEmpty( $post->tags_input );
		wp_set_post_tags( $post_id, 'Foo, Bar, Baz' );
		$this->assertInternalType( 'array', $post->tags_input );
		$this->assertEquals( 3, count( $post->tags_input ) );
		$this->assertEquals( array( 'Bar', 'Baz', 'Foo' ), $post->tags_input );

		$post = get_post( $post_id, ARRAY_A );
		$this->assertInternalType( 'array', $post['tags_input'] );
		$this->assertEquals( 3, count( $post['tags_input'] ) );
		$this->assertEquals( array( 'Bar', 'Baz', 'Foo' ), $post['tags_input'] );
	}

	function test_get_page_template_property() {
		$post_id = $this->factory->post->create();
		$post = get_post( $post_id );

		$this->assertInternalType( 'string', $post->page_template );
		$this->assertEmpty( $post->tags_input );
		$template = get_post_meta( $post->ID, '_wp_page_template', true );
		$this->assertEquals( $template, $post->page_template );
		update_post_meta( $post_id, '_wp_page_template', 'foo.php' );
		$template = get_post_meta( $post->ID, '_wp_page_template', true );
		$this->assertEquals( 'foo.php', $template );
		// The post is not a page so the template is still empty
		$this->assertEquals( '', $post->page_template );

		// Now the post is a page and should retrieve the template
		wp_update_post( array( 'ID' => $post->ID, 'post_type' => 'page' ) );
		$post = get_post( $post_id );
		$this->assertEquals( $template, $post->page_template );
	}

	function test_get_post_filter() {
		$post = get_post( $this->factory->post->create( array(
			'post_title' => "Mary's home"
		) ) );

		$this->assertEquals( 'raw', $post->filter );
		$this->assertInternalType( 'int', $post->post_parent );

		$display_post = get_post( $post, OBJECT, 'js' );
		$this->assertEquals( 'js', $display_post->filter );
		$this->assertEquals( esc_js( "Mary's home" ), $display_post->post_title );

		// Pass a js filtered WP_Post to get_post() with the filter set to raw.
		// The post should be fetched from cache instead of using the passed object.
		$raw_post = get_post( $display_post, OBJECT, 'raw' );
		$this->assertEquals( 'raw', $raw_post->filter );
		$this->assertNotEquals( esc_js( "Mary's home" ), $raw_post->post_title );

		$raw_post->filter( 'js' );
		$this->assertEquals( 'js', $post->filter );
		$this->assertEquals( esc_js( "Mary's home" ), $raw_post->post_title );
	}

	function test_get_post_identity() {
		$post = get_post( $this->factory->post->create() );

		$post->foo = 'bar';

		$this->assertEquals( 'bar', get_post( $post )->foo );
		$this->assertEquals( 'bar', get_post( $post, OBJECT, 'display' )->foo );
	}

	function test_get_post_array() {
		$id = $this->factory->post->create();

		$post = get_post( $id, ARRAY_A );

		$this->assertEquals( $id, $post['ID'] );
		$this->assertInternalType( 'array', $post['ancestors'] );
		$this->assertEquals( 'raw', $post['filter'] );
	}

	/**
	 * @ticket 22223
	 */
	function test_get_post_cache() {
		global $wpdb;

		$id = $this->factory->post->create();
		wp_cache_delete( $id, 'posts' );

		// get_post( stdClass ) should not prime the cache
		$post = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->posts WHERE ID = %d LIMIT 1", $id ) );
		$post = get_post( $post );
		$this->assertEmpty( wp_cache_get( $id, 'posts' ) );

		// get_post( WP_Post ) should not prime the cache
		get_post( $post );
		$this->assertEmpty( wp_cache_get( $id, 'posts' ) );

		// get_post( ID ) should prime the cache
		get_post( $post->ID );
		$this->assertNotEmpty( wp_cache_get( $id, 'posts' ) );
	}
}
