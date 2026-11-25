<?php
/**
 * Tests the shared classifier that tells the kind of an inline suggestion
 * marker from its class token.
 *
 * Every reader of inline suggestion markers on the server (the render strip,
 * the save pass's anchor index) classifies a `<mark>` through this one helper,
 * so a new marker kind or a change to the contract lands in one place.
 *
 * @group suggestions
 */
class Tests_Suggestion_Marker_Kind extends WP_UnitTestCase {

	/**
	 * Classifies the first tag of an HTML fragment.
	 *
	 * @param string $html Fragment whose first tag is the one to classify.
	 * @return string|null Marker kind.
	 */
	private function kind_of( $html ) {
		$processor = new WP_HTML_Tag_Processor( $html );
		$processor->next_tag();
		return gutenberg_get_suggestion_marker_kind( $processor );
	}

	/**
	 * @dataProvider data_typed_markers
	 *
	 * @param string      $html     Marker opener.
	 * @param string|null $expected Expected kind.
	 */
	public function test_classifies_typed_markers( $html, $expected ) {
		$this->assertSame( $expected, $this->kind_of( $html ) );
	}

	/**
	 * @return array[]
	 */
	public function data_typed_markers() {
		return array(
			'addition'                     => array( '<mark class="wp-suggestion-add" data-suggestion-id="1" data-suggestion-type="add">', 'add' ),
			'deletion'                     => array( '<mark class="wp-suggestion-del" data-suggestion-id="1" data-suggestion-type="del">', 'del' ),
			'format'                       => array( '<mark class="wp-suggestion-format" data-suggestion-id="1" data-suggestion-type="format">', 'format' ),
			'type attribute omitted'       => array( '<mark class="wp-suggestion-add" data-suggestion-id="1">', 'add' ),
			'class wins over attribute'    => array( '<mark class="wp-suggestion-del" data-suggestion-type="add">', 'del' ),
			'class among other tokens'     => array( '<mark class="annotation wp-suggestion-format other">', 'format' ),
			'uppercase tag'                => array( '<MARK class="wp-suggestion-add">', 'add' ),
			'old single class'             => array( '<mark class="wp-suggestion" data-suggestion-type="add">', null ),
			'unrelated suffix'             => array( '<mark class="wp-suggestion-foo">', null ),
			'a11y decoration'              => array( '<mark class="wp-suggestion-a11y">', null ),
			'note marker'                  => array( '<mark class="wp-note" data-id="3">', null ),
			'highlight'                    => array( '<mark style="background-color:#ff0">', null ),
			'not a mark'                   => array( '<span class="wp-suggestion-add">', null ),
			'type attribute without class' => array( '<mark data-suggestion-type="add">', null ),
		);
	}

	public function test_closer_is_not_a_marker() {
		$processor = new WP_HTML_Tag_Processor( '<mark class="wp-suggestion-add">a</mark>' );
		$processor->next_tag();
		$processor->next_tag( array( 'tag_closers' => 'visit' ) );
		$this->assertTrue( $processor->is_tag_closer() );
		$this->assertNull( gutenberg_get_suggestion_marker_kind( $processor ) );
	}
}
