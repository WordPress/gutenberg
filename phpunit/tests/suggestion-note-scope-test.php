<?php
/**
 * Tests that Suggestion mode only reads and changes a suggestion note in the
 * scope it belongs to: a format marker resolves only against the note of the
 * post whose content holds it, and the save pass only acts for a user who
 * could change the notes directly.
 *
 * @group suggestions
 */
class Tests_Suggestion_Note_Scope extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $editor_id;

	/**
	 * @var int
	 */
	private static $author_id;

	/**
	 * @var int
	 */
	private static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$author_id     = $factory->user->create( array( 'role' => 'author' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public function set_up() {
		parent::set_up();
		// The test case unregisters every meta key after each test.
		gutenberg_register_suggestion_meta();
	}

	public function tear_down() {
		$GLOBALS['gutenberg_suggestion_content_owners'] = array();
		parent::tear_down();
	}

	/**
	 * Creates a pending format suggestion note.
	 *
	 * @param int    $post_id     Post the note belongs to.
	 * @param string $before_html Original run recorded on the note.
	 * @return int Note ID.
	 */
	private function create_format_note( $post_id, $before_html ) {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$editor_id,
			)
		);
		$payload = array(
			'operations' => array(
				array(
					'type'           => 'inline-suggestion',
					'attribute'      => 'content',
					'suggestionType' => 'format',
					'beforeHTML'     => $before_html,
				),
			),
		);
		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( wp_json_encode( $payload ) ) );
		return $note_id;
	}

	private function format_marker( $note_id, $inner ) {
		return '<mark class="wp-suggestion-format" data-suggestion-id="' . $note_id . '" data-suggestion-type="format">' . $inner . '</mark>';
	}

	private function paragraph( $html ) {
		return '<!-- wp:paragraph --><p>' . $html . '</p><!-- /wp:paragraph -->';
	}

	/**
	 * Stores post content without content filters, so markers survive.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $content Post content.
	 */
	private function set_post_content( $post_id, $content ) {
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $post_id ) );
		clean_post_cache( $post_id );
	}

	public function test_excerpt_of_another_post_does_not_resolve_the_outer_posts_note() {
		// A page with a pending format change whose original is not public:
		// its marker sits inside a pending addition, which never renders.
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$note_id = $this->create_format_note( $page_id, 'HIDDEN ORIGINAL' );
		$this->set_post_content(
			$page_id,
			$this->paragraph( '<mark class="wp-suggestion-add" data-suggestion-id="' . ( $note_id + 1000 ) . '" data-suggestion-type="add">' . $this->format_marker( $note_id, 'x' ) . '</mark>' )
		);

		// Another author's post copies the page's marker.
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_excerpt' => '',
			)
		);
		$this->set_post_content( $post_id, $this->paragraph( 'Copied ' . $this->format_marker( $note_id, 'run' ) ) );

		// The page's content lists that post's excerpt, as a Latest Posts or
		// Post Excerpt block does.
		$GLOBALS['post'] = get_post( $page_id );
		gutenberg_push_suggestion_content_owner( '' );
		$excerpt = get_the_excerpt( $post_id );
		gutenberg_pop_suggestion_content_owner( '' );

		$this->assertStringNotContainsString( 'HIDDEN ORIGINAL', $excerpt );
		$this->assertStringContainsString( 'Copied run', $excerpt );
	}

	public function test_excerpt_still_resolves_its_own_posts_note() {
		$post_id = self::factory()->post->create( array( 'post_excerpt' => '' ) );
		$note_id = $this->create_format_note( $post_id, 'original' );
		$this->set_post_content( $post_id, $this->paragraph( 'Hello ' . $this->format_marker( $note_id, 'proposed' ) ) );

		$page_id         = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$GLOBALS['post'] = get_post( $page_id );
		gutenberg_push_suggestion_content_owner( '' );
		$excerpt = get_the_excerpt( $post_id );
		gutenberg_pop_suggestion_content_owner( '' );

		$this->assertSame( 'Hello original', trim( $excerpt ) );
		$this->assertEmpty( $GLOBALS['gutenberg_suggestion_content_owners'], 'The owner stack is balanced.' );
	}

	/**
	 * Renders content as the given post's, in a preview request.
	 *
	 * @param int    $post_id Post being rendered.
	 * @param string $content Content to render.
	 * @return string Rendered content.
	 */
	private function render_preview( $post_id, $content ) {
		$GLOBALS['post']                 = get_post( $post_id );
		$GLOBALS['wp_query']->is_preview = true;
		$rendered                        = apply_filters( 'the_content', $content );
		$GLOBALS['wp_query']->is_preview = false;
		return $rendered;
	}

	/**
	 * Creates a post whose saved content has no marker for a note, while an
	 * editor's autosave of it does.
	 *
	 * @return int[] Post ID and note ID.
	 */
	private function create_post_with_marker_only_in_an_autosave() {
		$post_id = self::factory()->post->create( array( 'post_author' => self::$editor_id ) );
		$note_id = $this->create_format_note( $post_id, 'UNSAVED ORIGINAL' );
		$this->set_post_content( $post_id, $this->paragraph( 'Saved' ) );
		wp_set_current_user( self::$editor_id );
		_wp_put_post_revision(
			array(
				'ID'           => $post_id,
				'post_title'   => 'Autosave',
				'post_content' => $this->paragraph( 'Draft ' . $this->format_marker( $note_id, 'run' ) ),
				'post_type'    => 'post',
				'post_author'  => self::$editor_id,
			),
			true
		);
		return array( $post_id, $note_id );
	}

	public function test_a_logged_out_preview_does_not_read_any_users_autosave() {
		list( $post_id, $note_id ) = $this->create_post_with_marker_only_in_an_autosave();
		wp_set_current_user( 0 );

		$rendered = $this->render_preview( $post_id, $this->paragraph( 'Draft ' . $this->format_marker( $note_id, 'run' ) ) );

		$this->assertStringNotContainsString( 'UNSAVED ORIGINAL', $rendered );
		$this->assertStringContainsString( 'Draft run', $rendered );
	}

	public function test_an_editors_preview_reads_their_own_autosave() {
		list( $post_id, $note_id ) = $this->create_post_with_marker_only_in_an_autosave();
		wp_set_current_user( self::$editor_id );

		$rendered = $this->render_preview( $post_id, $this->paragraph( 'Draft ' . $this->format_marker( $note_id, 'run' ) ) );

		$this->assertStringContainsString( 'Draft UNSAVED ORIGINAL', $rendered );
	}
}
