<?php
/**
 * Tests the save pass end to end: what a post write stores, what the notes
 * keep, how the pass fails closed, and what edit-context REST responses give
 * back.
 *
 * @group suggestions
 */
class Tests_Suggestion_Content_Save extends WP_UnitTestCase {

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
	private static $contributor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id      = $factory->user->create( array( 'role' => 'author' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
	}

	public function set_up() {
		parent::set_up();
		// Suggestion writes and the save pass need the experiment.
		add_filter(
			'pre_option_gutenberg-experiments',
			static function () {
				return array( 'gutenberg-suggestion-mode' => true );
			}
		);
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$editor_id );
	}

	/**
	 * Creates a suggestion note.
	 *
	 * @param int                              $post_id    Post ID.
	 * @param list<array<string, mixed>>|null $operations Payload operations, an inline addition by default.
	 * @param int                              $author     Note author, the author user by default.
	 * @return int Note ID.
	 */
	private function create_note( int $post_id, ?array $operations = null, int $author = 0 ): int {
		$note_id    = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => $author ? $author : self::$author_id,
			)
		);
		$operations = $operations ? $operations : array(
			array(
				'type'           => 'inline-suggestion',
				'attribute'      => 'content',
				'suggestionType' => 'add',
			),
		);
		$this->assertIsInt( $note_id );
		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( (string) wp_json_encode( array( 'operations' => $operations ) ) ) );
		return $note_id;
	}

	private function mark( int $note_id, string $kind, string $text ): string {
		return '<mark data-suggestion-id="' . $note_id . '" data-suggestion-type="' . $kind . '" data-author="' . self::$author_id . '" class="wp-suggestion-' . $kind . '">' . $text . '</mark>';
	}

	private function paragraph( string $html ): string {
		return "<!-- wp:paragraph -->\n<p>{$html}</p>\n<!-- /wp:paragraph -->";
	}

	private function inserted( int $note_id, string $text ): string {
		return '<!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-insert","authorId":' . self::$author_id . ',"commentId":' . $note_id . '},"noteId":[' . $note_id . "]}} -->\n<p>{$text}</p>\n<!-- /wp:paragraph -->";
	}

	private function heading( int $note_id ): string {
		return '<!-- wp:heading {"metadata":{"suggestion":{"type":"pending-attributes","authorId":' . self::$author_id . ',"after":{"level":3},"commentId":' . $note_id . '},"noteId":[' . $note_id . "]}} -->\n<h2 class=\"wp-block-heading\">My Heading</h2>\n<!-- /wp:heading -->";
	}

	private function create_post( string $content = '', int $author = 0 ): int {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => $content,
				'post_author'  => $author ? $author : self::$editor_id,
				'post_status'  => 'publish',
			)
		);
		$this->assertIsInt( $post_id );
		return $post_id;
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

	private function stored( int $post_id ): string {
		/** @var wpdb $wpdb */
		global $wpdb;
		return (string) $wpdb->get_var( $wpdb->prepare( 'SELECT post_content FROM %i WHERE ID = %d', $wpdb->posts, $post_id ) );
	}

	private function edit_view( int $post_id, string $context = 'edit' ): ?string {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$request->set_param( 'context', $context );
		$data    = rest_get_server()->dispatch( $request )->get_data();
		$content = is_array( $data ) && isset( $data['content'] ) && is_array( $data['content'] ) ? $data['content'] : array();
		return isset( $content['raw'] ) && is_string( $content['raw'] ) ? $content['raw'] : null;
	}

	/**
	 * The proposals a note stores.
	 *
	 * @param int $note_id Note ID.
	 * @return array<array<mixed>> Items.
	 */
	private function items_of( int $note_id ): array {
		return Gutenberg_Suggestion_Content::decode( get_comment_meta( $note_id, '_wp_suggestion_content', true ) );
	}

	/**
	 * The post's latest revision, saved explicitly when an earlier test's
	 * autosave request defined `DOING_AUTOSAVE`, which stops
	 * `wp_save_post_revision()` for the rest of the run.
	 *
	 * @param int $post_id Post ID.
	 * @return WP_Post Revision.
	 */
	private function latest_revision( $post_id ) {
		$revision = current( wp_get_post_revisions( $post_id ) );
		if ( ! $revision ) {
			$revision = get_post( _wp_put_post_revision( $post_id ) );
		}
		return $revision;
	}

	/**
	 * A post with an addition, a suggested block and a proposed heading level,
	 * saved.
	 *
	 * @return array{0: int, 1: string, 2: array{int, int, int}} Post id, editor content, note ids.
	 */
	private function suggested_post(): array {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$add     = $this->create_note( $post_id );
		$insert  = $this->create_note( $post_id, array( array( 'type' => 'block-insert-after' ) ) );
		$level   = $this->create_note( $post_id, array( array( 'type' => 'block-attributes' ) ) );
		$content = $this->paragraph( 'Hello' . $this->mark( $add, 'add', ' zanzibarian' ) ) . "\n\n" . $this->inserted( $insert, 'Quixotic paragraph' ) . "\n\n" . $this->heading( $level );
		$this->save( $post_id, $content );
		return array( $post_id, $content, array( $add, $insert, $level ) );
	}

	public function test_save_stores_baseline_and_anchors_only() {
		list( $post_id, , $notes ) = $this->suggested_post();

		$stored = $this->stored( $post_id );
		$this->assertStringContainsString( 'Hello', $stored );
		$this->assertStringNotContainsString( 'zanzibarian', $stored );
		$this->assertStringNotContainsString( 'Quixotic', $stored );
		$this->assertStringNotContainsString( '"after"', $stored );
		$this->assertStringContainsString( 'data-suggestion-run="0"', $stored );
		$this->assertStringContainsString( '<!-- wp:suggestion-placeholder {"id":' . $notes[1], $stored );

		$this->assertCount( 1, $this->items_of( $notes[0] ) );
		$this->assertSame( 'block', $this->items_of( $notes[1] )[0]['kind'] );
		$this->assertSame( 'after', $this->items_of( $notes[2] )[0]['kind'] );
	}

	public function test_public_readers_see_the_baseline() {
		list( $post_id ) = $this->suggested_post();

		$post = get_post( $post_id );
		$this->assertStringNotContainsString( 'zanzibarian', $post->post_content );
		$this->assertStringNotContainsString( 'zanzibarian', apply_filters( 'the_content', $post->post_content ) );
		$this->assertStringNotContainsString( 'Quixotic', apply_filters( 'the_content', $post->post_content ) );
		$this->assertStringNotContainsString( 'Quixotic', get_the_excerpt( $post ) );

		$search = new WP_Query(
			array(
				's'      => 'zanzibarian',
				'fields' => 'ids',
			)
		);
		$this->assertSame( array(), $search->posts );
		$search = new WP_Query(
			array(
				's'      => 'Quixotic',
				'fields' => 'ids',
			)
		);
		$this->assertSame( array(), $search->posts );
	}

	public function test_edit_context_gives_editors_what_they_saved() {
		list( $post_id, $content ) = $this->suggested_post();

		$this->assertSame( $content, $this->edit_view( $post_id ) );
	}

	public function test_view_context_and_users_who_cannot_read_suggestions_get_anchors() {
		list( $post_id ) = $this->suggested_post();

		$this->assertNull( $this->edit_view( $post_id, 'view' ) );

		add_filter( 'gutenberg_can_read_suggestions', '__return_false' );
		$this->assertSame( $this->stored( $post_id ), $this->edit_view( $post_id ) );
		remove_filter( 'gutenberg_can_read_suggestions', '__return_false' );

		wp_set_current_user( self::$author_id );
		$this->assertNull( $this->edit_view( $post_id ), 'An author cannot open an administrator\'s post in edit context.' );
	}

	public function test_rest_save_response_equals_what_was_sent() {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$note_id = $this->create_note( $post_id );
		$content = $this->paragraph( 'Hello' . $this->mark( $note_id, 'add', ' rest' ) ) . "\n\n" . $this->inserted( $note_id, 'Rested' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . $post_id );
		$request->set_body_params( array( 'content' => $content ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $content, $response->get_data()['content']['raw'] );
		$this->assertStringNotContainsString( 'Rested', $this->stored( $post_id ) );
	}

	public function test_preloaded_edit_request_is_inflated() {
		list( $post_id, $content ) = $this->suggested_post();

		$preload = rest_preload_api_request( array(), '/wp/v2/posts/' . $post_id . '?context=edit' );

		$this->assertSame( $content, $preload[ '/wp/v2/posts/' . $post_id . '?context=edit' ]['body']['content']['raw'] );
	}

	public function test_saving_the_stored_content_back_keeps_every_proposal() {
		list( $post_id, $content, $notes ) = $this->suggested_post();
		$stored                            = $this->stored( $post_id );
		$items                             = array_map( array( $this, 'items_of' ), $notes );

		// A plugin, the classic editor or WP-CLI writing `post_content` back.
		$this->save( $post_id, get_post( $post_id )->post_content );

		$this->assertSame( $stored, $this->stored( $post_id ) );
		$this->assertSame( $items, array_map( array( $this, 'items_of' ), $notes ) );
		$this->assertSame( $content, $this->edit_view( $post_id ) );
		foreach ( $notes as $note_id ) {
			$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
		}
	}

	public function test_a_nested_save_keeps_the_outer_writes_proposals() {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$note_id = $this->create_note( $post_id );
		$content = $this->paragraph( 'Hello' . $this->mark( $note_id, 'add', ' nested' ) );

		$nested = static function ( $id ) use ( $post_id, &$nested ) {
			if ( $id !== $post_id ) {
				return;
			}
			remove_action( 'save_post', $nested );
			wp_update_post(
				array(
					'ID'           => $post_id,
					'post_content' => wp_slash( get_post( $post_id )->post_content ),
				)
			);
		};
		add_action( 'save_post', $nested );
		$this->save( $post_id, $content );

		$this->assertCount( 1, $this->items_of( $note_id ) );
		$this->assertSame( $content, $this->edit_view( $post_id ) );
	}

	public function test_an_anchor_with_nothing_stored_fails_closed() {
		list( $post_id, , $notes ) = $this->suggested_post();
		foreach ( $notes as $note_id ) {
			$this->assertIsInt( $note_id );
			gutenberg_delete_suggestion_server_meta( $note_id, '_wp_suggestion_content' );
		}

		$view = $this->edit_view( $post_id );

		$this->assertStringNotContainsString( 'data-suggestion-run', $view );
		$this->assertStringNotContainsString( 'suggestion-placeholder', $view );
		$this->assertStringContainsString( '<p>Hello</p>', $view );
	}

	public function test_a_changed_inline_anchor_fails_closed_and_a_changed_opener_keeps_its_proposal() {
		list( $post_id ) = $this->suggested_post();
		$stored          = $this->stored( $post_id );
		// Another writer changed the anchors' bytes.
		$changed = str_replace(
			array( 'class="wp-suggestion-add"></mark>', '{"metadata":{"suggestion":{"type":"pending-attributes"' ),
			array( 'class="wp-suggestion-add">typed</mark>', '{"level":2,"metadata":{"suggestion":{"type":"pending-attributes"' ),
			$stored
		);
		$this->save( $post_id, $changed );

		$view = $this->edit_view( $post_id );

		$this->assertStringNotContainsString( 'zanzibarian', $view );
		$this->assertStringNotContainsString( 'typed', $view );
		$this->assertStringContainsString( '"after":{"level":3}', $view );
		$this->assertStringContainsString( '"level":2', $view );
	}

	public function test_a_trashed_notes_proposal_is_kept_but_not_shown_until_restored() {
		list( $post_id, $content, $notes ) = $this->suggested_post();

		wp_trash_comment( $notes[0] );
		$this->assertStringNotContainsString( 'zanzibarian', $this->edit_view( $post_id ) );
		$this->save( $post_id, get_post( $post_id )->post_content );
		$this->assertCount( 1, $this->items_of( $notes[0] ), 'The trashed note keeps its proposal.' );

		wp_untrash_comment( $notes[0] );
		$this->assertSame( $content, $this->edit_view( $post_id ) );
	}

	public function test_a_spam_notes_proposal_is_not_shown() {
		list( $post_id, , $notes ) = $this->suggested_post();

		wp_spam_comment( $notes[0] );
		$this->assertStringNotContainsString( 'zanzibarian', $this->edit_view( $post_id ) );
	}

	public function test_a_note_trashed_with_its_post_is_not_shown_until_restored() {
		list( $post_id, $content ) = $this->suggested_post();

		// What trashing the post does to its notes.
		wp_trash_post_comments( $post_id );
		$this->assertStringNotContainsString( 'zanzibarian', $this->edit_view( $post_id ) );

		wp_untrash_post_comments( $post_id );
		$this->assertSame( $content, $this->edit_view( $post_id ) );
	}

	public function test_markers_for_other_notes_propose_nothing() {
		$post_id    = $this->create_post( $this->paragraph( 'Hello' ) );
		$other_post = $this->create_post();
		$foreign    = $this->create_note( $other_post );
		$plain_note = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);

		$this->save(
			$post_id,
			$this->paragraph( 'Hello' . $this->mark( $foreign, 'add', ' foreign' ) . $this->mark( $plain_note, 'add', ' plain' ) . $this->mark( 99999, 'del', ' kept' ) ) . "\n\n" . $this->inserted( $foreign, 'Smuggled' )
		);

		$stored = $this->stored( $post_id );
		$this->assertStringNotContainsString( 'foreign', $stored );
		$this->assertStringNotContainsString( 'plain', $stored );
		$this->assertStringNotContainsString( 'Smuggled', $stored );
		$this->assertStringContainsString( ' kept</mark>', $stored );
		$this->assertSame( '', get_comment_meta( $foreign, '_wp_suggestion_content', true ) );
	}

	/**
	 * A new post has no notes, so a copy of another post's editor content
	 * (a duplicated post, a pattern made from marked blocks) proposes nothing.
	 *
	 * @dataProvider data_copy_post_types
	 *
	 * @param string $post_type Post type of the copy.
	 */
	public function test_a_new_post_does_not_store_another_posts_proposals( string $post_type ): void {
		list( $post_id, $content ) = $this->suggested_post();
		$this->assertSame( $content, $this->edit_view( $post_id ) );

		$copy_id = wp_insert_post(
			array(
				'post_type'    => $post_type,
				'post_title'   => 'Copy',
				'post_status'  => 'draft',
				'post_content' => wp_slash( $content ),
			)
		);

		$stored = $this->stored( $copy_id );
		$this->assertStringNotContainsString( 'zanzibarian', $stored );
		$this->assertStringNotContainsString( 'Quixotic', $stored );
		$this->assertStringNotContainsString( '"after"', $stored );
		$this->assertStringContainsString( '<p>Hello</p>', $stored );
		$this->assertStringContainsString( 'My Heading', $stored );
	}

	/**
	 * @return array<string, array{string}>
	 */
	public function data_copy_post_types(): array {
		return array(
			'a duplicated post' => array( 'post' ),
			'a new pattern'     => array( 'wp_block' ),
		);
	}

	/**
	 * A post type without notes can never hold a suggestion, so nothing a
	 * write to it proposes is stored, linked to a note or not.
	 */
	public function test_an_update_of_a_post_type_without_notes_stores_no_proposals(): void {
		$pattern_id = wp_insert_post(
			array(
				'post_type'    => 'wp_block',
				'post_title'   => 'Pattern',
				'post_status'  => 'publish',
				'post_content' => wp_slash( $this->paragraph( 'Hello' ) ),
			)
		);
		$unlinked   = "<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"authorId\":1}}} -->\n<p>Unlinked block</p>\n<!-- /wp:paragraph -->";
		$content    = $this->paragraph( 'Hello' . $this->mark( 77, 'add', ' zanzibarian' ) . $this->mark( 78, 'del', ' kept' ) ) . "\n\n" . $this->inserted( 79, 'Quixotic paragraph' ) . "\n\n" . $unlinked;

		list( , $queries ) = $this->notes_loaded_by(
			function () use ( $pattern_id, $content ) {
				$this->save( $pattern_id, $content );
			}
		);

		$stored = $this->stored( $pattern_id );
		$this->assertStringNotContainsString( 'zanzibarian', $stored );
		$this->assertStringNotContainsString( 'Quixotic', $stored );
		$this->assertStringNotContainsString( 'Unlinked', $stored );
		$this->assertStringContainsString( ' kept</mark>', $stored );
		$this->assertSame( 0, $queries );
	}

	public function test_a_structural_marker_without_a_note_yet_is_left_in_place() {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$content = $this->paragraph( 'Hello' ) . "\n\n<!-- wp:paragraph {\"metadata\":{\"suggestion\":{\"type\":\"pending-insert\",\"authorId\":1}}} -->\n<p>Not yet linked</p>\n<!-- /wp:paragraph -->";

		$this->save( $post_id, $content );

		$this->assertSame( $content, $this->stored( $post_id ) );
	}

	public function test_kses_applies_to_a_proposal_as_it_does_to_content() {
		wp_set_current_user( self::$contributor_id );
		kses_init();
		$post_id = self::factory()->post->create(
			array(
				'post_author' => self::$contributor_id,
				'post_status' => 'draft',
			)
		);
		$note_id = $this->create_note( $post_id, null, self::$contributor_id );

		$this->save( $post_id, $this->paragraph( 'Hi' . $this->mark( $note_id, 'add', 'x<script>alert(1)</script>y' ) ) );

		$original = $this->items_of( $note_id )[0]['original'];
		$this->assertStringNotContainsString( '<script>', $original );
		$this->assertStringContainsString( 'x', $original );
		kses_remove_filters();
	}

	public function test_an_unfiltered_html_users_proposal_is_stored_exactly() {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$note_id = $this->create_note( $post_id );
		$marker  = $this->mark( $note_id, 'add', '<span onclick="x()" data-a="&quot;">exact</span>' );

		$this->save( $post_id, $this->paragraph( 'Hello' . $marker ) );

		$this->assertSame( $marker, $this->items_of( $note_id )[0]['original'] );
	}

	/**
	 * Replaces what a post's notes store with markup kses would not let
	 * their author publish, as a write that bypassed the save pass could.
	 *
	 * @param int[] $notes Note ids: an addition, a suggested block, an attribute proposal.
	 */
	private function forge_stored_proposals( array $notes ): void {
		$payload = '<img src="x" onerror="alert(1)"><script>alert(2)</script>';
		foreach ( $notes as $note_id ) {
			$items = $this->items_of( $note_id );
			foreach ( $items as $index => $item ) {
				$this->assertIsString( $item['original'] );
				if ( 'after' === $item['kind'] ) {
					$items[ $index ]['after']    = array( 'content' => $payload );
					$items[ $index ]['original'] = str_replace( '"after":{"level":3}', '"after":{"content":' . wp_json_encode( $payload ) . '}', $item['original'] );
				} else {
					$items[ $index ]['original'] = str_replace( array( ' zanzibarian', 'Quixotic paragraph' ), array( ' zanzibarian' . $payload, 'Quixotic paragraph' . $payload ), $item['original'] );
				}
			}
			gutenberg_update_suggestion_server_meta( $note_id, '_wp_suggestion_content', wp_slash( Gutenberg_Suggestion_Content::encode( $items ) ) );
		}
	}

	public function test_a_stored_proposal_is_inflated_as_what_its_author_may_publish(): void {
		list( $post_id, , $notes ) = $this->suggested_post();
		$this->forge_stored_proposals( $notes );

		$view = $this->edit_view( $post_id );
		$this->assertIsString( $view );

		$this->assertStringNotContainsString( 'onerror', $view );
		$this->assertStringNotContainsString( '<script', $view );
		$this->assertStringContainsString( ' zanzibarian', $view );
		$this->assertStringContainsString( 'Quixotic paragraph', $view );
		$this->assertStringContainsString( '"after":{"content":', $view );
	}

	public function test_a_stored_proposal_of_an_unfiltered_html_author_is_inflated_exactly(): void {
		list( $post_id, , $notes ) = $this->suggested_post();
		foreach ( $notes as $note_id ) {
			wp_update_comment(
				array(
					'comment_ID' => $note_id,
					'user_id'    => self::$editor_id,
				)
			);
		}
		$this->forge_stored_proposals( $notes );

		$view = $this->edit_view( $post_id );
		$this->assertIsString( $view );

		$this->assertStringContainsString( ' zanzibarian<img src="x" onerror="alert(1)"><script>alert(2)</script>', $view );
		$this->assertStringContainsString( 'Quixotic paragraph<img src="x" onerror="alert(1)"><script>alert(2)</script>', $view );
	}

	public function test_an_oversized_proposal_stays_in_the_content_and_is_flagged() {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$big     = $this->create_note( $post_id );
		$small   = $this->create_note( $post_id );
		$huge    = str_repeat( 'lorem ', (int) ( GUTENBERG_SUGGESTION_CONTENT_MAX_BYTES / 5 ) );
		$content = $this->paragraph( 'Hello' . $this->mark( $big, 'add', $huge ) . $this->mark( $small, 'add', ' small' ) );

		$this->save( $post_id, $content );

		$stored = $this->stored( $post_id );
		$this->assertStringContainsString( $huge, $stored );
		$this->assertStringNotContainsString( ' small', $stored );
		$this->assertTrue( (bool) get_comment_meta( $big, '_wp_suggestion_extraction_skipped', true ) );
		$this->assertSame( '', get_comment_meta( $small, '_wp_suggestion_extraction_skipped', true ) );
		$this->assertStringNotContainsString( 'lorem', apply_filters( 'the_content', $stored ) );
	}

	/**
	 * Runs a callback and returns the ids of the notes its comment queries
	 * loaded, and how many comment queries it ran.
	 *
	 * @param callable $callback Callback.
	 * @return array{0: int[], 1: int} Loaded note ids, query count.
	 */
	private function notes_loaded_by( callable $callback ): array {
		$loaded  = array();
		$queries = 0;
		$count   = static function () use ( &$queries ): void {
			++$queries;
		};
		$record  = static function ( $comments ) use ( &$loaded ) {
			foreach ( is_array( $comments ) ? $comments : array() as $comment ) {
				if ( $comment instanceof WP_Comment ) {
					$loaded[] = (int) $comment->comment_ID;
				} elseif ( is_numeric( $comment ) ) {
					$loaded[] = (int) $comment;
				}
			}
			return $comments;
		};
		add_action( 'pre_get_comments', $count );
		add_filter( 'the_comments', $record );
		$callback();
		remove_filter( 'the_comments', $record );
		remove_action( 'pre_get_comments', $count );
		return array( array_values( array_unique( $loaded ) ), $queries );
	}

	public function test_a_save_loads_only_the_notes_its_content_names(): void {
		list( $post_id, $content, $notes ) = $this->suggested_post();
		$decided                           = $this->create_note( $post_id );
		gutenberg_update_suggestion_server_meta( $decided, '_wp_suggestion_status', 'applied' );
		wp_set_comment_status( $decided, 'approve' );

		list( $loaded ) = $this->notes_loaded_by(
			function () use ( $post_id, $content ) {
				$this->save( $post_id, $content . "\n\n" . $this->paragraph( 'More' ) );
			}
		);

		$this->assertNotContains( $decided, $loaded );
		$this->assertEqualSets( $notes, $loaded );
		$this->assertSame( $content . "\n\n" . $this->paragraph( 'More' ), $this->edit_view( $post_id ) );
	}

	public function test_an_edit_context_response_loads_only_the_notes_its_content_names(): void {
		list( $post_id, $content, $notes ) = $this->suggested_post();
		$decided                           = $this->create_note( $post_id );
		gutenberg_update_suggestion_server_meta( $decided, '_wp_suggestion_status', 'applied' );

		list( $loaded ) = $this->notes_loaded_by(
			function () use ( $post_id, $content ) {
				$this->assertSame( $content, $this->edit_view( $post_id ) );
			}
		);

		$this->assertEqualSets( $notes, $loaded );
	}

	public function test_a_save_of_a_post_without_suggestions_asks_for_its_notes_once(): void {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );

		list( , $queries ) = $this->notes_loaded_by(
			function () use ( $post_id ) {
				$this->save( $post_id, $this->paragraph( 'Hello again' ) );
			}
		);

		$this->assertSame( 1, $queries );
	}

	public function test_a_new_post_asks_for_no_notes(): void {
		list( , $queries ) = $this->notes_loaded_by(
			function () {
				$this->create_post( $this->paragraph( 'Hello' ) );
			}
		);

		$this->assertSame( 0, $queries );
	}

	public function test_a_post_field_decision_made_after_a_save_still_finalizes(): void {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$this->save( $post_id, $this->paragraph( 'Hello again' ) );
		$note_id = $this->create_note(
			$post_id,
			array(
				array(
					'type'      => 'post-attribute-set',
					'attribute' => 'title',
					'before'    => 'Old',
					'after'     => 'New title',
				),
			)
		);
		update_comment_meta( $note_id, '_wp_suggestion_status', 'applied-unsaved' );

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'New title',
			)
		);

		$this->assertSame( 'applied', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
	}

	public function test_accepting_and_saving_drops_the_stored_proposal() {
		list( $post_id, , $notes ) = $this->suggested_post();
		update_comment_meta( $notes[0], '_wp_suggestion_status', 'applied-unsaved' );

		$this->save( $post_id, $this->paragraph( 'Hello zanzibarian' ) . "\n\n" . $this->inserted( $notes[1], 'Quixotic paragraph' ) . "\n\n" . $this->heading( $notes[2] ) );

		$this->assertSame( 'applied', get_comment_meta( $notes[0], '_wp_suggestion_status', true ) );
		$this->assertSame( '', get_comment_meta( $notes[0], '_wp_suggestion_content', true ) );
		$this->assertStringContainsString( 'Hello zanzibarian', $this->stored( $post_id ) );
	}

	public function test_a_suggestion_inside_another_suggested_block_is_not_outdated() {
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$outer   = $this->create_note( $post_id, array( array( 'type' => 'block-insert-after' ) ) );
		$inner   = $this->create_note( $post_id, null, self::$author_id );
		$this->save( $post_id, $this->paragraph( 'Hello' ) . "\n\n" . $this->inserted( $outer, 'Block ' . $this->mark( $inner, 'add', 'inner' ) ) );

		// A plugin re-saves the stored content.
		$this->save( $post_id, get_post( $post_id )->post_content );

		$this->assertSame( '', get_comment_meta( $inner, '_wp_suggestion_status', true ) );
		$this->assertSame( '0', get_comment( $inner )->comment_approved );
	}

	public function test_revisions_snapshot_their_proposals_and_inflate_from_them() {
		list( $post_id, $content, $notes ) = $this->suggested_post();
		$revision                          = $this->latest_revision( $post_id );

		$this->assertStringNotContainsString( 'zanzibarian', $revision->post_content );
		$this->assertNotEmpty( get_metadata( 'post', $revision->ID, '_wp_suggestion_snapshot', true ) );
		$this->assertSame( '', get_post_meta( $post_id, '_wp_suggestion_snapshot', true ) );

		// The notes move on; the revision still shows what it held.
		$this->save( $post_id, $this->paragraph( 'Hello' . $this->mark( $notes[0], 'add', ' changed' ) ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id . '/revisions/' . $revision->ID );
		$request->set_param( 'context', 'edit' );
		$this->assertSame( $content, rest_get_server()->dispatch( $request )->get_data()['content']['raw'] );
	}

	public function test_restoring_a_revision_reseeds_its_proposals() {
		list( $post_id, $content, $notes ) = $this->suggested_post();
		$revision                          = $this->latest_revision( $post_id );
		$this->save( $post_id, $this->paragraph( 'Rewritten' ) );
		$this->assertSame( array(), $this->items_of( $notes[1] ) );

		wp_restore_post_revision( $revision->ID );
		clean_post_cache( $post_id );

		$this->assertSame( $content, $this->edit_view( $post_id ) );
	}

	public function test_an_autosave_revision_is_extracted_onto_the_autosave() {
		list( $post_id, , $notes ) = $this->suggested_post();
		$items                     = $this->items_of( $notes[0] );

		// A published post autosaves to a revision, never to the post.
		$autosaved = $this->paragraph( 'Hello' . $this->mark( $notes[0], 'add', ' drafted' ) );
		$request   = new WP_REST_Request( 'POST', '/wp/v2/posts/' . $post_id . '/autosaves' );
		$request->set_body_params( array( 'content' => $autosaved ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $autosaved, $response->get_data()['content']['raw'] );
		$autosave = wp_get_post_autosave( $post_id, self::$editor_id );
		$this->assertStringNotContainsString( 'drafted', $autosave->post_content );
		$this->assertNotEmpty( get_metadata( 'post', $autosave->ID, '_wp_suggestion_snapshot', true ) );
		// The post's own proposals are untouched.
		$this->assertSame( $items, $this->items_of( $notes[0] ) );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id . '/autosaves/' . $autosave->ID );
		$request->set_param( 'context', 'edit' );
		$this->assertSame( $autosaved, rest_get_server()->dispatch( $request )->get_data()['content']['raw'] );
	}

	/**
	 * Post fields REST writes after the post row: a decision on them is only
	 * saved once `wp_after_insert_post` runs.
	 *
	 * @dataProvider data_post_fields_written_after_the_row
	 *
	 * @param string $field Field.
	 */
	public function test_post_field_accept_finalizes_after_terms_meta_and_featured_image_are_written( $field ) {
		$post_id = $this->create_post( $this->paragraph( 'Body' ) );
		register_post_meta(
			'post',
			'suggested_subtitle',
			array(
				'show_in_rest' => true,
				'single'       => true,
				'type'         => 'string',
			)
		);
		$attachment = self::factory()->attachment->create_object( 'image.jpg', $post_id, array( 'post_mime_type' => 'image/jpeg' ) );
		$category   = self::factory()->category->create();
		$operations = array(
			'featured_media' => array(
				'attribute' => 'featured_media',
				'after'     => $attachment,
			),
			'categories'     => array(
				'attribute' => 'categories',
				'after'     => array( $category ),
			),
			'meta'           => array(
				'attribute' => 'meta',
				'key'       => 'suggested_subtitle',
				'after'     => 'Proposed subtitle',
			),
		);
		$body       = array(
			'featured_media' => array( 'featured_media' => $attachment ),
			'categories'     => array( 'categories' => array( $category ) ),
			'meta'           => array( 'meta' => array( 'suggested_subtitle' => 'Proposed subtitle' ) ),
		);
		$note_id    = $this->create_note( $post_id, array( array( 'type' => 'post-attribute-set' ) + $operations[ $field ] ) );
		update_comment_meta( $note_id, '_wp_suggestion_status', 'applied-unsaved' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . $post_id );
		$request->set_body_params( array( 'title' => 'Unrelated' ) );
		rest_get_server()->dispatch( $request );
		$this->assertSame( 'applied-unsaved', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts/' . $post_id );
		$request->set_body_params( $body[ $field ] );
		$this->assertSame( 200, rest_get_server()->dispatch( $request )->get_status() );
		$this->assertSame( 'applied', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
		unregister_post_meta( 'post', 'suggested_subtitle' );
	}

	public function data_post_fields_written_after_the_row() {
		return array(
			'featured image' => array( 'featured_media' ),
			'terms'          => array( 'categories' ),
			'meta'           => array( 'meta' ),
		);
	}

	public function test_the_stored_proposals_are_not_exposed_over_rest() {
		list( , , $notes ) = $this->suggested_post();

		$request = new WP_REST_Request( 'GET', '/wp/v2/comments/' . $notes[0] );
		$request->set_param( 'context', 'edit' );
		$data = rest_get_server()->dispatch( $request )->get_data();

		$this->assertArrayNotHasKey( '_wp_suggestion_content', $data['meta'] );
	}

	public function test_the_stored_proposals_are_left_out_of_exports() {
		$this->assertTrue( apply_filters( 'wxr_export_skip_commentmeta', false, '_wp_suggestion_content', null ) );
		$this->assertTrue( apply_filters( 'wxr_export_skip_postmeta', false, '_wp_suggestion_snapshot', null ) );
		$this->assertFalse( apply_filters( 'wxr_export_skip_commentmeta', false, '_wp_suggestion', null ) );
	}
}
