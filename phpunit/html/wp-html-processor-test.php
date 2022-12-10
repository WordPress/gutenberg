<?php

/**
 * Unit tests covering WP_HTML_Processor functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/class-wp-html-processor.php';

/**
 * @group html
 *
 * @coversDefaultClass WP_HTML_Processor
 */
class WP_HTML_Processor_Test extends WP_UnitTestCase {
	public function test_find_descendant_tag() {
		$tags = new WP_HTML_Processor( '<div>outside</div><section><div><img>inside</div></section>' );

		$tags->next_tag( 'div' );
		$this->assertFalse( $tags->next_within_balanced_tags( 'img' ) );

		$this->assertTrue( $tags->next_tag( 'div' ) );
		$this->assertTrue( $tags->next_within_balanced_tags( 'img' ) );
	}

	public function test_find_immediate_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$this->assertFalse( $tags->next_within_balanced_tags( 'img', 1 ) );
	}

	public function test_find_immediate_child_tag2() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div><img></div>' );

		$tags->next_tag( 'div' );
		$this->assertTrue( $tags->next_within_balanced_tags( 'img', 1 ) );
	}

	public function test_find_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$this->assertTrue( $tags->next_within_balanced_tags( 'img', 3 ) );
	}
}
