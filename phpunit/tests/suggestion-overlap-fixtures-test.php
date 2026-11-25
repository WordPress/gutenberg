<?php
/**
 * Checks the server against the shared overlap fixtures: the content the
 * editor saves for each fixture renders as the text every suggestion
 * rejected would publish, and the save pass extracts and re-inflates it byte
 * for byte.
 *
 * The fixtures and the data generated from them by the oracle live in
 * `packages/editor/src/components/inline-suggestions/test/fixtures/overlaps/`.
 * A fixture of a phase of the overlap plan that has not landed is skipped;
 * set `OVERLAP_PHASES` (for example `OVERLAP_PHASES=A`) to run it anyway.
 *
 * @group suggestions
 */
class Tests_Suggestion_Overlap_Fixtures extends WP_UnitTestCase {

	/**
	 * Phases of the overlap plan that have landed.
	 *
	 * @var string[]
	 */
	const LANDED_PHASES = array( 'current', 'A', 'B' );

	/**
	 * Returns one data set per generated fixture file.
	 *
	 * @return array<string, array{0: array<string, mixed>}>
	 */
	public function data_fixtures(): array {
		$directory = gutenberg_dir_path() . 'packages/editor/src/components/inline-suggestions/test/fixtures/overlaps/generated';
		$data      = array();
		foreach ( glob( $directory . '/*.json' ) as $file ) {
			$fixture                  = json_decode( (string) file_get_contents( $file ), true );
			$data[ $fixture['name'] ] = array( $fixture );
		}
		return $data;
	}

	/**
	 * Skips a fixture whose phase has not landed.
	 *
	 * @param array<string, mixed> $fixture Generated fixture data.
	 */
	private function skip_unless_landed( array $fixture ): void {
		$forced = array_map( 'trim', explode( ',', (string) getenv( 'OVERLAP_PHASES' ) ) );
		if ( ! in_array( $fixture['phase'], self::LANDED_PHASES, true ) && ! in_array( $fixture['phase'], $forced, true ) ) {
			$this->markTestSkipped( "Phase {$fixture['phase']} of the overlap plan has not landed." );
		}
	}

