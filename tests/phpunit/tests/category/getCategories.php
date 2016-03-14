<?php

/**
 * @group taxonomy
 * @group category.php
 */
class Tests_Category_GetCategories extends WP_UnitTestCase {
	/**
	 * @ticket 36227
	 */
	public function test_wp_error_should_return_an_empty_array() {
		$found = get_categories( array( 'taxonomy' => 'foo' ) );
		$this->assertSame( array(), $found );
	}
}
