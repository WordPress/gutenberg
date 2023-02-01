<?php
/**
 * Unit tests covering WP_HTML_Tag_Processor bookmark functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/wp-html.php';

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
	public function test_set_bookmark() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );
		$this->assertTrue( $p->set_bookmark( 'first li' ), 'Could not allocate a "first li" bookmark.' );
		$p->next_tag( 'li' );
		$this->assertTrue( $p->set_bookmark( 'second li' ), 'Could not allocate a "second li" bookmark.' );
		$this->assertTrue( $p->set_bookmark( 'first li' ), 'Could not move the "first li" bookmark.' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers release_bookmark
	 */
	public function test_release_bookmark() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );
		$this->assertFalse( $p->release_bookmark( 'first li' ), 'Released a non-existing bookmark.' );
		$p->set_bookmark( 'first li' );
		$this->assertTrue( $p->release_bookmark( 'first li' ), 'Could not release a bookmark.' );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 */
	public function test_seek() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );
		$p->set_bookmark( 'first li' );

		$p->next_tag( 'li' );
		$p->set_attribute( 'foo-2', 'bar-2' );

		$p->seek( 'first li' );
		$p->set_attribute( 'foo-1', 'bar-1' );

		$this->assertEquals(
			'<ul><li foo-1="bar-1">One</li><li foo-2="bar-2">Two</li><li>Three</li></ul>',
			$p->get_updated_html()
		);
	}

	/**
	 * WP_HTML_Tag_Processor used to test for the diffs affecting
	 * the adjusted bookmark position while simultaneously adjusting
	 * the bookmark in question. As a result, updating the bookmarks
	 * of a next tag while removing two subsequent attributes in
	 * a previous tag unfolded like this:
	 *
	 * 1. Check if the first removed attribute is before the bookmark:
	 *
	 * <button twenty_one_characters 7_chars></button><button></button>
	 *         ^-------------------^                  ^
	 *           diff applied here           the bookmark is here
	 *
	 *    (Yes it is)
	 *
	 * 2. Move the bookmark to the left by the attribute length:
	 *
	 * <button twenty_one_characters 7_chars></button><button></button>
	 *                           ^
	 *                   the bookmark is here
	 *
	 * 3. Check if the second removed attribute is before the bookmark:
	 *
	 * <button twenty_one_characters 7_chars></button><button></button>
	 *                           ^   ^-----^
	 *                    bookmark    diff
	 *
	 *    This time, it isn't!
	 *
	 * The fix in the WP_HTML_Tag_Processor involves doing all the checks
	 * before moving the bookmark. This test is here to guard us from
	 * the erroneous behavior accidentally returning one day.
	 *
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 * @covers apply_attributes_updates
	 */
	public function test_removing_long_attributes_doesnt_break_seek() {
		$input = <<<HTML
		<button twenty_one_characters 7_chars></button><button></button>
HTML;
		$p     = new WP_HTML_Tag_Processor( $input );
		$p->next_tag( 'button' );
		$p->set_bookmark( 'first' );
		$p->next_tag( 'button' );
		$p->set_bookmark( 'second' );

		$this->assertTrue(
			$p->seek( 'first' ),
			'Seek() to the first button has failed'
		);
		$p->remove_attribute( 'twenty_one_characters' );
		$p->remove_attribute( '7_chars' );

		$this->assertTrue(
			$p->seek( 'second' ),
			'Seek() to the second button has failed'
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 */
	public function test_bookmarks_complex_use_case() {
		$input           = <<<HTML
<div selected class="merge-message" checked>
	<div class="select-menu d-inline-block">
		<div checked class="BtnGroup MixedCaseHTML position-relative" />
		<div checked class="BtnGroup MixedCaseHTML position-relative">
			<button type="button" class="merge-box-button btn-group-merge rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Merge pull request
			</button>

			<button type="button" class="merge-box-button btn-group-squash rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Squash and merge
			</button>

			<button type="button" class="merge-box-button btn-group-rebase rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Rebase and merge
			</button>

			<button aria-label="Select merge method" disabled="disabled" type="button" data-view-component="true" class="select-menu-button btn BtnGroup-item"></button>
		</div>
	</div>
</div>
HTML;
		$expected_output = <<<HTML
<div selected class="merge-message" checked>
	<div class="select-menu d-inline-block">
		<div  class="BtnGroup MixedCaseHTML position-relative" />
		<div checked class="BtnGroup MixedCaseHTML position-relative">
			<button type="submit" class="merge-box-button btn-group-merge rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Merge pull request
			</button>

			<button  class="hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Squash and merge
			</button>

			<button id="rebase-and-merge"     disabled="">
			  Rebase and merge
			</button>

			<button id="last-button"     ></button>
		</div>
	</div>
</div>
HTML;
		$p               = new WP_HTML_Tag_Processor( $input );
		$p->next_tag( 'div' );
		$p->next_tag( 'div' );
		$p->next_tag( 'div' );
		$p->set_bookmark( 'first div' );
		$p->next_tag( 'button' );
		$p->set_bookmark( 'first button' );
		$p->next_tag( 'button' );
		$p->set_bookmark( 'second button' );
		$p->next_tag( 'button' );
		$p->set_bookmark( 'third button' );
		$p->next_tag( 'button' );
		$p->set_bookmark( 'fourth button' );

		$p->seek( 'first button' );
		$p->set_attribute( 'type', 'submit' );

		$this->assertTrue(
			$p->seek( 'third button' ),
			'Seek() to the third button failed'
		);
		$p->remove_attribute( 'class' );
		$p->remove_attribute( 'type' );
		$p->remove_attribute( 'aria-expanded' );
		$p->set_attribute( 'id', 'rebase-and-merge' );
		$p->remove_attribute( 'data-details-container' );

		$this->assertTrue(
			$p->seek( 'first div' ),
			'Seek() to the first div failed'
		);
		$p->set_attribute( 'checked', false );

		$this->assertTrue(
			$p->seek( 'fourth button' ),
			'Seek() to the fourth button failed'
		);
		$p->set_attribute( 'id', 'last-button' );
		$p->remove_attribute( 'class' );
		$p->remove_attribute( 'type' );
		$p->remove_attribute( 'checked' );
		$p->remove_attribute( 'aria-label' );
		$p->remove_attribute( 'disabled' );
		$p->remove_attribute( 'data-view-component' );

		$this->assertTrue(
			$p->seek( 'second button' ),
			'Seek() to the second button failed'
		);
		$p->remove_attribute( 'type' );
		$p->set_attribute( 'class', 'hx_create-pr-button' );

		$this->assertEquals(
			$expected_output,
			$p->get_updated_html()
		);
	}

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 */
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

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 */
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

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 */
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

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 * @covers set_bookmark
	 */
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

	/**
	 * @ticket 56299
	 *
	 * @covers set_bookmark
	 */
	public function test_limits_the_number_of_bookmarks() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );

		$this->expectException( Exception::class );

		for ( $i = 0;$i < WP_HTML_Tag_Processor::MAX_BOOKMARKS;$i++ ) {
			$this->assertTrue( $p->set_bookmark( "bookmark $i" ), "Could not allocate the bookmark #$i" );
		}

		$this->assertFalse( $p->set_bookmark( 'final bookmark' ), "Allocated $i bookmarks, which is one above the limit." );
	}

	/**
	 * @ticket 56299
	 *
	 * @covers seek
	 */
	public function test_limits_the_number_of_seek_calls() {
		$p = new WP_HTML_Tag_Processor( '<ul><li>One</li><li>Two</li><li>Three</li></ul>' );
		$p->next_tag( 'li' );
		$p->set_bookmark( 'bookmark' );

		$this->expectException( Exception::class );

		for ( $i = 0; $i < WP_HTML_Tag_Processor::MAX_SEEK_OPS; $i++ ) {
			$this->assertTrue( $p->seek( 'bookmark' ), 'Could not seek to the "bookmark"' );
		}
		$this->assertFalse( $p->seek( 'bookmark' ), "$i-th seek() to the bookmark succeeded, even though it should exceed the allowed limit." );
	}
}
