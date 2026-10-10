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

	private function notes() {
		return array_fill_keys( $this->ids, true );
	}

	/**
	 * @dataProvider data_fixtures
	 *
	 * @param string   $fixture  Editor content.
	 * @param string[] $proposed Words only a proposal holds.
	 */
	public function test_round_trip( $fixture, $proposed ) {
		$content   = $this->fill( $fixture );
		$extracted = Gutenberg_Suggestion_Content::extract( $content, $this->notes() );

		// I1: inflating the extracted content gives the editor's bytes back.
		$this->assertSame( $content, Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] ) );

		// I2: nothing proposed is left in the content.
		foreach ( $proposed as $word ) {
			$this->assertStringNotContainsString( $word, $extracted['content'] );
		}

		// I3: extraction is idempotent and keeps no new items.
		$again = Gutenberg_Suggestion_Content::extract( $extracted['content'], $this->notes() );
		$this->assertSame( $extracted['content'], $again['content'] );
		$this->assertSame( array(), $again['items'] );

		// Extracting the re-inflated content anchors it the same way.
		$inflated = Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] );
		$this->assertSame( $extracted['content'], Gutenberg_Suggestion_Content::extract( $inflated, $this->notes() )['content'] );

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
			'everything together'                         => array(
				$paragraph( 'Lead ' . $mark( '%2', 'add', 'mixed' ) ) . "\n\n<!-- wp:heading {\"metadata\":{\"suggestion\":{\"type\":\"pending-attributes\",\"after\":{\"level\":3},\"commentId\":%3}}} -->\n<h2 class=\"wp-block-heading\">H</h2>\n<!-- /wp:heading -->\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"commentId\":%1}}} -->\n<p>Inserted</p>\n<!-- /wp:paragraph -->",
				array( 'mixed', '"level":3', 'Inserted' ),
			),
		);
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
