<?php

/**
 * Unit tests covering WP_HTML_Processor functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/class-wp-html-processor.php';

/**
 * @group html-processor
 *
 * @coversDefaultClass WP_HTML_Processor
 */
class WP_HTML_Processor_Test extends WP_UnitTestCase {
	public function test_find_descendant_tag() {
		$tags = new WP_HTML_Processor( '<div>outside</div><section><div><img>inside</div></section>' );

		$tags->next_tag( 'div' );
		$state = $tags->new_state();
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );

		$this->assertTrue( $tags->next_tag( 'div' ) );
		$state = $tags->new_state();
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$state = $tags->new_state();
		$state->match_depth = 1;
		$this->assertFalse( $tags->balanced_next( $state, 'img' ) );
	}

	public function test_find_immediate_child_tag2() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div><img wanted></div>' );

		$tags->next_tag( 'div' );
		$state = $tags->new_state();
		$state->match_depth = 1;
		$this->assertTrue( $tags->balanced_next( $state, 'img' ), 'Did not find the wanted <img>' );
		$this->assertTrue( $tags->get_attribute( 'wanted' ), 'Found the wrong <img>' );
	}

	public function test_find_child_tag() {
		$tags = new WP_HTML_Processor( '<div><div><div><img></div></div></div>' );

		$tags->next_tag( 'div' );
		$state = $tags->new_state();
		$state->match_depth = 3;
		$this->assertTrue( $tags->balanced_next( $state, 'img' ) );
	}
}
