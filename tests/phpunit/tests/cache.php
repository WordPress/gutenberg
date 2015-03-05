<?php

/**
 * @group cache
 */
class Tests_Cache extends WP_UnitTestCase {
	var $cache = NULL;

	function setUp() {
		parent::setUp();
		// create two cache objects with a shared cache dir
		// this simulates a typical cache situation, two separate requests interacting
		$this->cache =& $this->init_cache();
	}

	function tearDown() {
		$this->flush_cache();
		parent::tearDown();
	}

	function &init_cache() {
		$cache = new WP_Object_Cache();
		$cache->add_global_groups( array( 'global-cache-test', 'users', 'userlogins', 'usermeta', 'user_meta', 'site-transient', 'site-options', 'site-lookup', 'blog-lookup', 'blog-details', 'rss', 'global-posts', 'blog-id-cache' ) );
		return $cache;
	}

	function test_miss() {
		$this->assertEquals(NULL, $this->cache->get(rand_str()));
	}

	function test_add_get() {
		$key = rand_str();
		$val = rand_str();

		$this->cache->add($key, $val);
		$this->assertEquals($val, $this->cache->get($key));
	}

	function test_add_get_0() {
		$key = rand_str();
		$val = 0;

		// you can store zero in the cache
		$this->cache->add($key, $val);
		$this->assertEquals($val, $this->cache->get($key));
	}

	function test_add_get_null() {
		$key = rand_str();
		$val = null;

		$this->assertTrue( $this->cache->add($key, $val) );
		// null is converted to empty string
		$this->assertEquals( '', $this->cache->get($key) );
	}

	function test_add() {
		$key = rand_str();
		$val1 = rand_str();
		$val2 = rand_str();

		// add $key to the cache
		$this->assertTrue($this->cache->add($key, $val1));
		$this->assertEquals($val1, $this->cache->get($key));
		// $key is in the cache, so reject new calls to add()
		$this->assertFalse($this->cache->add($key, $val2));
		$this->assertEquals($val1, $this->cache->get($key));
	}

	function test_replace() {
		$key = rand_str();
		$val = rand_str();
		$val2 = rand_str();

		// memcached rejects replace() if the key does not exist
		$this->assertFalse($this->cache->replace($key, $val));
		$this->assertFalse($this->cache->get($key));
		$this->assertTrue($this->cache->add($key, $val));
		$this->assertEquals($val, $this->cache->get($key));
		$this->assertTrue($this->cache->replace($key, $val2));
		$this->assertEquals($val2, $this->cache->get($key));
	}

	function test_set() {
		$key = rand_str();
		$val1 = rand_str();
		$val2 = rand_str();

		// memcached accepts set() if the key does not exist
		$this->assertTrue($this->cache->set($key, $val1));
		$this->assertEquals($val1, $this->cache->get($key));
		// Second set() with same key should be allowed
		$this->assertTrue($this->cache->set($key, $val2));
		$this->assertEquals($val2, $this->cache->get($key));
	}

	function test_flush() {
		global $_wp_using_ext_object_cache;

		if ( $_wp_using_ext_object_cache )
			return;

		$key = rand_str();
		$val = rand_str();

		$this->cache->add($key, $val);
		// item is visible to both cache objects
		$this->assertEquals($val, $this->cache->get($key));
		$this->cache->flush();
		// If there is no value get returns false.
		$this->assertFalse($this->cache->get($key));
	}

	// Make sure objects are cloned going to and from the cache
	function test_object_refs() {
		$key = rand_str();
		$object_a = new stdClass;
		$object_a->foo = 'alpha';
		$this->cache->set( $key, $object_a );
		$object_a->foo = 'bravo';
		$object_b = $this->cache->get( $key );
		$this->assertEquals( 'alpha', $object_b->foo );
		$object_b->foo = 'charlie';
		$this->assertEquals( 'bravo', $object_a->foo );

		$key = rand_str();
		$object_a = new stdClass;
		$object_a->foo = 'alpha';
		$this->cache->add( $key, $object_a );
		$object_a->foo = 'bravo';
		$object_b = $this->cache->get( $key );
		$this->assertEquals( 'alpha', $object_b->foo );
		$object_b->foo = 'charlie';
		$this->assertEquals( 'bravo', $object_a->foo );
	}

	function test_incr() {
		$key = rand_str();

		$this->assertFalse( $this->cache->incr( $key ) );

		$this->cache->set( $key, 0 );
		$this->cache->incr( $key );
		$this->assertEquals( 1, $this->cache->get( $key ) );

		$this->cache->incr( $key, 2 );
		$this->assertEquals( 3, $this->cache->get( $key ) );
	}

	function test_wp_cache_incr() {
		$key = rand_str();

		$this->assertFalse( wp_cache_incr( $key ) );

		wp_cache_set( $key, 0 );
		wp_cache_incr( $key );
		$this->assertEquals( 1, wp_cache_get( $key ) );

		wp_cache_incr( $key, 2 );
		$this->assertEquals( 3, wp_cache_get( $key ) );
	}

