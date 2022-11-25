<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor rewind functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/index.php';

class WP_HTML_Tag_Processor_Rewind_Test {
	/**
	 * @ticket 56299
	 *
	 * @covers set_bookmark
	 */
	public function test_bookmark() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );
		$p->set_bookmark( 'first li' );
		$p->next_tag( 'li' );
		$p->set_bookmark( 'second li' );
		$p->set_attribute( 'foo-2', 'bar-2' );
		$p->seek( 'first li' );
		$p->set_attribute( 'foo-1', 'bar-1' );
		$p->seek( 'second li' );
		$p->next_tag( 'li' );
		$p->set_attribute( 'foo-3', 'bar-3' );
		$this->assertEquals(
			'<ul><li foo-1="bar-1">One</li><li foo-2="bar-2">Two</li><li foo-3="bar-3">Three</li></ul>',
			$p->get_updated_html()
		);
	}

	public function test_updates_bookmark_for_changes_after_both_sides() {
		$p = new WP_HTML_Tag_Processor( '<div>First</div><div>Second</div>' );
		$p->next_tag();
		$p->set_bookmark( 'first' );
		$p->next_tag();
		$p->add_class( 'second' );

		$p->seek( 'first' );
		$p->add_class( 'first' );

		$this->assertEquals(
			'<div class="first">First</div><div class="second">Second</div>',
			$p->get_updated_html()
		);
	}

	public function test_updates_bookmark_for_changes_before_both_sides() {
		$p = new WP_HTML_Tag_Processor( '<div>First</div><div>Second</div>' );
		$p->next_tag();
		$p->set_bookmark( 'first' );
		$p->next_tag();
		$p->set_bookmark( 'second' );

		$p->seek( 'first' );
		$p->add_class( 'first' );

		$p->seek( 'second' );
		$p->add_class( 'second' );

		$this->assertEquals(
			'<div class="first">First</div><div class="second">Second</div>',
			$p->get_updated_html()
		);
	}
}
