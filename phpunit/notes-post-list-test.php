<?php
/**
 * Tests for the unseen notes indicator on the posts list screen.
 *
 * @package gutenberg
 */
class Tests_Notes_Post_List extends WP_UnitTestCase {

	/**
	 * The user looking at the posts list.
	 */
	private static int $viewer;

	/**
	 * A collaborator leaving notes.
	 */
	private static int $collaborator;

	/**
	 * Post the notes are attached to.
	 */
	private static int $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		self::$viewer       = $factory->user->create( array( 'role' => 'editor' ) );
		self::$collaborator = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id      = $factory->post->create( array( 'post_author' => self::$collaborator ) );

		require_once ABSPATH . 'wp-admin/includes/template.php';
		require_once ABSPATH . 'wp-admin/includes/post.php';
	}

	public function set_up(): void {
		parent::set_up();
		wp_set_current_user( self::$viewer );
	}

	/**
	 * Creates a note.
	 *
	 * @param array $args Comment arguments overriding the defaults.
	 * @return int Note ID.
	 */
	private function create_note( array $args = array() ): int {
		return self::factory()->comment->create(
			array_merge(
				array(
					'comment_post_ID'  => self::$post_id,
					'comment_type'     => 'note',
					'comment_approved' => '0',
					'user_id'          => self::$collaborator,
					'comment_date_gmt' => '2026-10-01 10:00:00',
				),
				$args
			)
		);
	}

	/**
	 * Records when the viewer last looked at the notes of each post, the way
	 * the editor does.
	 *
	 * @param mixed $last_seen Value of the `notesLastSeen` preference.
	 */
	private function set_last_seen( $last_seen ): void {
		global $wpdb;
		update_user_meta(
			self::$viewer,
			$wpdb->get_blog_prefix() . 'persisted_preferences',
			array(
				'core'      => array( 'notesLastSeen' => $last_seen ),
				'_modified' => '2026-10-01T10:00:00.000Z',
			)
		);
	}

	private function get_unseen( array $post_ids = array() ): array {
		return gutenberg_get_posts_with_unseen_notes( $post_ids ? $post_ids : array( self::$post_id ), self::$viewer );
	}

	public function test_indicator_is_set_up_only_for_post_types_supporting_notes() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		register_post_type(
			'no_notes',
			array(
				'show_ui'  => true,
				'supports' => array( 'title', 'editor' ),
			)
		);

		set_current_screen( 'edit-no_notes' );
		gutenberg_setup_unseen_notes_indicator();
		$this->assertFalse( has_filter( 'post_states_html', 'gutenberg_add_unseen_notes_indicator_to_post_states' ), 'A post type without notes support gets no indicator.' );

		set_current_screen( 'edit-post' );
		gutenberg_setup_unseen_notes_indicator();
		$this->assertSame( 10, has_filter( 'post_states_html', 'gutenberg_add_unseen_notes_indicator_to_post_states' ), 'Posts support notes.' );

		remove_filter( 'post_states_html', 'gutenberg_add_unseen_notes_indicator_to_post_states' );
		remove_action( 'admin_enqueue_scripts', 'gutenberg_add_unseen_notes_indicator_styles' );
		set_current_screen( 'front' );
		unregister_post_type( 'no_notes' );
	}

	public function test_post_without_notes_has_nothing_unseen() {
		$this->assertSame( array(), $this->get_unseen() );
	}

	public function test_note_by_someone_else_is_unseen_when_never_looked() {
		$this->create_note();

		$this->assertSame( array( self::$post_id ), $this->get_unseen() );
	}

	public function test_own_notes_are_never_unseen() {
		$thread = $this->create_note( array( 'user_id' => self::$viewer ) );
		$this->create_note(
			array(
				'user_id'          => self::$viewer,
				'comment_parent'   => $thread,
				'comment_date_gmt' => '2026-10-02 10:00:00',
			)
		);

		$this->assertSame( array(), $this->get_unseen() );
	}

	public function test_reply_by_someone_else_on_own_thread_is_unseen() {
		$thread = $this->create_note( array( 'user_id' => self::$viewer ) );
		$this->create_note( array( 'comment_parent' => $thread ) );

		$this->assertSame( array( self::$post_id ), $this->get_unseen() );
	}

	public function test_resolved_threads_are_not_unseen() {
		$thread = $this->create_note( array( 'comment_approved' => '1' ) );
		$this->create_note(
			array(
				'comment_parent'   => $thread,
				'comment_date_gmt' => '2026-10-02 10:00:00',
			)
		);

		$this->assertSame( array(), $this->get_unseen() );
	}

	public function test_trashed_and_spam_notes_are_not_unseen() {
		$this->create_note( array( 'comment_approved' => 'trash' ) );
		$this->create_note( array( 'comment_approved' => 'spam' ) );
		$thread = $this->create_note( array( 'user_id' => self::$viewer ) );
		$this->create_note(
			array(
				'comment_parent'   => $thread,
				'comment_approved' => 'trash',
			)
		);

		$this->assertSame( array(), $this->get_unseen() );
	}

	public function test_activity_up_to_last_seen_is_seen() {
		$this->create_note();
		$this->set_last_seen( array( self::$post_id => '2026-10-01T10:00:00' ) );

		$this->assertSame( array(), $this->get_unseen() );
	}

	public function test_activity_after_last_seen_is_unseen() {
		$thread = $this->create_note();
		$this->create_note(
			array(
				'comment_parent'   => $thread,
				'comment_date_gmt' => '2026-10-03 08:30:00',
			)
		);
		$this->set_last_seen( array( self::$post_id => '2026-10-02T00:00:00' ) );

		$this->assertSame( array( self::$post_id ), $this->get_unseen() );
	}

	public function test_malformed_last_seen_is_ignored() {
		$this->create_note();

		$this->set_last_seen( array( self::$post_id => 'tomorrow' ) );
		$this->assertSame( array( self::$post_id ), $this->get_unseen(), 'A value that is not a date is ignored.' );

		$this->set_last_seen( 'not a map' );
		$this->assertSame( array( self::$post_id ), $this->get_unseen(), 'A preference that is not a map is ignored.' );
	}

	public function test_posts_the_user_cannot_edit_are_left_out() {
		$this->create_note();
		$contributor = self::factory()->user->create( array( 'role' => 'contributor' ) );

		$this->assertSame( array(), gutenberg_get_posts_with_unseen_notes( array( self::$post_id ), $contributor ) );
	}

	public function test_page_of_posts_does_not_query_comments_per_row() {
		$post_ids = self::factory()->post->create_many( 25, array( 'post_author' => self::$collaborator ) );
		foreach ( $post_ids as $index => $post_id ) {
			if ( 0 === $index % 2 ) {
				$this->create_note( array( 'comment_post_ID' => $post_id ) );
			}
		}

		$comment_queries = 0;
		$count_queries   = static function ( $query ) use ( &$comment_queries ) {
			global $wpdb;
			if ( str_contains( $query, $wpdb->comments ) ) {
				++$comment_queries;
			}
			return $query;
		};
		add_filter( 'query', $count_queries );
		$unseen = $this->get_unseen( $post_ids );
		remove_filter( 'query', $count_queries );

		// One query for the note IDs, and one to prime them into the cache.
		$this->assertLessThanOrEqual( 2, $comment_queries );
		$this->assertCount( 13, $unseen );
	}

	public function test_indicator_is_appended_after_post_states() {
		$this->create_note();
		$post        = get_post( self::$post_id );
		$states_html = " &mdash; <span class='post-state'>Draft</span>";

		$html = gutenberg_add_unseen_notes_indicator_to_post_states( $states_html, array( 'draft' => 'Draft' ), $post );

		$this->assertStringStartsWith( $states_html, $html, 'The post states are kept as they are.' );
		$this->assertStringContainsString( 'class="wp-note-unseen-indicator"', $html );
		$this->assertStringContainsString( 'notes=open', $html, 'The indicator links to the notes in the editor.' );
		$this->assertStringContainsString( 'New note activity on', $html );
	}

	public function test_indicator_is_not_added_to_trashed_posts() {
		$this->create_note();
		wp_trash_post( self::$post_id );

		$html = gutenberg_add_unseen_notes_indicator_to_post_states( '', array(), get_post( self::$post_id ) );

		$this->assertSame( '', $html );
	}
}
