<?php

/**
 * @group taxonomy
 */
class Tests_Term_WpRemoveObjectTerms extends WP_UnitTestCase {
	/**
	 * @ticket 34338
	 */
	public function test_removal_should_delete_object_relationship_cache() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = self::factory()->post->create();
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		wp_set_object_terms( $p, $t, 'wptests_tax' );

		// Pollute the cache.
		get_the_terms( $p, 'wptests_tax' );

		wp_remove_object_terms( $p, $t, 'wptests_tax' );

		$this->assertFalse( get_the_terms( $p, 'wptests_tax' ) );
	}
}
