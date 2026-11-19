<?php
/**
 * Tests that the save pass's extraction and re-inflation of suggestion
 * proposals are exact inverses, and that extracted content carries none of
 * what was proposed.
 *
 * Fixtures are editor output: the inline markers and block markers as the
 * editor serializes them. `%1`, `%2` and `%3` stand for the ids of three
 * suggestion notes on the post.
 *
 * @group suggestions
 */
class Tests_Suggestion_Content_Round_Trip extends WP_UnitTestCase {

	/**
	 * Note ids `%1`..`%3` resolve to.
	 *
	 * @var int[]
	 */
	private $ids = array( 101, 102, 103 );

	private function fill( $fixture ) {
		return str_replace( array( '%1', '%2', '%3' ), array_map( 'strval', $this->ids ), $fixture );
	}

	private function originals( $originals ) {
		$filled = array();
		foreach ( $originals as $placeholder => $html ) {
			$filled[ (int) $this->fill( $placeholder ) ] = $html;
		}
		return $filled;
	}

	private function notes() {
		return array_fill_keys( $this->ids, true );
	}

	/**
	 * @dataProvider data_fixtures
	 *
	 * @param string   $fixture   Editor content.
	 * @param string[] $proposed  Words only a proposal holds.
	 * @param string[] $originals Original run of a formatting suggestion, by
	 *                            placeholder (`%1`).
	 */
	public function test_round_trip( $fixture, $proposed, $originals = array() ) {
		$content   = $this->fill( $fixture );
		$originals = $this->originals( $originals );
		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes(), array(), $originals );

