<?php

/**
 * @group taxonomy
 * @covers ::get_tag_link
 */
class Tests_Term_GetTagLink extends WP_UnitTestCase {
	public function test_success() {
		$t = self::factory()->term->create( array(
			'taxonomy' => 'post_tag',
			'slug' => 'term-slug',
		) );

		$found = get_tag_link( $t );
		$expected = home_url( '?tag=term-slug' );

		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 42771
	 */
	public function test_should_return_link_for_term_from_another_taxonomy_on_primed_cache() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug'     => 'test-term',
		) );

		$term = get_term( $t );

		$found = get_tag_link( $t );
		$expected = home_url( '?wptests_tax=test-term' );

		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 42771
	 */
	public function test_should_return_link_for_term_from_another_taxonomy_on_empty_cache() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug'     => 'test-term',
		) );

		clean_term_cache( $t );

		$found = get_tag_link( $t );
		$expected = home_url( '?wptests_tax=test-term' );

		$this->assertSame( $expected, $found );
	}
}