	/**
	 * Creates a post holding the fixture's paragraph, with a pending note
	 * per suggestion by its own author.
	 *
	 * @param array<string, mixed> $fixture Generated fixture data.
	 * @return array{post_id: int, content: string, notes: array<int, bool>, originals: array<int, string>}
	 */
	private function seed( array $fixture ): array {
		$post_id   = self::factory()->post->create();
		$search    = array();
		$replace   = array();
		$notes     = array();
		$originals = array();
		$authors   = array();
		foreach ( $fixture['suggestions'] as $suggestion ) {
			$key    = $suggestion['key'];
			$author = $suggestion['author'];
			if ( ! isset( $authors[ $author ] ) ) {
				$authors[ $author ] = self::factory()->user->create( array( 'role' => 'editor' ) );
			}
			$note_id = self::factory()->comment->create(
				array(
					'comment_post_ID'  => $post_id,
					'comment_type'     => 'note',
					'comment_approved' => '0',
					'user_id'          => $authors[ $author ],
				)
			);
			$payload = array(
				'schemaVersion' => 2,
				'blockName'     => 'core/paragraph',
				'baseRevision'  => null,
				'operations'    => array( $suggestion['operation'] ),
			);
			update_comment_meta( $note_id, '_wp_suggestion', wp_slash( (string) wp_json_encode( $payload ) ) );
			$notes[ $note_id ] = true;
			if ( isset( $suggestion['operation']['beforeHTML'] ) ) {
				$originals[ $note_id ] = $suggestion['operation']['beforeHTML'];
			}
			$search[]  = '{{id:' . $key . '}}';
			$replace[] = (string) $note_id;
			$search[]  = '{{author:' . $key . '}}';
			$replace[] = (string) $authors[ $author ];
		}
		$metadata = wp_json_encode( array( 'metadata' => array( 'noteId' => array_keys( $notes ) ) ) );
		$content  = '<!-- wp:paragraph ' . $metadata . " -->\n<p>" . str_replace( $search, $replace, $fixture['html'] ) . "</p>\n<!-- /wp:paragraph -->";

		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $post_id ) );
		clean_post_cache( $post_id );

		return array(
			'post_id'   => $post_id,
			'content'   => $content,
			'notes'     => $notes,
			'originals' => $originals,
		);
	}

	/**
	 * @dataProvider data_fixtures
	 *
	 * @param array<string, mixed> $fixture Generated fixture data.
	 */
	public function test_renders_as_every_suggestion_rejected( array $fixture ): void {
		$this->skip_unless_landed( $fixture );
		$seeded = $this->seed( $fixture );

		$GLOBALS['post'] = get_post( $seeded['post_id'] );
		$rendered        = trim( apply_filters( 'the_content', $seeded['content'] ) );
		$rendered        = str_replace( ' class="wp-block-paragraph"', '', $rendered );

		$this->assertSame( '<p>' . $fixture['views']['rejectedHTML'] . '</p>', $rendered );
	}

	/**
	 * Every stored decision order publishes, through the server's view of
	 * the markers, what the oracle publishes.
	 *
	 * @dataProvider data_fixtures
	 *
	 * @param array<string, mixed> $fixture Generated fixture data.
	 */
	public function test_every_order_publishes_what_the_oracle_publishes( array $fixture ): void {
		$this->skip_unless_landed( $fixture );
		$ids = array();
		foreach ( $fixture['suggestions'] as $index => $suggestion ) {
			$ids[ $suggestion['key'] ] = $index + 1;
		}
		$html      = preg_replace_callback(
			'/\{\{(?:id|author):(\w+)\}\}/',
			static function ( array $matches ) use ( $ids ): string {
				return (string) $ids[ $matches[1] ];
			},
			$fixture['html']
		);
		$originals = array();
		foreach ( (array) $fixture['suggestions'] as $suggestion ) {
			if ( is_array( $suggestion ) && is_array( $suggestion['operation'] ) && is_string( $suggestion['operation']['beforeHTML'] ?? null ) && is_string( $suggestion['key'] ) ) {
				$originals[ (int) $ids[ $suggestion['key'] ] ] = $suggestion['operation']['beforeHTML'];
			}
		}
		$checked = 0;
		foreach ( $fixture['orders']['list'] as $order ) {
			$accepted = array();
			foreach ( $order['accepted'] as $key ) {
				$accepted[] = $ids[ $key ];
			}
			$this->assertSame(
				$this->merge_adjacent_formats( $order['publishedHTML'] ),
				$this->merge_adjacent_formats( gutenberg_get_inline_suggestion_view( (string) $html, $accepted, $originals ) ),
				$order['label']
			);
			++$checked;
		}
		$this->assertGreaterThan( 0, $checked );
	}

	/**
	 * Joins a format split in two where a marker ended between its halves,
	 * which renders the same.
	 *
	 * @param string $html HTML.
	 * @return string HTML.
	 */
	private function merge_adjacent_formats( string $html ): string {
		return (string) preg_replace( '~</(strong|em)><\\1>~', '', $html );
	}

	/**
	 * @dataProvider data_fixtures
	 *
	 * @param array<string, mixed> $fixture Generated fixture data.
	 */
	public function test_save_pass_extracts_and_inflates_byte_for_byte( array $fixture ): void {
		$this->skip_unless_landed( $fixture );
		$seeded    = $this->seed( $fixture );
		$extracted = Gutenberg_Suggestion_Content::extract( $seeded['content'], $seeded['notes'], array(), $seeded['originals'] );

		$this->assertSame( $seeded['content'], Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] ) );

		// Every addition is left as an empty anchor: its text lives on its note.
		$this->assertDoesNotMatchRegularExpression( '~class="wp-suggestion-add">(?!</mark>)~', $extracted['content'] );
	}
}
