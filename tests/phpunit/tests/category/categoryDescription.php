<?php

/**
 * @group taxonomy
 * @covers ::category_description
 */
class Tests_Category_CategoryDescription extends WP_UnitTestCase {
	public function test_success_query_by_id() {
		$description = 'Foo';
		$c = self::factory()->category->create( array(
			'description' => $description,
		) );

		$found = category_description( $c );
		$expected = apply_filters( 'term_description', $description );

		$this->assertSame( $expected, $found );
	}

	public function test_success_query_by_object() {
		$description = 'Foo';
		$c = self::factory()->category->create( array(
			'description' => $description,
			'slug'        => 'bar',
		) );

		$category = get_term( $c );

		$found = category_description( $c );
		$expected = apply_filters( 'term_description', $description );

		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 42605
	 * @ticket 42771
	 */
	public function test_should_return_description_for_term_from_another_taxonomy_on_primed_cache() {
		register_taxonomy( 'wptests_tax', 'post' );

		$description = 'Foo';

		$t = self::factory()->term->create( array(
			'taxonomy'    => 'wptests_tax',
			'description' => $description,
		) );

		$term = get_term( $t );

		$found = category_description( $t );
		$expected = apply_filters( 'term_description', $description );

		$this->assertSame( $expected, $found );
	}

	/**
	 * @ticket 42605
	 * @ticket 42771
	 */
	public function test_should_return_description_for_term_from_another_taxonomy_on_empty_cache() {
		register_taxonomy( 'wptests_tax', 'post' );

		$description = 'Foo';

		$t = self::factory()->term->create( array(
			'taxonomy'    => 'wptests_tax',
			'description' => $description,
		) );

		clean_term_cache( $t );

		$found = category_description( $t );
		$expected = apply_filters( 'term_description', $description );

		$this->assertSame( $expected, $found );
	}
}
