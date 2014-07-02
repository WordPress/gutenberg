<?php
/*
$defaults = array(
	'type' => 'monthly', 'limit' => '',
	'format' => 'html', 'before' => '',
	'after' => '', 'show_post_count' => false,
	'echo' => 1, 'order' => 'DESC',
);
*/
class Tests_Get_Archives extends WP_UnitTestCase {
	protected $post_ids;
	protected $month_url;

	function setUp() {
		parent::setUp();

		$this->month_url = get_month_link( date( 'Y' ), date( 'm' ) );
		$this->year_url = get_year_link( date( 'Y' ) );
		$this->post_ids = $this->factory->post->create_many( 8, array( 'post_type' => 'post', 'post_author' => '1' ) );
	}

	function test_wp_get_archives_default() {
		$expected['default'] = "<li><a href='" . $this->month_url . "'>" . date( 'F Y' ) . "</a></li>";
		$this->assertEquals( $expected['default'], trim( wp_get_archives( array( 'echo' => false ) ) ) );
	}

	function test_wp_get_archives_type() {
		$expected['type'] = "<li><a href='" . $this->year_url . "'>" . date( 'Y' ) . "</a></li>";
		$this->assertEquals( $expected['type'], trim( wp_get_archives( array( 'echo' => false, 'type' => 'yearly' ) ) ) );
	}

	function test_wp_get_archives_limit() {
		$ids = array_slice( array_reverse( $this->post_ids ), 0, 5 );

		$link1 = get_permalink( $ids[0] );
		$link2 = get_permalink( $ids[1] );
		$link3 = get_permalink( $ids[2] );
		$link4 = get_permalink( $ids[3] );
		$link5 = get_permalink( $ids[4] );

		$expected['limit'] = <<<EOF
<li><a href='$link1'>Post title 8</a></li>
	<li><a href='$link2'>Post title 7</a></li>
	<li><a href='$link3'>Post title 6</a></li>
	<li><a href='$link4'>Post title 5</a></li>
	<li><a href='$link5'>Post title 4</a></li>
EOF;
		$this->assertEquals( $expected['limit'], trim( wp_get_archives( array( 'echo' => false, 'type' => 'postbypost', 'limit' => 5 ) ) ) );
	}

	function test_wp_get_archives_format() {
		$expected['format'] = "<option value='" . $this->month_url . "'> " . date( 'F Y' ) . ' </option>';
		$this->assertEquals( $expected['format'], trim( wp_get_archives( array( 'echo' => false, 'format' => 'option' ) ) ) );
	}

	function test_wp_get_archives_before_and_after() {
		$expected['before_and_after'] = "<div><a href='" . $this->month_url . "'>" . date( 'F Y' ) . '</a></div>';
		$this->assertEquals( $expected['before_and_after'], trim( wp_get_archives( array( 'echo' => false, 'format' => 'custom', 'before' => '<div>', 'after' => '</div>' ) ) ) );
	}

	function test_wp_get_archives_show_post_count() {
		$expected['show_post_count'] = "<li><a href='" . $this->month_url . "'>" . date( 'F Y' ) . "</a>&nbsp;(8)</li>";
		$this->assertEquals( $expected['show_post_count'], trim( wp_get_archives( array( 'echo' => false, 'show_post_count' => 1 ) ) ) );
	}

	function test_wp_get_archives_echo() {
		$expected['echo'] = "<li><a href='" . $this->month_url . "'>" . date( 'F Y' ) . '</a></li>';
		ob_start();
		wp_get_archives( array( 'echo' => true ) );
		$actual = ob_get_clean();
		$this->assertEquals( $expected['echo'], trim( $actual ) );
	}

	function test_wp_get_archives_order() {
		$this->factory->post->create( array( 'post_type' => 'post', 'post_author' => '1', 'post_date' => '2012-10-23 19:34:42' ) );

		$date_full = date( 'F Y' );
		$oct_url = get_month_link( 2012, 10 );
		$expected['order_asc'] = <<<EOF
<li><a href='{$oct_url}'>October 2012</a></li>
	<li><a href='{$this->month_url}'>$date_full</a></li>
EOF;
		$this->assertEquals( $expected['order_asc'], trim( wp_get_archives( array( 'echo' => false, 'order' => 'ASC' ) ) ) );

		$expected['order_desc'] = <<<EOF
<li><a href='{$this->month_url}'>$date_full</a></li>
	<li><a href='{$oct_url}'>October 2012</a></li>
EOF;
		$this->assertEquals( $expected['order_desc'], trim( wp_get_archives( array( 'echo' => false, 'order' => 'DESC' ) ) ) );
	}
}
