<?php

use PHPUnit\Framework\TestCase;

require_once './class-wp-html-walker.php';

final class WP_HTML_Walker_Tests extends TestCase {
	const HTML_SIMPLE = '<div id="first"><span id="second">Text</span></div>';
	const HTML_WITH_CLASSES = '<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>';

	/**
	 *
	 */
	public function test_to_string_with_no_updates_returns_the_original_html() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$this->assertSame( self::HTML_SIMPLE, (string) $w );
	}

	/**
	 *
	 */
	public function test_finding_existing_tag() {
		$w      = new WP_HTML_Walker( self::HTML_SIMPLE );
		$result = $w->next_tag();
		$this->assertSame( $w, $result, 'Querying an existing tag returns the Walker object' );
		$this->assertTrue( $w->has_match(), 'Querying an non-existing tag leads to has_match() === true' );
	}

	/**
	 *
	 */
	public function test_finding_non_existing_tag() {
		$w      = new WP_HTML_Walker( self::HTML_SIMPLE );
		$result = $w->next_tag( 'p' );
		$this->assertSame( $w, $result, 'Querying a non-existing tag returns the Walker object' );
		$this->assertFalse( $w->has_match(), 'Querying a non-existing tag leads to has_match() === false' );
	}

	/**
	 *
	 */
	public function test_chaining_after_a_non_existing_tag() {
		$w      = new WP_HTML_Walker( self::HTML_SIMPLE );
		$result = $w->next_tag( 'p' )->next_tag( 'div' )->set_attribute( 'id', 'primary' );
		$this->assertSame( $w, $result, 'Chaining after a non-existing tag still returns the Walker object' );
		$this->assertFalse( $w->has_match(), 'Chaining after a non-existing tag leads to has_match() === false' );
	}

	/**
	 *
	 */
	public function test_set_new_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->set_attribute( 'test-attribute', 'test-value' );
		$this->assertSame( '<div test-attribute="test-value" id="first"><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 * According to HTML spec, only the first instance of an attribute counts.
	 * The other ones are ignored.
	 */
	public function test_update_duplicated_attribute() {
		$w = new WP_HTML_Walker( '<div id="update-me" id="ignored-id"><span id="second">Text</span></div>' );
		$w->next_tag()->set_attribute( 'id', 'updated-id' );
		$this->assertSame( '<div id="updated-id" id="ignored-id"><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 * Removing an attribute that's listed many times, e.g. `<div id="a" id="b" />` should remove
	 * all its instances and output just `<div />`.
	 *
	 * Today, however, WP_HTML_Walker only removes the first such attribute. It seems like a corner case
	 * and introducing additional complexity to correctly handle this scenario doesn't seem to be worth it.
	 * Let's revisit if and when this becomes a problem.
	 *
	 * This test is in place to confirm this behavior, while incorrect, is well-defined.
	 */
	public function test_remove_duplicated_attribute() {
		$w = new WP_HTML_Walker( '<div id="update-me" id="ignored-id"><span id="second">Text</span></div>' );
		$w->next_tag()->remove_attribute( 'id' );
		$this->assertSame( '<div  id="ignored-id"><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 *
	 */
	public function test_set_existing_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->set_attribute( 'id', 'new-id' );
		$this->assertSame( '<div id="new-id"><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 *
	 */
	public function test_update_all_tags_using_a_loop() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		do {
			$w->next_tag()->set_attribute( 'data-foo', 'bar' );
		} while ( $w->has_match() );

		$this->assertSame( '<div data-foo="bar" id="first"><span data-foo="bar" id="second">Text</span></div>', (string) $w );
	}

	/**
	 *
	 */
	public function test_remove_existing_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->remove_attribute( 'id' );
		$this->assertSame( '<div ><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 *
	 */
	public function test_remove_non_existing_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->remove_attribute( 'no-such-attribute' );
		$this->assertSame( self::HTML_SIMPLE, (string) $w );
	}

	/**
	 *
	 */
	public function test_add_class_when_there_is_no_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->add_class( 'foo-class' );
		$this->assertSame( '<div class="foo-class" id="first"><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 *
	 */
	public function test_add_two_classes_when_there_is_no_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->add_class( 'foo-class' )->add_class( 'bar-class' );
		$this->assertSame( '<div class="foo-class bar-class" id="first"><span id="second">Text</span></div>', (string) $w );
	}

	/**
	 *
	 */
	public function test_remove_class_when_there_is_no_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->remove_class( 'foo-class' );
		$this->assertSame( self::HTML_SIMPLE, (string) $w );
	}

	/**
	 *
	 */
	public function test_add_class_when_there_is_a_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->add_class( 'foo-class' )->add_class( 'bar-class' );
		$this->assertSame(
			'<div class="main with-border foo-class bar-class" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);
	}

	/**
	 *
	 */
	public function test_remove_class_when_there_is_a_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->remove_class( 'main' );
		$this->assertSame(
			'<div class="with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);
	}

	/**
	 *
	 */
	public function test_removing_all_classes_removes_the_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->remove_class( 'main' )->remove_class( 'with-border' );
		$this->assertSame(
			'<div  id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);
	}

	/**
	 *
	 */
	public function test_does_not_add_duplicate_class_names() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->add_class( 'with-border' );
		$this->assertSame(
			'<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);
	}

	/**
	 *
	 */
	public function test_preserves_class_name_order_when_a_duplicate_class_name_is_added() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->add_class( 'main' );
		$this->assertSame(
			'<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);
	}

	/**
	 *
	 */
	public function test_set_attribute_takes_priority_over_add_class() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->add_class( 'add_class' )->set_attribute( 'class', 'set_attribute' );
		$this->assertSame(
			'<div class="set_attribute" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);

		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->set_attribute( 'class', 'set_attribute' )->add_class( 'add_class' );
		$this->assertSame(
			'<div class="set_attribute" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			(string) $w
		);
	}

	/**
	 *
	 */
	public function test_throws_no_exception_when_updating_an_attribute_without_matching_a_tag() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->set_attribute( 'id', 'first' );
		$this->assertSame( self::HTML_WITH_CLASSES, (string) $w );
	}

	/**
	 * @dataProvider parser_methods
	 */
	public function test_interactions_with_a_closed_walker_throw_an_exception( $method, $args ) {
		$this->expectException( WP_HTML_Walker_Exception::class );
		$this->expectExceptionMessage( 'WP_HTML_Walker was already cast to a string' );

		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag();
		$w->__toString(); // Force the walker to get to the end of the document.

		$w->$method( ...$args );
	}

	public function parser_methods() {
		return array(
			array( 'next_tag', array( 'div' ) ),
			array( 'set_attribute', array( 'id', 'test' ) ),
			array( 'remove_attribute', array( 'id' ) ),
			array( 'add_class', array( 'main' ) ),
			array( 'remove_class', array( 'main' ) ),
		);
	}

	/**
	 *
	 */
	public function test_advanced_use_case() {
		$input = <<<HTML
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
<div data-details="{ &quot;key&quot;: &quot;value&quot; }" selected class="merge-message is-processed" checked>
	<div class="select-menu d-inline-block">
		<div checked class="MixedCaseHTML position-relative button-group Another-Mixed-Case" />
		<div checked class="MixedCaseHTML position-relative button-group Another-Mixed-Case">
			<button type="button" class="merge-box-button btn-group-merge rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Merge pull request
			</button>

			<button type="button" class="merge-box-button btn-group-squash rounded-left-2 btn  BtnGroup-item js-details-target hx_create-pr-button" aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Squash and merge
			</button>

			<button type="button"  aria-expanded="false" data-details-container=".js-merge-pr" disabled="">
			  Rebase and merge
			</button>

			<button aria-label="Select merge method" disabled="disabled" type="button" data-view-component="true" class="select-menu-button btn BtnGroup-item"></button>
		</div>
	</div>
</div>
HTML;

		$w = new WP_HTML_Walker( $input );
		$w
			->next_tag( 'div' )
			->set_attribute( 'data-details', '{ "key": "value" }' )
			->add_class( 'is-processed' )
			->next_tag(
				array(
					'tag_name'   => 'div',
					'class_name' => 'BtnGroup',
				)
			)
			->remove_class( 'BtnGroup' )
			->add_class( 'button-group' )
			->add_class( 'Another-Mixed-Case' )
			->next_tag(
				array(
					'tag_name'   => 'div',
					'class_name' => 'BtnGroup',
				)
			)
			->remove_class( 'BtnGroup' )
			->add_class( 'button-group' )
			->add_class( 'Another-Mixed-Case' )
			->next_tag(
				array(
					'tag_name'     => 'button',
					'class_name'   => 'btn',
					'match_offset' => 2,
				)
			)
			->remove_attribute( 'class' )
			->next_tag( 'non-existent' )
			->set_attribute( 'class', 'test' );
		$this->assertSame( $expected_output, (string) $w );
	}
}
