<?php
/**
 * Tests for the Suggestion mode save pass: provisional decisions become final
 * only through a post save that no longer carries their anchor, another
 * author's orphaned suggestion becomes `outdated`, and REST clients cannot
 * write a final status.
 *
 * @group suggestions
 */
class Tests_Suggestion_Reconciliation extends WP_UnitTestCase {

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
	private static $other_editor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_id       = $factory->user->create( array( 'role' => 'editor' ) );
		self::$other_editor_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();
		// The test case unregisters every meta key after each test.
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$editor_id );
	}

	/**
	 * Creates a root suggestion note.
	 *
	 * @param int    $post_id    Post ID.
	 * @param array  $operations Payload operations.
	 * @param string $status     `_wp_suggestion_status`, or '' for none.
	 * @param int    $author     Note author.
	 * @return int Note ID.
	 */
	private function create_note( $post_id, $operations, $status = '', $author = 0 ) {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'comment_parent'   => 0,
				'user_id'          => $author ? $author : self::$author_id,
			)
		);
		update_comment_meta( $note_id, '_wp_suggestion', wp_json_encode( array( 'operations' => $operations ) ) );
		if ( '' !== $status ) {
			update_comment_meta( $note_id, '_wp_suggestion_status', $status );
		}
		return $note_id;
	}

	private function inline_op() {
		return array(
			array(
				'type'           => 'inline-suggestion',
				'attribute'      => 'content',
				'suggestionType' => 'add',
			),
		);
	}

	private function paragraph( $html ) {
		return "<!-- wp:paragraph -->\n<p>{$html}</p>\n<!-- /wp:paragraph -->";
	}

	private function mark( $note_id, $type, $text, $author = 0 ) {
		$author = $author ? $author : self::$author_id;
		return '<mark class="wp-suggestion" data-suggestion-id="' . $note_id . '" data-suggestion-type="' . $type . '" data-author="' . $author . '">' . $text . '</mark>';
	}

	private function create_post( $content = '' ) {
		return self::factory()->post->create(
			array(
				'post_content' => $content,
				'post_author'  => self::$editor_id,
			)
		);
	}

	private function set_content( $post_id, $content ) {
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => $content,
			)
		);
	}

	private function status_of( $note_id ) {
		return get_comment_meta( $note_id, '_wp_suggestion_status', true );
	}

	private function comment_status_of( $note_id ) {
		clean_comment_cache( $note_id );
		return wp_get_comment_status( $note_id );
	}

	public function test_provisional_accept_finalizes_when_saved_without_its_anchor() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), 'applied-unsaved' );
		$this->set_content( $post_id, $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world' ) ) );

		$this->set_content( $post_id, $this->paragraph( 'Hello world' ) );

		$this->assertSame( 'applied', $this->status_of( $note_id ) );
		$this->assertSame( 'approved', $this->comment_status_of( $note_id ) );
		$this->assertSame( self::$editor_id, (int) get_comment_meta( $note_id, '_wp_suggestion_resolved_by', true ) );
	}

	public function test_provisional_reject_finalizes_when_saved_without_its_anchor() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), 'rejected-unsaved' );
		$this->set_content( $post_id, $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world' ) ) );

		$this->set_content( $post_id, $this->paragraph( 'Hello' ) );

		$this->assertSame( 'rejected', $this->status_of( $note_id ) );
		$this->assertSame( 'approved', $this->comment_status_of( $note_id ) );
	}

	public function test_provisional_decision_stays_while_the_anchor_is_saved() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), 'applied-unsaved' );
		$marked  = $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world' ) );
		$this->set_content( $post_id, $marked );

		$this->set_content( $post_id, $marked . "\n\n" . $this->paragraph( 'Another edit' ) );

		$this->assertSame( 'applied-unsaved', $this->status_of( $note_id ) );
		$this->assertSame( 'unapproved', $this->comment_status_of( $note_id ) );
	}

	public function test_a_save_by_another_user_finalizes_the_decision() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), 'applied-unsaved' );
		$this->set_content( $post_id, $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world' ) ) );

		wp_set_current_user( self::$other_editor_id );
		$this->set_content( $post_id, $this->paragraph( 'Hello world' ) );

		$this->assertSame( 'applied', $this->status_of( $note_id ) );
		$this->assertSame( self::$other_editor_id, (int) get_comment_meta( $note_id, '_wp_suggestion_resolved_by', true ) );
	}

	/**
	 * Structural and attribute anchors, as the editor serializes them.
	 *
	 * @return array[]
	 */
	public function data_structural_anchors() {
		return array(
			'pending-insert'     => array(
				array( array( 'type' => 'block-insert-after' ) ),
				'<!-- wp:paragraph {"metadata":{"noteId":%1$d,"suggestion":{"type":"pending-insert","commentId":%1$d}}} -->' . "\n<p>New</p>\n<!-- /wp:paragraph -->",
				"<!-- wp:paragraph -->\n<p>New</p>\n<!-- /wp:paragraph -->",
			),
			'pending-remove'     => array(
				array( array( 'type' => 'block-remove' ) ),
				'<!-- wp:paragraph {"metadata":{"noteId":%1$d,"suggestion":{"type":"pending-remove","commentId":%1$d}}} -->' . "\n<p>Old</p>\n<!-- /wp:paragraph -->",
				'',
			),
			'pending-move'       => array(
				array( array( 'type' => 'block-move' ) ),
				'<!-- wp:paragraph {"metadata":{"noteId":[%1$d],"suggestion":{"type":"pending-move","fromIndex":0}}} -->' . "\n<p>Moved</p>\n<!-- /wp:paragraph -->",
				"<!-- wp:paragraph -->\n<p>Moved</p>\n<!-- /wp:paragraph -->",
			),
			// Accepting an attribute proposal clears the marker but can keep the note link.
			'pending-attributes' => array(
				array(
					array(
						'type'      => 'attribute-set',
						'attribute' => 'level',
						'after'     => 3,
					),
				),
				'<!-- wp:heading {"metadata":{"noteId":%1$d,"suggestion":{"type":"pending-attributes","commentId":%1$d,"after":{"level":3}}}} -->' . "\n<h2 class=\"wp-block-heading\">Title</h2>\n<!-- /wp:heading -->",
				'<!-- wp:heading {"level":3,"metadata":{"noteId":%1$d}} -->' . "\n<h3 class=\"wp-block-heading\">Title</h3>\n<!-- /wp:heading -->",
			),
		);
	}

	/**
	 * @dataProvider data_structural_anchors
	 */
	public function test_structural_decisions_finalize_only_without_their_anchor( $operations, $with_anchor, $without_anchor ) {
		foreach ( array(
			'applied-unsaved'  => 'applied',
			'rejected-unsaved' => 'rejected',
		) as $provisional => $final ) {
			$post_id = $this->create_post( '' );
			$note_id = $this->create_note( $post_id, $operations, $provisional );
			$marked  = sprintf( $with_anchor, $note_id );
			$this->set_content( $post_id, $marked );

			$this->set_content( $post_id, $marked . "\n\n" . $this->paragraph( 'Unrelated' ) );
			$this->assertSame( $provisional, $this->status_of( $note_id ), 'Anchor still saved.' );

			$this->set_content( $post_id, sprintf( $without_anchor, $note_id ) );
			$this->assertSame( $final, $this->status_of( $note_id ), 'Anchor gone.' );
		}
	}

	public function test_attribute_proposal_on_a_move_marker_counts_as_its_own_anchor() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note(
			$post_id,
			array(
				array(
					'type'      => 'attribute-set',
					'attribute' => 'level',
					'after'     => 3,
				),
			),
			'applied-unsaved'
		);
		$this->set_content( $post_id, '<!-- wp:heading {"metadata":{"noteId":' . $note_id . ',"suggestion":{"type":"pending-move","fromIndex":1,"after":{"level":3}}}} -->' . "\n<h2 class=\"wp-block-heading\">T</h2>\n<!-- /wp:heading -->" );

		// The move stays pending; the attribute proposal is gone.
		$this->set_content( $post_id, '<!-- wp:heading {"level":3,"metadata":{"noteId":' . $note_id . ',"suggestion":{"type":"pending-move","fromIndex":1}}} -->' . "\n<h3 class=\"wp-block-heading\">T</h3>\n<!-- /wp:heading -->" );

		$this->assertSame( 'applied', $this->status_of( $note_id ) );
	}

	public function test_post_title_accept_finalizes_once_the_title_is_saved() {
		$post_id = $this->create_post( $this->paragraph( 'Body' ) );
		$note_id = $this->create_note(
			$post_id,
			array(
				array(
					'type'      => 'post-attribute-set',
					'attribute' => 'title',
					'after'     => 'Better title',
				),
			),
			'applied-unsaved'
		);

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Something else',
			)
		);
		$this->assertSame( 'applied-unsaved', $this->status_of( $note_id ) );

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Better title',
			)
		);
		$this->assertSame( 'applied', $this->status_of( $note_id ) );
	}

	public function test_post_title_reject_finalizes_on_the_next_post_write() {
		$post_id = $this->create_post( $this->paragraph( 'Body' ) );
		$note_id = $this->create_note(
			$post_id,
			array(
				array(
					'type'      => 'post-attribute-set',
					'attribute' => 'title',
					'after'     => 'Better title',
				),
			),
			'rejected-unsaved'
		);

		$this->set_content( $post_id, $this->paragraph( 'Body' ) );

		$this->assertSame( 'rejected', $this->status_of( $note_id ) );
	}

	public function test_another_authors_pending_note_becomes_outdated_when_a_save_removes_its_anchor() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op() );
		$this->set_content( $post_id, $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world' ) ) );

		$this->set_content( $post_id, $this->paragraph( 'Something else' ) );

		$this->assertSame( 'outdated', $this->status_of( $note_id ) );
		$this->assertSame( 'approved', $this->comment_status_of( $note_id ) );
		$this->assertNotNull( get_comment( $note_id ), 'Never trashed.' );
		$this->assertSame( self::$editor_id, (int) get_comment_meta( $note_id, '_wp_suggestion_resolved_by', true ) );
	}

	public function test_the_savers_own_pending_note_is_left_to_the_editor() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), 'pending', self::$editor_id );
		$this->set_content( $post_id, $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world', self::$editor_id ) ) );

		$this->set_content( $post_id, $this->paragraph( 'Hello' ) );

		$this->assertSame( 'pending', $this->status_of( $note_id ) );
		$this->assertSame( 'unapproved', $this->comment_status_of( $note_id ) );
	}

	public function test_a_write_without_a_user_outdates_any_author() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), '', self::$editor_id );
		$this->set_content( $post_id, $this->paragraph( 'Hello ' . $this->mark( $note_id, 'add', 'world', self::$editor_id ) ) );

		wp_set_current_user( 0 );
		$this->set_content( $post_id, $this->paragraph( 'Hello' ) );

		$this->assertSame( 'outdated', $this->status_of( $note_id ) );
	}

	public function test_a_note_whose_anchor_was_never_saved_is_not_outdated() {
		// The suggester's note exists, but the post holding its marker was never saved.
		$post_id = $this->create_post( $this->paragraph( 'Hello' ) );
		$note_id = $this->create_note( $post_id, $this->inline_op() );

		$this->set_content( $post_id, $this->paragraph( 'Hello there' ) );

		$this->assertSame( '', $this->status_of( $note_id ) );
		$this->assertSame( 'unapproved', $this->comment_status_of( $note_id ) );
	}

	public function test_a_marker_nested_in_another_suggestion_counts_as_present() {
		$post_id = $this->create_post( '' );
		$outer   = $this->create_note( $post_id, array( array( 'type' => 'block-insert-after' ) ) );
		$inner   = $this->create_note( $post_id, $this->inline_op() );
		$block   = '<!-- wp:paragraph {"metadata":{"noteId":%d,"suggestion":{"type":"pending-insert"}}} -->' . "\n<p>New %s</p>\n<!-- /wp:paragraph -->";
		$this->set_content( $post_id, sprintf( $block, $outer, $this->mark( $inner, 'add', 'text' ) ) );

		$this->set_content( $post_id, sprintf( $block, $outer, $this->mark( $inner, 'add', 'text!' ) ) );

		$this->assertSame( '', $this->status_of( $outer ) );
		$this->assertSame( '', $this->status_of( $inner ) );
	}

	public function test_rejecting_a_parent_addition_outdates_a_nested_child_suggestion() {
		$post_id = $this->create_post( '' );
		$parent  = $this->create_note( $post_id, $this->inline_op(), 'rejected-unsaved', self::$editor_id );
		$child   = $this->create_note( $post_id, $this->inline_op() );
		$nested  = '<mark class="wp-suggestion" data-suggestion-id="' . $parent . '" data-suggestion-type="add" data-author="' . self::$editor_id . '">new ' . $this->mark( $child, 'del', 'words' ) . '</mark>';
		$this->set_content( $post_id, $this->paragraph( 'Keep ' . $nested ) );

		$this->set_content( $post_id, $this->paragraph( 'Keep ' ) );

		$this->assertSame( 'rejected', $this->status_of( $parent ) );
		$this->assertSame( 'outdated', $this->status_of( $child ) );
	}

	public function test_an_autosave_revision_neither_finalizes_nor_outdates() {
		$post_id = $this->create_post( '' );
		$decided = $this->create_note( $post_id, $this->inline_op(), 'applied-unsaved' );
		$pending = $this->create_note( $post_id, $this->inline_op() );
		$this->set_content( $post_id, $this->paragraph( $this->mark( $decided, 'add', 'a' ) . $this->mark( $pending, 'add', 'b' ) ) );

		_wp_put_post_revision(
			array(
				'ID'           => $post_id,
				'post_title'   => 'Autosave',
				'post_content' => $this->paragraph( 'Nothing' ),
				'post_type'    => 'post',
				'post_author'  => self::$editor_id,
			),
			true
		);

		$this->assertSame( 'applied-unsaved', $this->status_of( $decided ) );
		$this->assertSame( '', $this->status_of( $pending ) );
	}

	public function test_a_nested_update_from_save_post_is_idempotent() {
		$post_id = $this->create_post( '' );
		$decided = $this->create_note( $post_id, $this->inline_op(), 'applied-unsaved' );
		$pending = $this->create_note( $post_id, $this->inline_op() );
		$this->set_content( $post_id, $this->paragraph( $this->mark( $decided, 'add', 'a' ) . $this->mark( $pending, 'add', 'b' ) ) );

		$nested = function ( $id ) use ( $post_id, &$nested ) {
			if ( $id !== $post_id ) {
				return;
			}
			remove_action( 'save_post', $nested );
			wp_update_post(
				array(
					'ID'           => $id,
					'post_content' => get_post( $id )->post_content . "\n\n<!-- wp:paragraph -->\n<p>Appended</p>\n<!-- /wp:paragraph -->",
				)
			);
		};
		add_action( 'save_post', $nested );
		$this->set_content( $post_id, $this->paragraph( 'Plain' ) );

		$this->assertSame( 'applied', $this->status_of( $decided ) );
		$this->assertSame( 'outdated', $this->status_of( $pending ) );
		$this->assertCount(
			0,
			get_comments(
				array(
					'parent' => $pending,
					'type'   => 'note',
					'status' => 'all',
				)
			),
			'No history child is added.'
		);
	}

	public function test_notes_on_other_posts_and_replies_are_ignored() {
		$post_id = $this->create_post( '' );
		$other   = $this->create_post( '' );
		$foreign = $this->create_note( $other, $this->inline_op(), 'applied-unsaved' );
		$root    = $this->create_note( $post_id, $this->inline_op() );
		$reply   = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'comment_parent'   => $root,
				'user_id'          => self::$author_id,
			)
		);
		update_comment_meta( $reply, '_wp_suggestion_status', 'applied-unsaved' );
		$this->set_content( $post_id, $this->paragraph( $this->mark( $foreign, 'add', 'x' ) . $this->mark( $root, 'add', 'y', self::$editor_id ) ) );

		$this->set_content( $post_id, $this->paragraph( 'Plain' ) );

		$this->assertSame( 'applied-unsaved', $this->status_of( $foreign ) );
		$this->assertSame( 'applied-unsaved', $this->status_of( $reply ) );
	}

	public function test_finalizing_sends_no_mail() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op(), 'applied-unsaved' );
		$other   = $this->create_note( $post_id, $this->inline_op() );
		$this->set_content( $post_id, $this->paragraph( $this->mark( $note_id, 'add', 'a' ) . $this->mark( $other, 'add', 'b' ) ) );

		$sent    = 0;
		$counter = function () use ( &$sent ) {
			++$sent;
			return true;
		};
		add_filter( 'pre_wp_mail', $counter );
		$this->set_content( $post_id, $this->paragraph( 'Plain' ) );
		remove_filter( 'pre_wp_mail', $counter );

		$this->assertSame( 'applied', $this->status_of( $note_id ) );
		$this->assertSame( 'outdated', $this->status_of( $other ) );
		$this->assertSame( 0, $sent );
	}

	public function test_anchor_index_reads_inline_and_structural_markers() {
		$content = $this->paragraph( $this->mark( 4, 'add', 'a' ) . '<mark class="has-inline-color">x</mark>' . $this->mark( 5, 'format', 'b' ) )
			. '<!-- wp:heading {"metadata":{"noteId":[6,7],"suggestion":{"type":"pending-move","commentId":8,"after":{"level":3}}}} --><h2>H</h2><!-- /wp:heading -->'
			. '<!-- wp:group --><div><!-- wp:paragraph {"metadata":{"suggestion":{"type":"pending-insert","commentId":9}}} --><p>N</p><!-- /wp:paragraph --></div><!-- /wp:group -->';

		$index = gutenberg_get_suggestion_anchor_index( $content );

		$this->assertSame( array( 'inline' => true ), $index[4] );
		$this->assertSame( array( 'inline' => true ), $index[5] );
		foreach ( array( 6, 7, 8 ) as $id ) {
			$this->assertSame(
				array(
					'pending-move'       => true,
					'pending-attributes' => true,
				),
				$index[ $id ]
			);
		}
		$this->assertSame( array( 'pending-insert' => true ), $index[9] );
		$this->assertCount( 6, $index );
	}

	/**
	 * Sends a REST update of a note's meta.
	 *
	 * @param int   $note_id Note ID.
	 * @param array $meta    Meta to write.
	 * @return WP_REST_Response
	 */
	private function rest_update_meta( $note_id, $meta ) {
		$request = new WP_REST_Request( 'PUT', '/wp/v2/comments/' . $note_id );
		$request->set_body_params( array( 'meta' => $meta ) );
		return rest_get_server()->dispatch( $request );
	}

	public function test_rest_accepts_provisional_statuses_and_stamps_the_decider() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op() );

		$response = $this->rest_update_meta( $note_id, array( '_wp_suggestion_status' => 'applied-unsaved' ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'applied-unsaved', $this->status_of( $note_id ) );
		$this->assertSame( self::$editor_id, (int) get_comment_meta( $note_id, '_wp_suggestion_decided_by', true ) );
		$this->assertSame( self::$editor_id, $response->get_data()['meta']['_wp_suggestion_decided_by'] );

		$response = $this->rest_update_meta( $note_id, array( '_wp_suggestion_status' => 'pending' ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion_decided_by', true ) );
	}

	/**
	 * @dataProvider data_final_statuses
	 */
	public function test_rest_refuses_a_final_status( $status ) {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op() );

		$response = $this->rest_update_meta( $note_id, array( '_wp_suggestion_status' => $status ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_suggestion_status_server_only', $response->get_data()['code'] );
		$this->assertSame( '', $this->status_of( $note_id ) );
	}

	public function data_final_statuses() {
		return array(
			'applied'  => array( 'applied' ),
			'rejected' => array( 'rejected' ),
			'outdated' => array( 'outdated' ),
		);
	}

	public function test_rest_refuses_a_final_status_on_create() {
		$post_id = $this->create_post( '' );
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments' );
		$request->set_body_params(
			array(
				'post'    => $post_id,
				'type'    => 'note',
				'content' => '',
				'status'  => 'hold',
				'meta'    => array(
					'_wp_suggestion'        => wp_json_encode( array( 'operations' => $this->inline_op() ) ),
					'_wp_suggestion_status' => 'applied',
				),
			)
		);

		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	public function test_rest_cannot_write_provenance() {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id, $this->inline_op() );

		$response = $this->rest_update_meta( $note_id, array( '_wp_suggestion_resolved_by' => 1 ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion_resolved_by', true ) );
	}
}