	function test_decr() {
		$key = rand_str();

		$this->assertFalse( $this->cache->decr( $key ) );

		$this->cache->set( $key, 0 );
		$this->cache->decr( $key );
		$this->assertEquals( 0, $this->cache->get( $key ) );

		$this->cache->set( $key, 3 );
		$this->cache->decr( $key );
		$this->assertEquals( 2, $this->cache->get( $key ) );

		$this->cache->decr( $key, 2 );
		$this->assertEquals( 0, $this->cache->get( $key ) );
	}

	/**
	 * @group 21327
	 */
	function test_wp_cache_decr() {
		$key = rand_str();

		$this->assertFalse( wp_cache_decr( $key ) );

		wp_cache_set( $key, 0 );
		wp_cache_decr( $key );
		$this->assertEquals( 0, wp_cache_get( $key ) );

		wp_cache_set( $key, 3 );
		wp_cache_decr( $key );
		$this->assertEquals( 2, wp_cache_get( $key ) );

		wp_cache_decr( $key, 2 );
		$this->assertEquals( 0, wp_cache_get( $key ) );
	}

	function test_delete() {
		$key = rand_str();
		$val = rand_str();

		// Verify set
		$this->assertTrue( $this->cache->set( $key, $val ) );
		$this->assertEquals( $val, $this->cache->get( $key ) );

		// Verify successful delete
		$this->assertTrue( $this->cache->delete( $key ) );
		$this->assertFalse( $this->cache->get( $key ) );

		$this->assertFalse( $this->cache->delete( $key, 'default') );
	}

	function test_wp_cache_delete() {
		$key = rand_str();
		$val = rand_str();

		// Verify set
		$this->assertTrue( wp_cache_set( $key, $val ) );
		$this->assertEquals( $val, wp_cache_get( $key ) );

		// Verify successful delete
		$this->assertTrue( wp_cache_delete( $key ) );
		$this->assertFalse( wp_cache_get( $key ) );

		// wp_cache_delete() does not have a $force method.
		// Delete returns (bool) true when key is not set and $force is true
		// $this->assertTrue( wp_cache_delete( $key, 'default', true ) );

		$this->assertFalse( wp_cache_delete( $key, 'default') );
	}

	function test_switch_to_blog() {
		if ( ! method_exists( $this->cache, 'switch_to_blog' ) )
			return;

		$key = rand_str();
		$val = rand_str();
		$val2 = rand_str();

		if ( ! is_multisite() ) {
			// Single site ingnores switch_to_blog().
			$this->assertTrue( $this->cache->set( $key, $val ) );
			$this->assertEquals( $val, $this->cache->get( $key ) );
			$this->cache->switch_to_blog( 999 );
			$this->assertEquals( $val, $this->cache->get( $key ) );
			$this->assertTrue( $this->cache->set( $key, $val2 ) );
			$this->assertEquals( $val2, $this->cache->get( $key ) );
			$this->cache->switch_to_blog( get_current_blog_id() );
			$this->assertEquals( $val2, $this->cache->get( $key ) );
		} else {
			// Multisite should have separate per-blog caches
			$this->assertTrue( $this->cache->set( $key, $val ) );
			$this->assertEquals( $val, $this->cache->get( $key ) );
			$this->cache->switch_to_blog( 999 );
			$this->assertFalse( $this->cache->get( $key ) );
			$this->assertTrue( $this->cache->set( $key, $val2 ) );
			$this->assertEquals( $val2, $this->cache->get( $key ) );
			$this->cache->switch_to_blog( get_current_blog_id() );
			$this->assertEquals( $val, $this->cache->get( $key ) );
			$this->cache->switch_to_blog( 999 );
			$this->assertEquals( $val2, $this->cache->get( $key ) );
			$this->cache->switch_to_blog( get_current_blog_id() );
			$this->assertEquals( $val, $this->cache->get( $key ) );
		}

		// Global group
		$this->assertTrue( $this->cache->set( $key, $val, 'global-cache-test' ) );
		$this->assertEquals( $val, $this->cache->get( $key, 'global-cache-test' ) );
		$this->cache->switch_to_blog( 999 );
		$this->assertEquals( $val, $this->cache->get( $key, 'global-cache-test' ) );
		$this->assertTrue( $this->cache->set( $key, $val2, 'global-cache-test' ) );
		$this->assertEquals( $val2, $this->cache->get( $key, 'global-cache-test' ) );
		$this->cache->switch_to_blog( get_current_blog_id() );
		$this->assertEquals( $val2, $this->cache->get( $key, 'global-cache-test' ) );
	}

	function test_wp_cache_init() {
		$new_blank_cache_object = new WP_Object_Cache();
		wp_cache_init();

		global $wp_object_cache;
		$this->assertEquals( $wp_object_cache, $new_blank_cache_object );
	}

	function test_wp_cache_replace() {
		$key  = 'my-key';
		$val1 = 'first-val';
		$val2 = 'second-val';

		$fake_key = 'my-fake-key';

		// Save the first value to cache and verify
		wp_cache_set( $key, $val1 );
		$this->assertEquals( $val1, wp_cache_get( $key ) );

		// Replace the value and verify
		wp_cache_replace( $key, $val2 );
		$this->assertEquals( $val2, wp_cache_get( $key ) );

		// Non-existant key should fail
		$this->assertFalse( wp_cache_replace( $fake_key, $val1 ) );

		// Make sure $fake_key is not stored
		$this->assertFalse( wp_cache_get( $fake_key ) );
	}
}
