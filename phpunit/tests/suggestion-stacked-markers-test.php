<?php
/**
 * Tests the server side of stacked inline suggestion markers: one `<mark>` per
 * suggestion, nested when suggestions overlap, including two of one kind on
 * the same text (an addition inside another author's addition, two deletions
 * of the same words).
 *
 * Fixtures are in the canonical order the editor writes: markers sort by kind
 * (`add`, `format`, `del`), then by id ascending, oldest outermost.
 *
 * @group suggestions
 */
class Tests_Suggestion_Stacked_Markers extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $editor_id;

	/**
	 * @var int
	 */
	private static $author_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		self::$editor_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	public function set_up(): void {
		parent::set_up();
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$editor_id );
	}

	private static function mark( int $id, string $kind, string $html ): string {
		return '<mark data-suggestion-id="' . $id . '" data-suggestion-type="' . $kind . '" data-author="1" class="wp-suggestion-' . $kind . '">' . $html . '</mark>';
	}

	/**
	 * "The fox." with A (12) adding " quick", B (15) adding " brown" inside
	 * A's addition, and C (17) deleting "quick brown" across both.
	 */
	private static function four_same_kind(): string {
		return '<p>The' . self::mark( 12, 'add', ' ' . self::mark( 17, 'del', 'quick' ) . self::mark( 15, 'add', self::mark( 17, 'del', ' brown' ) ) ) . ' fox.</p>';
	}

	/**
	 * "one two three" with A (12) deleting "two three" and B (15) deleting
	 * "one two".
	 */
	private static function two_deletions(): string {
		return '<p>' . self::mark( 15, 'del', 'one ' ) . self::mark( 12, 'del', self::mark( 15, 'del', 'two' ) . ' three' ) . '</p>';
	}

	/**
	 * @dataProvider data_render_strip
	 */
	public function test_render_strip_shows_every_suggestion_rejected( string $html, string $expected ): void {
		$this->assertSame( $expected, gutenberg_strip_inline_suggestion_markers( $html ) );
	}

	/**
	 * @return array<string, array{string, string}>
	 */
	public function data_render_strip(): array {
		return array(
			'an addition inside another addition' => array(
				'<p>a' . self::mark( 12, 'add', 'b' . self::mark( 15, 'add', 'c' ) . 'd' ) . 'e</p>',
				'<p>ae</p>',
			),
			'three nested additions'              => array(
				'<p>a' . self::mark( 12, 'add', 'b' . self::mark( 15, 'add', 'c' . self::mark( 17, 'add', 'd' ) ) ) . 'e</p>',
				'<p>ae</p>',
			),
			'two deletions of the same text'      => array(
				'<p>a' . self::mark( 12, 'del', self::mark( 15, 'del', 'b' ) ) . 'c</p>',
				'<p>abc</p>',
			),
			'two crossing deletions'              => array(
				self::two_deletions(),
				'<p>one two three</p>',
			),
			'an addition inside a deletion'       => array(
				'<p>' . self::mark( 12, 'del', 'a' ) . self::mark( 15, 'add', 'b' ) . self::mark( 12, 'del', 'c' ) . '</p>',
				'<p>ac</p>',
			),
			'deletions over nested additions'     => array(
				self::four_same_kind(),
				'<p>The fox.</p>',
			),
			'nested additions in a list item'     => array(
				'<ul><li>one' . self::mark( 12, 'add', ' two' . self::mark( 15, 'add', ' three' ) ) . '</li></ul>',
				'<ul><li>one</li></ul>',
			),
		);
	}

	/**
	 * @dataProvider data_views
	 *
	 * @param string $html     Content with stacked markers.
	 * @param int[]  $accepted Accepted suggestion ids.
	 * @param string $expected Published content.
	 */
	public function test_view_publishes_text_whose_additions_are_all_accepted_and_deletions_none( string $html, array $accepted, string $expected ): void {
		$this->assertSame( $expected, gutenberg_get_inline_suggestion_view( $html, $accepted ) );
	}

	/**
	 * @return array<string, array{string, int[], string}>
	 */
	public function data_views(): array {
		return array(
			'four: all rejected'           => array( self::four_same_kind(), array(), '<p>The fox.</p>' ),
			'four: all accepted'           => array( self::four_same_kind(), array( 12, 15, 17 ), '<p>The  fox.</p>' ),
			'four: inner accepted only'    => array( self::four_same_kind(), array( 15 ), '<p>The fox.</p>' ),
			'four: outer accepted only'    => array( self::four_same_kind(), array( 12 ), '<p>The quick fox.</p>' ),
			'four: both additions'         => array( self::four_same_kind(), array( 12, 15 ), '<p>The quick brown fox.</p>' ),
			'four: outer and the deletion' => array( self::four_same_kind(), array( 12, 17 ), '<p>The  fox.</p>' ),
			'four: deletion only'          => array( self::four_same_kind(), array( 17 ), '<p>The fox.</p>' ),
			'two deletions: none'          => array( self::two_deletions(), array(), '<p>one two three</p>' ),
			'two deletions: older'         => array( self::two_deletions(), array( 12 ), '<p>one </p>' ),
			'two deletions: newer'         => array( self::two_deletions(), array( 15 ), '<p> three</p>' ),
			'two deletions: both'          => array( self::two_deletions(), array( 12, 15 ), '<p></p>' ),
			'addition in a deletion'       => array(
				'<p>' . self::mark( 12, 'del', 'a' ) . self::mark( 15, 'add', 'b' ) . self::mark( 12, 'del', 'c' ) . '</p>',
				array( 12, 15 ),
				'<p>b</p>',
			),
			'unrelated marks are kept'     => array(
				'<p><mark class="wp-note" data-id="3">n</mark>' . self::mark( 12, 'add', 'x' ) . '</p>',
				array( 12 ),
				'<p><mark class="wp-note" data-id="3">n</mark>x</p>',
			),
		);
	}

	/**
	 * The render strip is the view with nothing accepted.
	 *
	 * @dataProvider data_render_strip
	 */
	public function test_view_with_nothing_accepted_matches_the_render_strip( string $html, string $expected ): void {
		$this->assertSame( $expected, gutenberg_get_inline_suggestion_view( $html, array() ) );
	}

	public function test_an_unbalanced_addition_fails_closed_in_every_view(): void {
		$html = '<p>a' . self::mark( 12, 'add', 'b' . '<mark data-suggestion-id="15" data-suggestion-type="add" class="wp-suggestion-add">c' ) . 'd</p>';

		$this->assertStringNotContainsString( 'c', gutenberg_get_inline_suggestion_view( $html, array( 12, 15 ) ) );
		$this->assertStringNotContainsString( 'wp-suggestion', gutenberg_get_inline_suggestion_view( $html, array( 12, 15 ) ) );
	}

	public function test_extraction_stores_a_nested_addition_on_the_outermost_note(): void {
		$content   = '<!-- wp:paragraph -->' . "\n" . '<p>a' . self::mark( 12, 'add', 'b' . self::mark( 15, 'add', 'c' ) . 'd' ) . "e</p>\n<!-- /wp:paragraph -->";
		$notes     = array(
			12 => true,
			15 => true,
		);
		$extracted = Gutenberg_Suggestion_Content::extract( $content, $notes );

		$this->assertSame( array( 12 ), array_keys( $extracted['items'] ) );
		$this->assertStringNotContainsString( 'data-suggestion-id="15"', $extracted['content'] );
		$this->assertSame( $content, Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] ) );

		$index = gutenberg_get_suggestion_anchor_index( Gutenberg_Suggestion_Content::inflate( $extracted['content'], $extracted['items'] ) );
		$this->assertArrayHasKey( 15, $index );
		$this->assertArrayHasKey( 12, $index );
	}

	public function test_a_nested_addition_under_an_unknown_note_goes_with_it(): void {
		$content   = '<p>a' . self::mark( 99, 'add', 'b' . self::mark( 15, 'add', 'c' ) ) . 'e</p>';
		$extracted = Gutenberg_Suggestion_Content::extract( $content, array( 15 => true ) );

		$this->assertSame( '<p>ae</p>', $extracted['content'] );
		$this->assertSame( array(), $extracted['items'] );
	}

	private function create_note( int $post_id ): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$author_id,
			)
		);
		update_comment_meta(
			$note_id,
			'_wp_suggestion',
			wp_slash(
				wp_json_encode(
					array(
						'operations' => array(
							array(
								'type'           => 'inline-suggestion',
								'attribute'      => 'content',
								'suggestionType' => 'add',
							),
						),
					)
				)
			)
		);
		return $note_id;
	}

	private function save( int $post_id, string $content ): void {
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => wp_slash( $content ),
			)
		);
		clean_post_cache( $post_id );
	}

	private function content_of( int $post_id ): string {
		$post = get_post( $post_id );
		$this->assertInstanceOf( WP_Post::class, $post );
		return $post->post_content;
	}

	private function edit_view( int $post_id ): string {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$request->set_param( 'context', 'edit' );
		$data = rest_get_server()->dispatch( $request )->get_data();
		$raw  = is_array( $data ) && isset( $data['content'] ) && is_array( $data['content'] ) ? ( $data['content']['raw'] ?? null ) : null;
		$this->assertIsString( $raw );
		return $raw;
	}

	private static function paragraph( string $html ): string {
		return "<!-- wp:paragraph -->\n<p>{$html}</p>\n<!-- /wp:paragraph -->";
	}

	/**
	 * A saved post with B's addition nested in A's.
	 *
	 * @return array{0: int, 1: string, 2: int, 3: int} Post id, editor content, outer and inner note ids.
	 */
	private function nested_post(): array {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => self::paragraph( 'Hello' ),
				'post_status'  => 'publish',
			)
		);
		$outer   = $this->create_note( $post_id );
		$inner   = $this->create_note( $post_id );
		$content = self::paragraph( 'Hello' . self::mark( $outer, 'add', ' zanzibarian' . self::mark( $inner, 'add', ' quokkaesque' ) ) );
		$this->save( $post_id, $content );
		return array( $post_id, $content, $outer, $inner );
	}

	public function test_a_nested_addition_is_kept_out_of_content_search_and_render(): void {
		list( $post_id, $content, $outer, $inner ) = $this->nested_post();

		$stored   = $this->content_of( $post_id );
		$rendered = apply_filters( 'the_content', $stored );
		$this->assertIsString( $rendered );
		$this->assertStringNotContainsString( 'quokkaesque', $stored );
		$this->assertStringNotContainsString( 'zanzibarian', $rendered );
		$this->assertStringNotContainsString( 'quokkaesque', $rendered );
		$search = new WP_Query(
			array(
				's'      => 'quokkaesque',
				'fields' => 'ids',
			)
		);
		$this->assertSame( array(), $search->posts );

		$this->assertNotSame( '', get_comment_meta( $outer, '_wp_suggestion_content', true ) );
		$this->assertSame( '', get_comment_meta( $inner, '_wp_suggestion_content', true ) );

		$this->assertSame( $content, $this->edit_view( $post_id ) );
	}

	public function test_a_nested_addition_survives_a_resave_of_the_stored_content(): void {
		list( $post_id, , , $inner ) = $this->nested_post();

		$this->save( $post_id, $this->content_of( $post_id ) );

		$this->assertSame( '', get_comment_meta( $inner, '_wp_suggestion_status', true ) );
	}

	public function test_accepting_the_outer_addition_moves_the_nested_one_to_its_own_note(): void {
		list( $post_id, , $outer, $inner ) = $this->nested_post();

		$this->save( $post_id, self::paragraph( 'Hello zanzibarian' . self::mark( $inner, 'add', ' quokkaesque' ) ) );

		$this->assertSame( '', get_comment_meta( $outer, '_wp_suggestion_content', true ) );
		$this->assertNotSame( '', get_comment_meta( $inner, '_wp_suggestion_content', true ) );
		$this->assertStringNotContainsString( 'quokkaesque', $this->content_of( $post_id ) );
		$this->assertSame( '', get_comment_meta( $inner, '_wp_suggestion_status', true ) );
	}

	public function test_rejecting_the_outer_addition_outdates_the_nested_one(): void {
		list( $post_id, , , $inner ) = $this->nested_post();

		$this->save( $post_id, self::paragraph( 'Hello' ) );

		$this->assertSame( 'outdated', get_comment_meta( $inner, '_wp_suggestion_status', true ) );
	}
}
