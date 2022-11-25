<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor bookmark functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/index.php';

/**
 * @group html
 *
 * @coversDefaultClass WP_HTML_Tag_Processor
 */
class WP_HTML_Tag_Processor_Bookmark_Test extends WP_UnitTestCase {
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

	public function test_updates_bookmark_for_additions_after_both_sides() {
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

	public function test_updates_bookmark_for_additions_before_both_sides() {
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

	public function test_updates_bookmark_for_deletions_after_both_sides() {
		$p = new WP_HTML_Tag_Processor( '<div>First</div><div disabled>Second</div>' );
		$p->next_tag();
		$p->set_bookmark( 'first' );
		$p->next_tag();
		$p->remove_attribute( 'disabled' );

		$p->seek( 'first' );
		$p->set_attribute( 'untouched', true );

		$this->assertEquals(
			/** @TODO: we shouldn't have to assert the extra space after removing the attribute. */
			'<div untouched>First</div><div >Second</div>',
			$p->get_updated_html()
		);
	}

	public function test_updates_bookmark_for_deletions_before_both_sides() {
		$p = new WP_HTML_Tag_Processor( '<div disabled>First</div><div>Second</div>' );
		$p->next_tag();
		$p->set_bookmark( 'first' );
		$p->next_tag();
		$p->set_bookmark( 'second' );

		$p->seek( 'first' );
		$p->remove_attribute( 'disabled' );

		$p->seek( 'second' );
		$p->set_attribute( 'safe', true );

		$this->assertEquals(
			/** @TODO: we shouldn't have to assert the extra space after removing the attribute. */
			'<div >First</div><div safe>Second</div>',
			$p->get_updated_html()
		);
	}
}
