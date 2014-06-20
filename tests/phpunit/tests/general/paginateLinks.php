<?php

class Tests_Paginate_Links extends WP_UnitTestCase {

	private $i18n_count = 0;

	function setUp() {
		parent::setUp();

		$this->go_to( home_url( '/' ) );
	}

	function test_defaults() {
		$page2 = get_pagenum_link( 2 );
		$page3 = get_pagenum_link( 3 );
		$page50 = get_pagenum_link( 50 );

		$expected =<<<EXPECTED
<span class='page-numbers current'>1</span>
<a class='page-numbers' href='$page2'>2</a>
<a class='page-numbers' href='$page3'>3</a>
<span class="page-numbers dots">&hellip;</span>
<a class='page-numbers' href='$page50'>50</a>
<a class="next page-numbers" href="$page2">Next &raquo;</a>
EXPECTED;

		$links = paginate_links( array( 'total' => 50 ) );
		$this->assertEquals( $expected, $links );
	}

	function test_format() {
		$page2 = home_url( '/page/2/' );
		$page3 = home_url( '/page/3/' );
		$page50 = home_url( '/page/50/' );

		$expected =<<<EXPECTED
<span class='page-numbers current'>1</span>
<a class='page-numbers' href='$page2'>2</a>
<a class='page-numbers' href='$page3'>3</a>
<span class="page-numbers dots">&hellip;</span>
<a class='page-numbers' href='$page50'>50</a>
<a class="next page-numbers" href="$page2">Next &raquo;</a>
EXPECTED;

		$links = paginate_links( array( 'total' => 50, 'format' => 'page/%#%/' ) );
		$this->assertEquals( $expected, $links );
	}

	function test_prev_next_false() {
		$home = home_url( '/' );
		$page3 = get_pagenum_link( 3 );
		$page4 = get_pagenum_link( 4 );
		$page50 = get_pagenum_link( 50 );

		$expected =<<<EXPECTED
<a class='page-numbers' href='$home'>1</a>
<span class='page-numbers current'>2</span>
<a class='page-numbers' href='$page3'>3</a>
<a class='page-numbers' href='$page4'>4</a>
<span class="page-numbers dots">&hellip;</span>
<a class='page-numbers' href='$page50'>50</a>
EXPECTED;

		$links = paginate_links( array( 'total' => 50, 'prev_next' => false, 'current' => 2 ) );
		$this->assertEquals( $expected, $links );
	}

	function test_prev_next_true() {
		$home = home_url( '/' );
		$page3 = get_pagenum_link( 3 );
		$page4 = get_pagenum_link( 4 );
		$page50 = get_pagenum_link( 50 );

		$expected =<<<EXPECTED
<a class="prev page-numbers" href="$home">&laquo; Previous</a>
<a class='page-numbers' href='$home'>1</a>
<span class='page-numbers current'>2</span>
<a class='page-numbers' href='$page3'>3</a>
<a class='page-numbers' href='$page4'>4</a>
<span class="page-numbers dots">&hellip;</span>
<a class='page-numbers' href='$page50'>50</a>
<a class="next page-numbers" href="$page3">Next &raquo;</a>
EXPECTED;

		$links = paginate_links( array( 'total' => 50, 'prev_next' => true, 'current' => 2 ) );
		$this->assertEquals( $expected, $links );
	}

	function increment_i18n_count() {
		$this->i18n_count += 1;
	}

	/**
	 * @ticket 25735
	 */
	function test_paginate_links_number_format() {
		$this->i18n_count = 0;
		add_filter( 'number_format_i18n', array( $this, 'increment_i18n_count' ) );
		paginate_links( array(
			'total'     => 100,
			'current'   => 50,
			'show_all'  => false,
			'prev_next' => true,
			'end_size'  => 1,
			'mid_size'  => 1,
		) );
		// The links should be:
		// < Previous 1 ... 49 50 51 ... 100 Next >
		$this->assertEquals( 5, $this->i18n_count );
		remove_filter( 'number_format_i18n', array( $this, 'increment_i18n_count' ) );
	}

	/**
	 * @ticket 24606
	 */
	function test_paginate_links_base_value() {

		// Current page: 2
		$links = paginate_links( array(
			'current'  => 2,
			'total'    => 5,
			'end_size' => 1,
			'mid_size' => 1,
			'type'     => 'array',
		) );

		// It's supposed to link to page 1:
		$this->assertTag( array( 'tag' => 'a', 'attributes' => array( 'href' => 'http://' . WP_TESTS_DOMAIN . '/' ) ), $links[0] );
		$this->assertTag( array( 'tag' => 'a', 'attributes' => array( 'href' => 'http://' . WP_TESTS_DOMAIN . '/' ) ), $links[1] );

		// It's not supposed to have an empty href.
		$this->assertNotTag( array( 'tag' => 'a', 'attributes' => array( 'class' => 'prev page-numbers', 'href' => '' ) ), $links[0] );
		$this->assertNotTag( array( 'tag' => 'a', 'attributes' => array( 'class' => 'page-numbers',      'href' => '' ) ), $links[1] );

		// Current page: 1
		$links = paginate_links( array(
			'current'  => 1,
			'total'    => 5,
			'end_size' => 1,
			'mid_size' => 1,
			'type'     => 'array',
		) );

		$this->assertTag( array( 'tag' => 'span', 'attributes' => array( 'class' => 'current' ) ), $links[0] );
		$this->assertTag( array( 'tag' => 'a',    'attributes' => array( 'href' => get_pagenum_link( 2 ) ) ), $links[1] );
	}

}
