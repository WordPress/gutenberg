<?php

/**
 * Unit tests covering WP_HTML_Processor functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/class-wp-html-processor.php';

/**
 * @group html-proc
 *
 * @coversDefaultClass WP_HTML_Processor
 */
class WP_HTML_Processor_Test extends WP_UnitTestCase {
	public function test_find_descendant_tag() {
		$tags = new WP_HTML_Processor( '<div>outside</div><section><div><img>inside</div></section>' );

		$tags->next_tag( 'div' );
		$state = WP_HTML_Processor::new_state();
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );

		$this->assertTrue( $tags->next_tag( 'div' ) );
		$state = WP_HTML_Processor::new_state();
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$state = WP_HTML_Processor::new_state();
		$state->match_depth = 1;
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_of_fails_when_inside_sibling_of_current_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div><img></div>' );

		$tags->next_tag( 'div' );
		$state = WP_HTML_Processor::new_state();
		$state->match_depth = 1;
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_succeeds_when_inside_sibling_of_current_tag_and_searchign_siblings() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div><img></div>' );

		$tags->next_tag( 'div' );
		$state = WP_HTML_Processor::new_state();
		$state->also_scan_siblings();
		$state->match_depth = 1;
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$state = WP_HTML_Processor::new_state();
		$state->match_depth = 3;
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}
}
