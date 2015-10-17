<?php
/**
 * @group canonical
 * @group rewrite
 * @group query
 */
class Tests_Canonical_Paged extends WP_Canonical_UnitTestCase {

	function test_nextpage() {
		$para = 'This is a paragraph.
			This is a paragraph.
			This is a paragraph.';
		$next = '<!--nextpage-->';

		$post_id = self::factory()->post->create( array(
			'post_status' => 'publish',
			'post_content' => "{$para}{$next}{$para}{$next}{$para}"
		) );

		$link = parse_url( get_permalink( $post_id ), PHP_URL_PATH );
		$paged = $link . '4/';

		$this->assertCanonical( $paged, $link );
	}
}