		// I1: inflating the extracted content gives the editor's bytes back.
		$this->assertSame( $content, Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] ) );

		// I2: nothing proposed is left in the content.
		foreach ( $proposed as $word ) {
			$this->assertStringNotContainsString( $word, $extracted['content'] );
		}

		// I3: extraction is idempotent and keeps no new items.
		$again = Gutenberg_Suggestion_Content::extract( $extracted['content'], $this->notes(), array(), $originals );
		$this->assertSame( $extracted['content'], $again['content'] );
		$this->assertSame( array(), $again['items'] );

		// Extracting the re-inflated content anchors it the same way.
		$inflated = Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] );
		$this->assertSame( $extracted['content'], Gutenberg_Suggestion_Content::extract( $inflated, $this->notes(), array(), $originals )['content'] );

		// Every item's anchor is in the content, once.
		foreach ( $extracted['items'] as $items ) {
			foreach ( $items as $item ) {
				$this->assertSame( 1, substr_count( $extracted['content'], $item['anchor'] ) );
			}
		}

		// The anchored content still parses into blocks without changing
		// what the blocks outside the proposals hold.
		$this->assertNotEmpty( parse_blocks( $extracted['content'] ) );
	}

	public function data_fixtures() {
		$mark      = static function ( $id, $kind, $text, $extra = '' ) {
			return '<mark data-suggestion-id="' . $id . '" data-suggestion-type="' . $kind . '" data-author="1" class="wp-suggestion-' . $kind . '"' . $extra . '>' . $text . '</mark>';
		};
		$paragraph = static function ( $html, $attrs = '{"metadata":{"noteId":[%1]}}' ) {
			return '<!-- wp:paragraph ' . $attrs . " -->\n<p>" . $html . "</p>\n<!-- /wp:paragraph -->";
		};

		return array(
			'addition at the end'                         => array(
				$paragraph( 'Hello' . $mark( '%1', 'add', ' zanzibarian' ) ),
				array( 'zanzibarian' ),
			),
			'addition at the start'                       => array(
				$paragraph( $mark( '%1', 'add', 'Quokka ' ) . 'Hello' ),
				array( 'Quokka' ),
			),
			'addition in the middle'                      => array(
				$paragraph( 'Hello ' . $mark( '%1', 'add', 'brave ' ) . 'world' ),
				array( 'brave' ),
			),
			'multibyte and emoji'                         => array(
				$paragraph( 'Café ' . $mark( '%1', 'add', 'naïve 🦘 日本語' ) . ' fin' ),
				array( 'naïve', '🦘', '日本語' ),
			),
			'addition wrapping formatting'                => array(
				$paragraph( 'a ' . $mark( '%1', 'add', '<strong>bold</strong> <em>slanted</em> <a href="https://example.com/x">linked</a>' ) . ' b' ),
				array( 'bold', 'slanted', 'linked', 'example.com/x' ),
			),
			'two runs of one note'                        => array(
				$paragraph( $mark( '%1', 'add', 'alpha' ) . ' middle ' . $mark( '%1', 'add', 'omega' ) ),
				array( 'alpha', 'omega' ),
			),
			'replacement'                                 => array(
				$paragraph( 'The ' . $mark( '%1', 'del', 'old' ) . $mark( '%1', 'add', 'novel' ) . ' word' ),
				array( 'novel' ),
			),
			'another note deleting inside an addition'    => array(
				$paragraph( $mark( '%1', 'add', 'outer ' . $mark( '%2', 'del', 'innerdel' ) . ' tail' ) ),
				array( 'outer', 'innerdel', 'tail' ),
			),
			'an addition inside another note\'s deletion' => array(
				$paragraph( $mark( '%2', 'del', 'kept ' . $mark( '%1', 'add', 'sprout' ) . ' text' ) ),
				array( 'sprout' ),
			),
			'next to an inline note'                      => array(
				$paragraph( '<mark class="wp-note" data-id="9">noted</mark>' . $mark( '%1', 'add', 'pinned' ) ),
				array( 'pinned' ),
			),
			'class before data attributes'                => array(
				$paragraph( 'x<mark class="wp-suggestion-add" data-suggestion-id="%1" data-suggestion-type="add">swapped</mark>y' ),
				array( 'swapped' ),
			),
			'in a list item'                              => array(
				"<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>one" . $mark( '%1', 'add', ' listed' ) . "</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->",
				array( 'listed' ),
			),
			'in a table cell'                             => array(
				"<!-- wp:table -->\n<figure class=\"wp-block-table\"><table><tbody><tr><td>a" . $mark( '%1', 'add', 'celled' ) . "</td><td>b</td></tr></tbody></table></figure>\n<!-- /wp:table -->",
				array( 'celled' ),
			),
			'in a quote'                                  => array(
				"<!-- wp:quote -->\n<blockquote class=\"wp-block-quote\"><!-- wp:paragraph -->\n<p>q" . $mark( '%1', 'add', 'quoted' ) . "</p>\n<!-- /wp:paragraph --></blockquote>\n<!-- /wp:quote -->",
				array( 'quoted' ),
			),
			'in a heading'                                => array(
				"<!-- wp:heading -->\n<h2 class=\"wp-block-heading\">Head" . $mark( '%1', 'add', 'lined' ) . "</h2>\n<!-- /wp:heading -->",
				array( 'lined' ),
			),
			'in a button'                                 => array(
				"<!-- wp:buttons -->\n<div class=\"wp-block-buttons\"><!-- wp:button -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link wp-element-button\">Go" . $mark( '%1', 'add', 'clicky' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
				array( 'clicky' ),
			),
			'an HTML comment inside the block'            => array(
				$paragraph( 'a<!-- </mark> -->' . $mark( '%1', 'add', 'commented' ) . 'b' ),
				array( 'commented' ),
			),
			'a closer inside an attribute value'          => array(
				$paragraph( $mark( '%1', 'add', '<span title="</mark>">attributed</span>' ) . ' after' ),
				array( 'attributed' ),
			),
			'suggested block'                             => array(
				"<!-- wp:paragraph -->\n<p>Existing paragraph</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"authorId\":1,\"commentId\":%1},\"noteId\":[%1]}} -->\n<p>Quixotic suggested paragraph</p>\n<!-- /wp:paragraph -->",
				array( 'Quixotic' ),
			),
			'suggested void block'                        => array(
				"<!-- wp:paragraph -->\n<p>Before</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:latest-posts {\"postsToShow\":7,\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} /-->",
				array( 'postsToShow' ),
			),
			'suggested block with inner blocks'           => array(
				"<!-- wp:group {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}},\"layout\":{\"type\":\"constrained\"}} -->\n<div class=\"wp-block-group\"><!-- wp:paragraph -->\n<p>Grouped proposal</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:group -->\n\n<!-- wp:paragraph -->\n<p>After</p>\n<!-- /wp:paragraph -->",
				array( 'Grouped proposal' ),
			),
			'suggested block nested in a group'           => array(
				"<!-- wp:group {\"layout\":{\"type\":\"constrained\"}} -->\n<div class=\"wp-block-group\"><!-- wp:paragraph -->\n<p>Kept</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Nested proposal</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:group -->",
				array( 'Nested proposal' ),
			),
			'suggested block first and last'              => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Opening proposal</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Middle</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%2}}} -->\n<p>Closing proposal</p>\n<!-- /wp:paragraph -->",
				array( 'Opening proposal', 'Closing proposal' ),
			),
			'another note\'s addition in a suggested block' => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Block " . $mark( '%2', 'add', 'riding' ) . " proposal</p>\n<!-- /wp:paragraph -->",
				array( 'riding', 'Block' ),
			),
			'grouped replacement of a block'              => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-remove\",\"commentId\":%1}}} -->\n<p>Removed but public</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Replacement proposal</p>\n<!-- /wp:paragraph -->",
				array( 'Replacement proposal' ),
			),
			'proposed heading level'                      => array(
				"<!-- wp:heading {\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"authorId\":1,\"after\":{\"level\":3},\"commentId\":%1},\"noteId\":[%1]}} -->\n<h2 class=\"wp-block-heading\">My Heading</h2>\n<!-- /wp:heading -->",
				array( '"after"', '"level":3' ),
			),
			'proposed object attribute'                   => array(
				"<!-- wp:paragraph {\"style\":{},\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"after\":{\"style\":{\"color\":{\"text\":\"#bada55\"}}},\"commentId\":%1}}} -->\n<p>Colour</p>\n<!-- /wp:paragraph -->",
				array( 'bada55' ),
			),
			'proposed content fallback'                   => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"after\":{\"content\":\"Pasted\\nlines\"},\"commentId\":%1}}} -->\n<p>Original</p>\n<!-- /wp:paragraph -->",
				array( 'Pasted' ),
			),
			'proposed value the serializer escapes'       => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"after\":{\"content\":\"\\u003cb\\u003eangle\\u003c/b\\u003e \\u0026 \\u0022quoted\\u0022 \\u002d\\u002d dashes\"},\"commentId\":%1}}} -->\n<p>Plain</p>\n<!-- /wp:paragraph -->",
				array( 'angle', 'quoted', 'dashes' ),
			),
			'proposal riding on a removal'                => array(
				"<!-- wp:heading {\"metadata\":{\"noteId\":%1,\"suggestion\":{\"type\":\"pending-remove\",\"after\":{\"level\":4}}}} -->\n<h2 class=\"wp-block-heading\">T</h2>\n<!-- /wp:heading -->",
				array( '"level":4' ),
			),
			'proposal riding on a suggested block'        => array(
				"<!-- wp:heading {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"after\":{\"level\":5},\"commentId\":%1}}} -->\n<h2 class=\"wp-block-heading\">Inserted heading</h2>\n<!-- /wp:heading -->",
				array( '"level":5', 'Inserted heading' ),
			),
			'bold proposed on a run'                      => array(
				$paragraph( 'Hello ' . $mark( '%1', 'format', '<strong>world</strong>' ) ),
				array( '<strong>' ),
				array( '%1' => 'world' ),
			),
			'italic and a link proposed'                  => array(
				$paragraph( 'a ' . $mark( '%1', 'format', '<em><a href="https://example.com/proposed">run</a></em>' ) . ' b' ),
				array( '<em>', 'example.com/proposed' ),
				array( '%1' => 'run' ),
			),
			'bold proposed off a run'                     => array(
				$paragraph( 'a ' . $mark( '%1', 'format', 'plain' ) . ' b' ),
				array(),
				array( '%1' => '<strong>plain</strong>' ),
			),
			'formatting inside an addition'               => array(
				$paragraph( $mark( '%1', 'add', 'new ' . $mark( '%2', 'format', '<strong>bold</strong>' ) ) ),
				array( 'new', 'bold' ),
				array( '%2' => 'bold' ),
			),
			'block moved down'                            => array(
				"<!-- wp:paragraph -->\n<p>Second paragraph</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-move\",\"fromIndex\":0,\"fromParentClientId\":null,\"crossedParents\":false,\"commentId\":%1},\"noteId\":[%1]}} -->\n<p>First paragraph</p>\n<!-- /wp:paragraph -->",
				array(),
			),
			'block moved up to the start'                 => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-move\",\"fromIndex\":2,\"commentId\":%1}}} -->\n<p>C</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>A</p>\n<!-- /wp:paragraph -->\n<!-- wp:paragraph -->\n<p>B</p>\n<!-- /wp:paragraph -->",
				array(),
			),
			'nested list reorder'                         => array(
				"<!-- wp:list -->\n<ul class=\"wp-block-list\"><!-- wp:list-item -->\n<li>one</li>\n<!-- /wp:list-item -->\n\n<!-- wp:list-item {\"metadata\":{\"suggestion\":{\"type\":\"pending-move\",\"fromIndex\":0,\"fromParentClientId\":\"abc\",\"commentId\":%1}}} -->\n<li>zero</li>\n<!-- /wp:list-item --></ul>\n<!-- /wp:list -->",
				array(),
			),
			'move next to a suggested block'              => array(
				"<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%2}}} -->\n<p>Inserted words</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>Stays</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-move\",\"fromIndex\":0,\"commentId\":%1}}} -->\n<p>Mover with " . $mark( '%3', 'add', 'riders' ) . "</p>\n<!-- /wp:paragraph -->",
				array( 'Inserted words', 'riders' ),
			),
			'everything together'                         => array(
				$paragraph( 'Lead ' . $mark( '%2', 'add', 'mixed' ) ) . "\n\n<!-- wp:heading {\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"after\":{\"level\":3},\"commentId\":%3}}} -->\n<h2 class=\"wp-block-heading\">H</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Inserted</p>\n<!-- /wp:paragraph -->",
				array( 'mixed', '"level":3', 'Inserted' ),
			),
		);
	}

	/**
	 * Moves the extraction leaves in the proposed order, as the front-end
	 * restore does.
	 *
	 * @dataProvider data_unrestorable_moves
	 *
	 * @param string $fixture Editor content.
	 */
	public function test_unrestorable_moves_stay_in_the_proposed_order( $fixture ) {
		$content = $this->fill( $fixture );

		$this->assertSame( $content, Gutenberg_Suggestion_Content::extract( $content, $this->notes() )['content'] );
	}

	public function data_unrestorable_moves() {
		$block = static function ( $text, $suggestion = '' ) {
			$attrs = $suggestion ? ' {"metadata":{"suggestion":' . $suggestion . '}}' : '';
			return '<!-- wp:paragraph' . $attrs . " -->\n<p>{$text}</p>\n<!-- /wp:paragraph -->";
		};
		return array(
			'two moves in one list'  => array( $block( 'B', '{"type":"pending-move","fromIndex":1,"commentId":%1}' ) . "\n\n" . $block( 'A', '{"type":"pending-move","fromIndex":0,"commentId":%2}' ) ),
			'a cross-parent move'    => array( $block( 'B' ) . "\n\n" . $block( 'A', '{"type":"pending-move","fromIndex":0,"crossedParents":true,"commentId":%1}' ) ),
			'an origin out of range' => array( $block( 'B' ) . "\n\n" . $block( 'A', '{"type":"pending-move","fromIndex":5,"commentId":%1}' ) ),
			'markup between blocks'  => array( $block( 'B' ) . "\n<p>freeform</p>\n" . $block( 'A', '{"type":"pending-move","fromIndex":0,"commentId":%1}' ) ),
			'no note yet'            => array( $block( 'B' ) . "\n\n" . $block( 'A', '{"type":"pending-move","fromIndex":0}' ) ),
		);
	}

	public function test_a_move_is_stored_in_the_original_order() {
		$content = $this->fill( "<!-- wp:paragraph -->\n<p>B</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-move\",\"fromIndex\":0,\"commentId\":%1}}} -->\n<p>A</p>\n<!-- /wp:paragraph -->" );

		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() )['content'];

		$this->assertSame(
			$this->fill( "<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-move\",\"fromIndex\":0,\"commentId\":%1}}} -->\n<p>A</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph -->\n<p>B</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:suggestion-placeholder {\"id\":%1,\"type\":\"pending-move\",\"run\":0} /-->" ),
			$extracted
		);
		// The front end renders the stored order as it is.
		$this->assertSame( $extracted, gutenberg_restore_pending_move_order( $extracted ) );
	}

	public function test_a_stale_formatting_original_stays_in_full_form() {
		$content = $this->fill( "<!-- wp:paragraph -->\n<p>Hello <mark data-suggestion-id=\"%1\" data-suggestion-type=\"format\" class=\"wp-suggestion-format\"><strong>world</strong></mark></p>\n<!-- /wp:paragraph -->" );

		$stale  = Gutenberg_Suggestion_Content::extract( $content, $this->notes(), array(), array( 101 => 'other text' ) );
		$nested = Gutenberg_Suggestion_Content::extract(
			$this->fill( '<p><mark data-suggestion-id="%1" data-suggestion-type="format" class="wp-suggestion-format"><strong>a<mark data-suggestion-id="%2" data-suggestion-type="del" class="wp-suggestion-del">b</mark></strong></mark></p>' ),
			$this->notes(),
			array(),
			array( 101 => 'ab' )
		);

		$this->assertSame( $content, $stale['content'] );
		$this->assertSame( array(), $nested['items'] );
	}

	public function test_the_render_strip_unwraps_a_formatting_anchor() {
		$html = '<p>Hello <mark data-suggestion-run="0" data-suggestion-id="101" data-suggestion-type="format" class="wp-suggestion-format">world</mark></p>';

		$this->assertSame( '<p>Hello world</p>', gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	public function test_unclosed_marker_is_left_byte_for_byte() {
		$content = $this->fill( "<!-- wp:paragraph -->\n<p>a<mark data-suggestion-id=\"%1\" data-suggestion-type=\"add\" class=\"wp-suggestion-add\">open</p>\n<!-- /wp:paragraph -->" );

		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() );

		$this->assertSame( $content, $extracted['content'] );
		$this->assertSame( array(), $extracted['items'] );
	}

	public function test_unbalanced_block_delimiters_are_left_alone() {
		$content = $this->fill( "<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Unclosed</p>" );

		$this->assertSame( $content, Gutenberg_Suggestion_Content::extract( $content, $this->notes() )['content'] );
	}

	public function test_anchors_are_numbered_per_note() {
		$content = $this->fill( '<p><mark data-suggestion-id="%1" data-suggestion-type="add" class="wp-suggestion-add">a</mark><mark data-suggestion-id="%2" data-suggestion-type="add" class="wp-suggestion-add">b</mark><mark data-suggestion-id="%1" data-suggestion-type="add" class="wp-suggestion-add">c</mark></p>' );

		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() );

		$this->assertSame( array( 0, 1 ), wp_list_pluck( $extracted['items'][101], 'run' ) );
		$this->assertSame( array( 0 ), wp_list_pluck( $extracted['items'][102], 'run' ) );
		$this->assertSame(
			$this->fill( '<p><mark data-suggestion-run="0" data-suggestion-id="%1" data-suggestion-type="add" class="wp-suggestion-add"></mark><mark data-suggestion-run="0" data-suggestion-id="%2" data-suggestion-type="add" class="wp-suggestion-add"></mark><mark data-suggestion-run="1" data-suggestion-id="%1" data-suggestion-type="add" class="wp-suggestion-add"></mark></p>' ),
			$extracted['content']
		);
	}

	public function test_new_runs_skip_runs_already_anchored() {
		$content = $this->fill( '<p><mark data-suggestion-id="%1" data-suggestion-type="add" class="wp-suggestion-add" data-suggestion-run="0"></mark><mark data-suggestion-id="%1" data-suggestion-type="add" class="wp-suggestion-add">new</mark></p>' );

		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() );

		$this->assertSame( array( 1 ), wp_list_pluck( $extracted['items'][101], 'run' ) );
	}

	public function test_attribute_anchor_keeps_the_rest_of_the_opener() {
		$content = $this->fill( "<!-- wp:heading {\"level\":2,\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"after\":{\"level\":3},\"commentId\":%1}}} -->\n<h2 class=\"wp-block-heading\">T</h2>\n<!-- /wp:heading -->" );

		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() );

		$this->assertSame(
			$this->fill( "<!-- wp:heading {\"level\":2,\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"commentId\":%1,\"run\":0}}} -->\n<h2 class=\"wp-block-heading\">T</h2>\n<!-- /wp:heading -->" ),
			$extracted['content']
		);
		$this->assertSame( array( 'level' => 3 ), $extracted['items'][101][0]['after'] );
	}

	public function test_placeholder_names_its_note() {
		$content = $this->fill( "<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>P</p>\n<!-- /wp:paragraph -->" );

		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() );

		$this->assertSame( '<!-- wp:suggestion-placeholder {"id":101,"type":"pending-insert","run":0} /-->', $extracted['content'] );
		$this->assertSame( '', do_blocks( $extracted['content'] ) );
	}
}
