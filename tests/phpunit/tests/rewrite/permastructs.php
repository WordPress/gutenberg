<?php

/**
 * @group rewrite
 */
class Tests_Rewrite_Permastructs extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		$this->set_permalink_structure( '/%postname%/' );
	}

	public function test_add_permastruct(  ) {
		global $wp_rewrite;

		add_permastruct( 'foo', 'bar/%foo%' );
		$this->assertEqualSetsWithIndex( array(
			'with_front'  => true,
			'ep_mask'     => EP_NONE,
			'paged'       => true,
			'feed'        => true,
			'walk_dirs'   => true,
			'endpoints'   => true,
			'forcomments' => false,
			'struct'      => '/bar/%foo%',
		), $wp_rewrite->extra_permastructs['foo'] );
	}

	public function test_remove_permastruct(  ) {
		global $wp_rewrite;

		add_permastruct( 'foo', 'bar/%foo%' );
		$this->assertInternalType( 'array', $wp_rewrite->extra_permastructs['foo'] );
		$this->assertSame( '/bar/%foo%', $wp_rewrite->extra_permastructs['foo']['struct'] );

		remove_permastruct( 'foo' );
		$this->assertFalse( isset( $wp_rewrite->extra_permastructs['foo'] ) );
	}
}
