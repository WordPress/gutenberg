<?php

/**
 * @group post
 * @group meta
 */
class Tests_Post_Meta extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();

		$this->author = new WP_User( $this->factory->user->create( array( 'role' => 'editor' ) ) );

		$post = array(
			'post_author' => $this->author->ID,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
		);

		// insert a post
		$this->post_id = wp_insert_post($post);


		$post = array(
			'post_author' => $this->author->ID,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
		);

		// insert a post
		$this->post_id_2 = wp_insert_post($post);
	}

	function tearDown() {
		wp_delete_post($this->post_id);
		wp_delete_post($this->post_id_2);
		parent::tearDown();
	}

	function test_unique_postmeta() {
		// Add a unique post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'unique', 'value', true) );

		// Check unique is enforced
		$this->assertFalse(add_post_meta($this->post_id, 'unique', 'another value', true));

		//Check it exists
		$this->assertEquals('value', get_post_meta($this->post_id, 'unique', true));
		$this->assertEquals(array('value'), get_post_meta($this->post_id, 'unique', false));

		//Fail to delete the wrong value
		$this->assertFalse(delete_post_meta($this->post_id, 'unique', 'wrong value'));

		//Delete it
		$this->assertTrue(delete_post_meta($this->post_id, 'unique', 'value'));

		//Check it is deleted
		$this->assertEquals('', get_post_meta($this->post_id, 'unique', true));
		$this->assertEquals(array(), get_post_meta($this->post_id, 'unique', false));

	}

	function test_nonunique_postmeta() {
		// Add two non unique post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'nonunique', 'value') );
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'nonunique', 'another value'));

		//Check they exists
		$this->assertEquals('value', get_post_meta($this->post_id, 'nonunique', true));
		$this->assertEquals(array('value', 'another value'), get_post_meta($this->post_id, 'nonunique', false));

		//Fail to delete the wrong value
		$this->assertFalse(delete_post_meta($this->post_id, 'nonunique', 'wrong value'));

		//Delete the first one
		$this->assertTrue(delete_post_meta($this->post_id, 'nonunique', 'value'));

		//Check the remainder exists
		$this->assertEquals('another value', get_post_meta($this->post_id, 'nonunique', true));
		$this->assertEquals(array('another value'), get_post_meta($this->post_id, 'nonunique', false));

		//Add a third one
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'nonunique', 'someother value') );

		//Check they exists
		$expected = array(
			'someother value',
			'another value'
		);
		sort( $expected );
		$this->assertTrue( in_array( get_post_meta( $this->post_id, 'nonunique', true ), $expected ) );
		$actual = get_post_meta( $this->post_id, 'nonunique', false );
		sort( $actual );
		$this->assertEquals( $expected, $actual );

		//Delete the lot
		$this->assertTrue(delete_post_meta_by_key('nonunique'));
	}

	function test_update_post_meta() {
		// Add a unique post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'unique_update', 'value', true) );

		// Add two non unique post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'nonunique_update', 'value') );
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'nonunique_update', 'another value') );

		//Check they exists
		$this->assertEquals('value', get_post_meta($this->post_id, 'unique_update', true));
		$this->assertEquals(array('value'), get_post_meta($this->post_id, 'unique_update', false));
		$this->assertEquals('value', get_post_meta($this->post_id, 'nonunique_update', true));
		$this->assertEquals(array('value', 'another value'), get_post_meta($this->post_id, 'nonunique_update', false));

		// Update them
		$this->assertTrue(update_post_meta($this->post_id, 'unique_update', 'new', 'value'));
		$this->assertTrue(update_post_meta($this->post_id, 'nonunique_update', 'new', 'value'));
		$this->assertTrue(update_post_meta($this->post_id, 'nonunique_update', 'another new', 'another value'));

		//Check they updated
		$this->assertEquals('new', get_post_meta($this->post_id, 'unique_update', true));
		$this->assertEquals(array('new'), get_post_meta($this->post_id, 'unique_update', false));
		$this->assertEquals('new', get_post_meta($this->post_id, 'nonunique_update', true));
		$this->assertEquals(array('new', 'another new'), get_post_meta($this->post_id, 'nonunique_update', false));

	}

	function test_delete_post_meta() {
		// Add a unique post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'unique_delete', 'value', true) );
		$this->assertInternalType( 'integer', add_post_meta($this->post_id_2, 'unique_delete', 'value', true) );

		//Check they exists
		$this->assertEquals('value', get_post_meta($this->post_id, 'unique_delete', true));
		$this->assertEquals('value', get_post_meta($this->post_id_2, 'unique_delete', true));

		//Delete one of them
		$this->assertTrue(delete_post_meta($this->post_id, 'unique_delete', 'value'));

		//Check the other still exitsts
		$this->assertEquals('value', get_post_meta($this->post_id_2, 'unique_delete', true));


	}

	function test_delete_post_meta_by_key() {
		// Add a unique post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'unique_delete_by_key', 'value', true) );
		$this->assertInternalType( 'integer', add_post_meta($this->post_id_2, 'unique_delete_by_key', 'value', true) );

		//Check they exist
		$this->assertEquals('value', get_post_meta($this->post_id, 'unique_delete_by_key', true));
		$this->assertEquals('value', get_post_meta($this->post_id_2, 'unique_delete_by_key', true));

		//Delete one of them
		$this->assertTrue(delete_post_meta_by_key('unique_delete_by_key'));

		//Check the other still exists
		$this->assertEquals('', get_post_meta($this->post_id_2, 'unique_delete_by_key', true));
		$this->assertEquals('', get_post_meta($this->post_id_2, 'unique_delete_by_key', true));
	}

	function test_get_post_meta_by_id() {
		$mid = add_post_meta( $this->post_id, 'get_post_meta_by_key', 'get_post_meta_by_key_value', true );
		$this->assertInternalType( 'integer', $mid );

		$mobj = new stdClass;
		$mobj->meta_id = $mid;
		$mobj->post_id = $this->post_id;
		$mobj->meta_key = 'get_post_meta_by_key';
		$mobj->meta_value = 'get_post_meta_by_key_value';
		$this->assertEquals( $mobj, get_post_meta_by_id( $mid ) );
		delete_metadata_by_mid( 'post', $mid );

		$mid = add_post_meta( $this->post_id, 'get_post_meta_by_key', array( 'foo', 'bar' ), true );
		$this->assertInternalType( 'integer', $mid );
		$mobj->meta_id = $mid;
		$mobj->meta_value = array( 'foo', 'bar' );
		$this->assertEquals( $mobj, get_post_meta_by_id( $mid ) );
		delete_metadata_by_mid( 'post', $mid );
	}

	function test_delete_meta() {
		$mid = add_post_meta( $this->post_id, 'delete_meta', 'delete_meta_value', true );
		$this->assertInternalType( 'integer', $mid );

		$this->assertTrue( delete_meta( $mid ) );
		$this->assertFalse( get_metadata_by_mid( 'post', $mid ) );

		$this->assertFalse( delete_meta( 123456789 ) );
	}

	function test_update_meta() {
		// Add a unique post meta item
		$this->assertInternalType( 'integer', $mid1 = add_post_meta($this->post_id, 'unique_update', 'value', true) );

		// Add two non unique post meta item
		$this->assertInternalType( 'integer', $mid2 = add_post_meta($this->post_id, 'nonunique_update', 'value') );
		$this->assertInternalType( 'integer', $mid3 = add_post_meta($this->post_id, 'nonunique_update', 'another value') );

		//Check they exist
		$this->assertEquals('value', get_post_meta($this->post_id, 'unique_update', true));
		$this->assertEquals(array('value'), get_post_meta($this->post_id, 'unique_update', false));
		$this->assertEquals('value', get_post_meta($this->post_id, 'nonunique_update', true));
		$this->assertEquals(array('value', 'another value'), get_post_meta($this->post_id, 'nonunique_update', false));

		// Update them
		$this->assertTrue( update_meta( $mid1, 'unique_update', 'new' ) );
		$this->assertTrue( update_meta( $mid2, 'nonunique_update', 'new' ) );
		$this->assertTrue( update_meta( $mid3, 'nonunique_update', 'another new' ) );

		//Check they updated
		$this->assertEquals('new', get_post_meta($this->post_id, 'unique_update', true));
		$this->assertEquals(array('new'), get_post_meta($this->post_id, 'unique_update', false));
		$this->assertEquals('new', get_post_meta($this->post_id, 'nonunique_update', true));
		$this->assertEquals(array('new', 'another new'), get_post_meta($this->post_id, 'nonunique_update', false));

		// Slashed update
		$data = "'quote and \slash";
		$this->assertTrue( update_meta( $mid1, 'unique_update', addslashes( $data ) ) );
		$meta = get_metadata_by_mid( 'post', $mid1 );
		$this->assertEquals( $data, $meta->meta_value );
	}

	/**
	 * @ticket 12860
	 */
	function test_funky_post_meta() {
		$classy = new StdClass();
		$classy->ID = 1;
		$classy->stringy = "I love slashes\\\\";
		$funky_meta[] = $classy;

		$classy = new StdClass();
		$classy->ID = 2;
		$classy->stringy = "I love slashes\\\\ more";
		$funky_meta[] = $classy;

		// Add a post meta item
		$this->assertInternalType( 'integer', add_post_meta($this->post_id, 'test_funky_post_meta', $funky_meta, true) );

		//Check they exists
		$this->assertEquals($funky_meta, get_post_meta($this->post_id, 'test_funky_post_meta', true));

	}
}
