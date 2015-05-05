<?php

class Tests_Paginate_Links extends WP_UnitTestCase {

	private $i18n_count = 0;
	private $permalink_structure = '';

	function setUp() {
		parent::setUp();
		global $wp_rewrite;

		$this->go_to( home_url( '/' ) );

		$this->permalink_structure = $wp_rewrite->permalink_structure;
		$wp_rewrite->set_permalink_structure( get_option( 'permalink_structure' ) );
	}

	function tearDown() {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $this->permalink_structure );
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

		$expected_attributes = array(
			array(
				'href'  => home_url( '/' ),
				'class' => 'prev page-numbers'
			),
			array(
				'href'  => home_url( '/' ),
				'class' => 'page-numbers'
			)
		);

		$document = new DOMDocument();
		$document->preserveWhiteSpace = false;

		// The first two links should link to page 1
		foreach ( $expected_attributes as $link_idx => $attributes ) {

			$document->loadHTML( $links[$link_idx] );
			$tag = $document->getElementsByTagName( 'a' )->item( 0 );

			$this->assertNotNull( $tag );

			$href  = $tag->attributes->getNamedItem( 'href' )->value;
			$class = $tag->attributes->getNamedItem( 'class' )->value;

			$this->assertEquals( $attributes['href'], $href );
			$this->assertEquals( $attributes['class'], $class );
		}

		// Current page: 1
		$links = paginate_links( array(
			'current'  => 1,
			'total'    => 5,
			'end_size' => 1,
			'mid_size' => 1,
			'type'     => 'array',
		) );

		$document->loadHTML( $links[0] );
		$tag = $document->getElementsByTagName( 'span' )->item( 0 );
		$this->assertNotNull( $tag );

		$class = $tag->attributes->getNamedItem( 'class' )->value;
		$this->assertEquals( 'page-numbers current', $class );

		$document->loadHTML( $links[1] );
		$tag = $document->getElementsByTagName( 'a' )->item( 0 );
		$this->assertNotNull( $tag );

		$href = $tag->attributes->getNamedItem( 'href' )->value;
		$this->assertEquals( get_pagenum_link( 2 ), $href );
	}

	function add_query_arg( $url ) {
		return add_query_arg( array(
			'foo' => 'bar',
			's'   => 'search+term',
		), $url );
	}

	/**
	 * @ticket 29636
	 */
	function test_paginate_links_query_args() {
		add_filter( 'get_pagenum_link', array( $this, 'add_query_arg' ) );
		$links = paginate_links( array(
			'current'  => 2,
			'total'    => 5,
			'end_size' => 1,
			'mid_size' => 1,
			'type'     => 'array',
		) );
		remove_filter( 'get_pagenum_link', array( $this, 'add_query_arg' ) );

		$document = new DOMDocument();
		$document->preserveWhiteSpace = false;

		// All links should have foo=bar arguments and be escaped:
		$data = array(
			0 => home_url( '/?foo=bar&s=search+term' ),
			1 => home_url( '/?foo=bar&s=search+term' ),
			3 => home_url( '/?paged=3&foo=bar&s=search+term' ),
			5 => home_url( '/?paged=5&foo=bar&s=search+term' ),
			6 => home_url( '/?paged=3&foo=bar&s=search+term' ),
		);

		foreach ( $data as $index => $expected_href ) {
			$document->loadHTML( $links[ $index ] );
			$tag = $document->getElementsByTagName( 'a' )->item( 0 );
			$this->assertNotNull( $tag );

			$href = $tag->attributes->getNamedItem( 'href' )->value;
			$this->assertEquals( $expected_href, $href );
		}
	}

	/**
	 * @ticket 30831
	 */
	function test_paginate_links_with_custom_query_args() {
		add_filter( 'get_pagenum_link', array( $this, 'add_query_arg' ) );
		$links = paginate_links( array(
			'current'  => 2,
			'total'    => 5,
			'end_size' => 1,
			'mid_size' => 1,
			'type'     => 'array',
			'add_args' => array(
				'baz' => 'qux',
			),
		) );
		remove_filter( 'get_pagenum_link', array( $this, 'add_query_arg' ) );

		$document = new DOMDocument();
		$document->preserveWhiteSpace = false;

		$data = array(
			0 => home_url( '/?baz=qux&foo=bar&s=search+term' ),
			1 => home_url( '/?baz=qux&foo=bar&s=search+term' ),
			3 => home_url( '/?paged=3&baz=qux&foo=bar&s=search+term' ),
			5 => home_url( '/?paged=5&baz=qux&foo=bar&s=search+term' ),
			6 => home_url( '/?paged=3&baz=qux&foo=bar&s=search+term' ),
		);

		foreach ( $data as $index => $expected_href ) {
			$document->loadHTML( $links[ $index ] );
			$tag = $document->getElementsByTagName( 'a' )->item( 0 );
			$this->assertNotNull( $tag );

			$href = $tag->attributes->getNamedItem( 'href' )->value;
			$this->assertEquals( $expected_href, $href );
		}
	}

	/**
	 * @ticket 30831
	 */
	public function test_paginate_links_should_allow_non_default_format_without_add_args() {
		// Fake the query params.
		$request_uri = $_SERVER['REQUEST_URI'];
		$_SERVER['REQUEST_URI'] = add_query_arg( 'foo', 3, home_url() );

		$links = paginate_links( array(
			'base'    => add_query_arg( 'foo', '%#%' ),
			'format'  => '',
			'total'   => 5,
			'current' => 3,
			'type'    => 'array',
		) );

		$this->assertContains( '?foo=1', $links[1] );
		$this->assertContains( '?foo=2', $links[2] );
		$this->assertContains( '?foo=4', $links[4] );
		$this->assertContains( '?foo=5', $links[5] );

		$_SERVER['REQUEST_URI'] = $request_uri;
	}

	/**
	 * @ticket 30831
	 */
	public function test_paginate_links_should_allow_add_args_to_be_bool_false() {
		// Fake the query params.
		$request_uri = $_SERVER['REQUEST_URI'];
		$_SERVER['REQUEST_URI'] = add_query_arg( 'foo', 3, home_url() );

		$links = paginate_links( array(
			'add_args' => false,
			'base'    => add_query_arg( 'foo', '%#%' ),
			'format'  => '',
			'total'   => 5,
			'current' => 3,
			'type'    => 'array',
		) );

		$this->assertContains( "<span class='page-numbers current'>3</span>", $links );
	}

	/**
	 * @ticket 31939
	 */
	public function test_custom_base_query_arg_should_be_stripped_from_current_url_before_generating_pag_links() {
		// Fake the current URL: example.com?foo
		$request_uri = $_SERVER['REQUEST_URI'];
		$_SERVER['REQUEST_URI'] = add_query_arg( 'foo', '', $request_uri );

		$links = paginate_links( array(
			'base'    => add_query_arg( 'foo', '%_%', home_url() ),
			'format'  => '%#%',
			'total'   => 5,
			'current' => 1,
			'type'    => 'array',
		) );

		$page_2_url = home_url() . '?foo=2';
		$this->assertContains( "<a class='page-numbers' href='$page_2_url'>2</a>", $links );
	}
}
