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

	public function test_replaces_inner_contents() {
		$p = new WP_HTML_Tag_Processor( '<div class="outer">Before<div class="inner">Inside</div>After</div>' );
		$p->next_tag( [ 'class_name' => 'inner' ] );
		$p->set_bookmark( 'start' );
		$p->next_tag( [ 'tag_name' => 'div', 'tag_closers' => 'visit' ] );
		$p->set_bookmark( 'end' );
		$p->dangerously_replace( 'start', 'end', '--', 'inner' );

		$this->assertEquals(
			'<div class="outer">Before<div class="inner">--</div>After</div>',
			$p->get_updated_html()
		);
	}

	public function test_replaces_outside_contents() {
		$p = new WP_HTML_Tag_Processor( '<div class="outer">Before<div class="inner">Inside</div>After</div>' );
		$p->next_tag( [ 'class_name' => 'inner' ] );
		$p->set_bookmark( 'start' );
		$p->next_tag( [ 'tag_name' => 'div', 'tag_closers' => 'visit' ] );
		$p->set_bookmark( 'end' );
		$p->dangerously_replace( 'start', 'end', '--' );

		$this->assertEquals(
			'<div class="outer">Before--After</div>',
			$p->get_updated_html()
		);
	}

	public function test_replaces_single_token() {
		$p = new WP_HTML_Tag_Processor( 'This is an <img> tag.' );
		$p->next_tag();
		$p->set_bookmark( 'image' );
		$p->dangerously_replace( 'image', 'image', '(image)' );

		$this->assertEquals(
			'This is an (image) tag.',
			$p->get_updated_html()
		);
	}

	public function test_does_nothing_when_replacing_inner_of_single_token() {
		$p = new WP_HTML_Tag_Processor( 'This is an <img> tag.' );
		$p->next_tag();
		$p->set_bookmark( 'image' );
		$p->dangerously_replace( 'image', 'image', '(image)', 'inner' );

		$this->assertEquals(
			'This is an <img> tag.',
			$p->get_updated_html()
		);
	}

	public function test_does_nothing_when_given_twisted_bookmarks() {
		$p = new WP_HTML_Tag_Processor( '<div><span></span></div>' );
		$p->next_tag();
		$p->set_bookmark( 'first' );
		$p->next_tag();
		$p->set_bookmark( 'second' );
		$p->dangerously_replace( 'second', 'first', '--' );

		$this->assertEquals(
			'<div><span></span></div>',
			$p->get_updated_html()
		);
	}

	public function test_bookmarks_deactive_when_bookmarked_token_disappears() {
		$p = new WP_HTML_Tag_Processor( '<div>Before<div>Inside</div>After</div>' );
		$p->next_tag();
		$p->set_bookmark( 'first' );
		$p->next_tag();
		$p->set_bookmark( 'inner_start' );
		$p->next_tag( [ 'tag_closers' => 'visit' ] );
		$p->set_bookmark( 'inner_end' );
		$p->dangerously_replace( 'first', 'inner_end', '' );

		$this->expectException( Exception::class );
		$p->seek( 'inner_start' );

		$p->set_attribute( 'wonky', true );

		$this->assertEquals(
			'After</div>',
			$p->get_updated_html()
		);
	}

	public function test_gets_inner_content() {
		$p = new WP_HTML_Tag_Processor( '<div>Before<div>Inside</div>After</div>' );
		$p->next_tag();
		$p->set_bookmark( 'start' );
		$p->next_tag( [ 'tag_closers' => 'visit', 'match_offset' => 3 ] );
		$p->set_bookmark( 'end' );

		$this->assertEquals(
			'Before<div>Inside</div>After',
			$p->dangerously_get_contents( 'start', 'end', 'inner' )
		);
	}

	public function test_gets_outer_content() {
		$p = new WP_HTML_Tag_Processor( '<div>Before<div class="start">Inside</div>After</div>' );
		$p->next_tag( [ 'class_name' => 'start' ] );
		$p->set_bookmark( 'start' );
		$p->next_tag( [ 'tag_closers' => 'visit' ] );
		$p->set_bookmark( 'end' );

		$this->assertEquals(
			'<div class="start">Inside</div>',
			$p->dangerously_get_contents( 'start', 'end' )
		);
	}

	public function test_can_replace_parent_with_children() {
		$p = new WP_HTML_Tag_Processor( '<div><h1>Unwrapping HTML</h1><div class="wrapper"><p>Blah blah</p><img></div></div>' );
		$p->next_tag( [ 'class_name' => 'wrapper' ] );
		$p->set_bookmark( 'start' );
		$p->next_tag( [ 'tag_name' => 'div', 'tag_closers' => 'visit' ] );
		$p->set_bookmark( 'end' );

		$inner_html = $p->dangerously_get_contents( 'start', 'end', 'inner' );
		$p->dangerously_replace( 'start', 'end', $inner_html, 'outer' );

		$this->assertEquals(
			'<div><h1>Unwrapping HTML</h1><p>Blah blah</p><img></div>',
			$p->get_updated_html()
		);
	}

	public function test_can_write_dangerous_functions_to_replace_inner_html() {
		$replace_inner_html = function ( WP_HTML_Tag_Processor $p, $html ) {
			$tag = $p->get_tag();
			$p->set_bookmark( '__start_of_node' );

			$depth = 1;
			while ( $depth > 0 && $p->next_tag( [ 'tag_name' => $tag, 'tag_closers' => 'visit' ] ) ) {
				$depth += $p->is_tag_closer() ? -1 : 1;

				if ( $depth === 0 ) {
					$p->set_bookmark( '__end_of_node' );
					break;
				}
			}

			$p->dangerously_replace( '__start_of_node', '__end_of_node', $html, 'inner' );
		};

		$p = new WP_HTML_Tag_Processor( '<div><h1>Unwrapping HTML</h1><div class="wrapper"><p>Blah blah</p><div class="wrapper"><img></div></div><div class="wrapper">untouched</div></div>' );
		$p->next_tag( [ 'class_name' => 'wrapper' ] );

		$replace_inner_html( $p, '<strong>Weee!</strong>' );
		$this->assertEquals(
			'<div><h1>Unwrapping HTML</h1><div class="wrapper"><strong>Weee!</strong></div><div class="wrapper">untouched</div></div>',
			$p->get_updated_html()
		);
	}
}
