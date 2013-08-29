<?php

if ( is_multisite() ) :
/**
 * @group option
 */
class Tests_Option_BlogOption extends WP_UnitTestCase {
	function test_from_same_site() {
		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_blog_option( 1, 'doesnotexist' ) );
		$this->assertFalse( get_option( 'doesnotexist' ) ); // check get_option()

		$this->assertTrue( add_blog_option( 1, $key, $value ) );
		// Assert all values of $blog_id that means the current or main blog (the same here).
		$this->assertEquals( $value, get_blog_option( 1, $key ) );
		$this->assertEquals( $value, get_blog_option( null, $key ) );
		$this->assertEquals( $value, get_blog_option( '1', $key ) );
		$this->assertEquals( $value, get_option( $key ) ); // check get_option()

		$this->assertFalse( add_blog_option( 1, $key, $value ) );  // Already exists
		$this->assertFalse( update_blog_option( 1, $key, $value ) );  // Value is the same
		$this->assertTrue( update_blog_option( 1, $key, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( 1, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()
		$this->assertFalse( add_blog_option( 1, $key, $value ) );
		$this->assertEquals( $value2, get_blog_option( 1, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()

		$this->assertTrue( delete_blog_option( 1, $key ) );
		$this->assertFalse( get_blog_option( 1, $key ) );
		$this->assertFalse( get_option( $key ) ); // check get_option()
		$this->assertFalse( delete_blog_option( 1, $key ) );
		$this->assertTrue( update_blog_option( 1, $key2, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( 1, $key2 ) );
		$this->assertEquals( $value2, get_option( $key2 ) ); // check get_option()
		$this->assertTrue( delete_blog_option( 1, $key2 ) );
		$this->assertFalse( get_blog_option( 1, $key2 ) );
		$this->assertFalse( get_option( $key2 ) ); // check get_option()
	}

	function test_from_same_site_with_null_blog_id() {
		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_blog_option( null, 'doesnotexist' ) );
		$this->assertFalse( get_option( 'doesnotexist' ) ); // check get_option()

		$this->assertTrue( add_blog_option( null, $key, $value ) );
		// Assert all values of $blog_id that means the current or main blog (the same here).
		$this->assertEquals( $value, get_blog_option( null, $key ) );
		$this->assertEquals( $value, get_blog_option( null, $key ) );
		$this->assertEquals( $value, get_option( $key ) ); // check get_option()

		$this->assertFalse( add_blog_option( null, $key, $value ) );  // Already exists
		$this->assertFalse( update_blog_option( null, $key, $value ) );  // Value is the same
		$this->assertTrue( update_blog_option( null, $key, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( null, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()
		$this->assertFalse( add_blog_option( null, $key, $value ) );
		$this->assertEquals( $value2, get_blog_option( null, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()

		$this->assertTrue( delete_blog_option( null, $key ) );
		$this->assertFalse( get_blog_option( null, $key ) );
		$this->assertFalse( get_option( $key ) ); // check get_option()
		$this->assertFalse( delete_blog_option( null, $key ) );
		$this->assertTrue( update_blog_option( null, $key2, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( null, $key2 ) );
		$this->assertEquals( $value2, get_option( $key2 ) ); // check get_option()
		$this->assertTrue( delete_blog_option( null, $key2 ) );
		$this->assertFalse( get_blog_option( null, $key2 ) );
		$this->assertFalse( get_option( $key2 ) ); // check get_option()
	}

	function test_with_another_site() {
		global $current_site, $base;

		$domain = 'blogoptiontest';

		if ( is_subdomain_install() ) {
			$newdomain = $domain . '.' . preg_replace( '|^www\.|', '', $current_site->domain );
			$path = $base;
		} else {
			$newdomain = $current_site->domain;
			$path = $base . $domain . '/';
		}

		$email = 'foo@foo.foo';
		$password = wp_generate_password( 12, false );
		$user_id = wpmu_create_user( $domain, $password, $email );
		$this->assertInternalType( 'integer', $user_id );

		$blog_id = wpmu_create_blog( $newdomain, $path, $title, $user_id , array( 'public' => 1 ), $current_site->id );
		$this->assertInternalType( 'integer', $blog_id );

		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_blog_option( $blog_id, 'doesnotexist' ) );
		//$this->assertFalse( get_option( 'doesnotexist' ) ); // check get_option()

		$this->assertTrue( add_blog_option( $blog_id, $key, $value ) );
		// Assert all values of $blog_id that means the current or main blog (the same here).
		$this->assertEquals( $value, get_blog_option( $blog_id, $key ) );
		$this->assertEquals( $value, get_blog_option( "$blog_id", $key ) );
		//$this->assertEquals( $value, get_option( $key ) ); // check get_option()

		$this->assertFalse( add_blog_option( $blog_id, $key, $value ) );  // Already exists
		$this->assertFalse( update_blog_option( $blog_id, $key, $value ) );  // Value is the same
		$this->assertTrue( update_blog_option( $blog_id, $key, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( $blog_id, $key ) );
		//$this->assertEquals( $value2, get_option( $key ) ); // check get_option()
		$this->assertFalse( add_blog_option( $blog_id, $key, $value ) );
		$this->assertEquals( $value2, get_blog_option( $blog_id, $key ) );
		//$this->assertEquals( $value2, get_option( $key ) ); // check get_option()

		$this->assertTrue( delete_blog_option( $blog_id, $key ) );
		$this->assertFalse( get_blog_option( $blog_id, $key ) );
		//$this->assertFalse( get_option( $key ) ); // check get_option()
		$this->assertFalse( delete_blog_option( $blog_id, $key ) );
		$this->assertTrue( update_blog_option( $blog_id, $key2, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( $blog_id, $key2 ) );
		//$this->assertEquals( $value2, get_option( $key2 ) ); // check get_option()
		$this->assertTrue( delete_blog_option( $blog_id, $key2 ) );
		$this->assertFalse( get_blog_option( $blog_id, $key2 ) );
		//$this->assertFalse( get_option( $key2 ) ); // check get_option()
	}
}
endif;