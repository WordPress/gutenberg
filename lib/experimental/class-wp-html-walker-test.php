<?php

use PHPUnit\Framework\TestCase;

require_once './class-wp-html-walker.php';

final class WP_HTML_Walker_Tests extends TestCase {
	const HTML_SIMPLE       = '<div id="first"><span id="second">Text</span></div>';
	const HTML_WITH_CLASSES = '<div class="main with-border" id="first"><span class="not-main bold with-border" id="second">Text</span></div>';

	/**
	 *
	 */
	public function test_to_string_with_no_updates_returns_the_original_html() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$this->assertSame( self::HTML_SIMPLE, $w . '' );
	}

	/**
	 *
	 */
	public function test_finding_existing_tag_returns_the_walker_object() {
		$w      = new WP_HTML_Walker( self::HTML_SIMPLE );
		$result = $w->next_tag();
		$this->assertSame( $w, $result, 'Finding an existing tag returns the Walker object' );
	}

	/**
	 *
	 */
	public function test_finding_non_existing_tag_returns_false() {
		$w      = new WP_HTML_Walker( self::HTML_SIMPLE );
		$result = $w->next_tag( 'p' );
		$this->assertFalse( $result );
	}

	/**
	 *
	 */
	public function test_set_new_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->set_attribute( 'test-attribute', 'test-value' );
		$this->assertSame( '<div test-attribute="test-value" id="first"><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_set_existing_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->set_attribute( 'id', 'new-id' );
		$this->assertSame( '<div id="new-id"><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_remove_existing_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->remove_attribute( 'id' );
		$this->assertSame( '<div ><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_remove_non_existing_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->remove_attribute( 'no-such-attribute' );
		$this->assertSame( '<div id="first"><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_add_class_when_there_is_no_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->add_class( 'foo-class' );
		$this->assertSame( '<div class="foo-class" id="first"><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_add_two_classes_when_there_is_no_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->add_class( 'foo-class' )->add_class( 'bar-class' );
		$this->assertSame( '<div class="foo-class bar-class" id="first"><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_remove_class_when_there_is_no_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_SIMPLE );
		$w->next_tag()->remove_class( 'foo-class' );
		$this->assertSame( '<div id="first"><span id="second">Text</span></div>', $w . '' );
	}

	/**
	 *
	 */
	public function test_add_class_when_there_is_a_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->add_class( 'foo-class' )->add_class( 'bar-class' );
		$this->assertSame(
			'<div class="main with-border foo-class bar-class" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$w . ''
		);
	}

	/**
	 *
	 */
	public function test_remove_class_when_there_is_a_class_attribute() {
		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->add_class( 'foo-class' )->add_class( 'bar-class' );
		$this->assertSame(
			'<div class="main with-border foo-class bar-class" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$w . ''
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
			$w . ''
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
			$w . ''
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
			$w . ''
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
			$w . ''
		);

		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag()->set_attribute( 'class', 'set_attribute' )->add_class( 'add_class' );
		$this->assertSame(
			'<div class="set_attribute" id="first"><span class="not-main bold with-border" id="second">Text</span></div>',
			$w . ''
		);
	}

	/**
	 *
	 */
	public function test_throws_an_exception_when_updating_an_attribute_without_matching_a_tag() {
		$this->expectException( WP_HTML_Walker_Exception::class );
		$this->expectExceptionMessage( 'Cannot update a tag: No tag was matched' );

		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->set_attribute( 'id', 'first' );
	}

	/**
	 *
	 */
	public function test_throws_an_exception_when_updating_a_closed_walker() {
		$this->expectException( WP_HTML_Walker_Exception::class );
		$this->expectExceptionMessage( 'Cannot update a tag: WP_HTML_Walker can only move forward through the HTML document and it has already reached an end.' );

		$w = new WP_HTML_Walker( self::HTML_WITH_CLASSES );
		$w->next_tag();
		$w->__toString(); // Force the walker to get to the end of the document.

		$w->set_attribute( 'id', 'first' );
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
			->remove_attribute( 'class' );
		$this->assertSame( $expected_output, $w . '' );
	}
}
