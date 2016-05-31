<?php

/**
 * @group query
 */
class Tests_Query_NoFoundRows extends WP_UnitTestCase {
	public function test_no_found_rows_default() {
		$q = new WP_Query( array(
			'post_type' => 'post',
		) );

		$this->assertContains( 'SQL_CALC_FOUND_ROWS', $q->request );
	}

	public function test_no_found_rows_false() {
		$q = new WP_Query( array(
			'post_type' => 'post',
			'no_found_rows' => false,
		) );

		$this->assertContains( 'SQL_CALC_FOUND_ROWS', $q->request );
	}

	public function test_no_found_rows_0() {
		$q = new WP_Query( array(
			'post_type' => 'post',
			'no_found_rows' => 0,
		) );

		$this->assertContains( 'SQL_CALC_FOUND_ROWS', $q->request );
	}

	public function test_no_found_rows_empty_string() {
		$q = new WP_Query( array(
			'post_type' => 'post',
			'no_found_rows' => '',
		) );

		$this->assertContains( 'SQL_CALC_FOUND_ROWS', $q->request );
	}

	public function test_no_found_rows_true() {
		$q = new WP_Query( array(
			'post_type' => 'post',
			'no_found_rows' => true,
		) );

		$this->assertNotContains( 'SQL_CALC_FOUND_ROWS', $q->request );
	}

	public function test_no_found_rows_non_bool_cast_to_true() {
		$q = new WP_Query( array(
			'post_type' => 'post',
			'no_found_rows' => 'foo',
		) );

		$this->assertNotContains( 'SQL_CALC_FOUND_ROWS', $q->request );
	}

	/**
	 * @ticket 29552
	 */
	public function test_no_found_rows_default_with_nopaging_true() {
		$p = $this->factory->post->create();

		$q = new WP_Query( array(
			'post_type' => 'post',
			'nopaging' => true,
		) );

		$this->assertNotContains( 'SQL_CALC_FOUND_ROWS', $q->request );
		$this->assertSame( 1, $q->found_posts );
	}

	/**
	 * @ticket 29552
	 */
	public function test_no_found_rows_default_with_postsperpage_minus1() {
		$p = $this->factory->post->create();

		$q = new WP_Query( array(
			'post_type' => 'post',
			'posts_per_page' => -1,
		) );

		$this->assertNotContains( 'SQL_CALC_FOUND_ROWS', $q->request );
		$this->assertSame( 1, $q->found_posts );
	}
}
