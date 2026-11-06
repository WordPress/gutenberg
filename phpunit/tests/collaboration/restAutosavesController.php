<?php
/**
 * Tests for the collaboration autosaves REST controller override.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_RestAutosavesController extends WP_UnitTestCase {

	protected static int $author_id;
	protected static int $editor_id;

	private const CRDT_DOC_META_KEY = '_crdt_document';

	private const CRDT_SNAPSHOT_META_KEY = Gutenberg_REST_Autosaves_Controller::CRDT_SNAPSHOT_META_KEY;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$author_id );
		self::delete_user( self::$editor_id );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$author_id );
	}

	public function tear_down() {
		remove_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );
		parent::tear_down();
	}

	public function test_does_not_override_autosaves_controller_when_collaboration_is_disabled() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$args = gutenberg_override_autosaves_rest_controller( array() );

		$this->assertArrayNotHasKey( 'autosave_rest_controller_class', $args );
	}

	public function test_overrides_autosaves_controller_when_collaboration_is_enabled() {
		$args = gutenberg_override_autosaves_rest_controller( array() );

		$this->assertSame(
			'Gutenberg_REST_Autosaves_Controller',
			$args['autosave_rest_controller_class']
		);
	}

	public function test_does_not_override_explicit_autosaves_controller() {
		$args = gutenberg_override_autosaves_rest_controller(
			array( 'autosave_rest_controller_class' => 'Custom_REST_Autosaves_Controller' )
		);

		$this->assertSame(
			'Custom_REST_Autosaves_Controller',
			$args['autosave_rest_controller_class']
		);
	}

	/**
	 * Creates an empty auto-draft post.
	 *
	 * @return int Post ID.
	 */
	private function create_auto_draft(): int {
		return self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => '',
				'post_status'  => 'auto-draft',
				'post_title'   => 'Auto Draft',
				'post_type'    => 'post',
			)
		);
	}

	/**
	 * Creates a draft post.
	 *
	 * @param string $title   Post title.
	 * @param string $content Post content.
	 * @return int Post ID.
	 */
	private function create_draft( string $title, string $content ): int {
		return self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => $content,
				'post_status'  => 'draft',
				'post_title'   => $title,
				'post_type'    => 'post',
			)
		);
	}

	/**
	 * Handles an autosave request with the Gutenberg controller.
	 *
	 * @param int         $post_id       Post ID.
	 * @param string      $title         Autosaved post title.
	 * @param string      $content       Autosaved post content.
	 * @param array       $meta          Autosaved post meta.
	 * @param string|null $crdt_snapshot CRDT snapshot describing the autosaved content.
	 * @return WP_REST_Response Autosave response.
	 */
	private function dispatch_autosave( int $post_id, string $title, string $content, array $meta = array(), ?string $crdt_snapshot = null ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', "/wp/v2/posts/{$post_id}/autosaves" );
		$request->set_url_params( array( 'id' => $post_id ) );
		$body_params = array(
			'title'   => $title,
			'content' => $content,
			'status'  => 'draft',
		);
		if ( ! empty( $meta ) ) {
			$body_params['meta'] = $meta;
		}
		$request->set_body_params( $body_params );
		if ( null !== $crdt_snapshot ) {
			$request->set_param( 'crdt_snapshot', $crdt_snapshot );
		}

		/*
		 * Individual tests toggle RTC after post types have been registered and
		 * their autosave controller classes selected. Changing the experiment
		 * does not update that selection, so REST dispatch may exercise the wrong
		 * implementation for the test state. Invoke the Gutenberg controller
		 * directly and normalize its response as the REST server would.
		 */
		$controller = new Gutenberg_REST_Autosaves_Controller( 'post' );
		$response   = $controller->create_item( $request );

		if ( is_wp_error( $response ) ) {
			return rest_convert_error_to_response( $response );
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Asserts that the custom controller uses Core autosave behavior.
	 */
	private function assert_custom_controller_uses_core_autosave_behavior(): void {
		$post_id = $this->create_draft( 'Original title', 'Original content' );
		$title   = 'Updated title';
		$content = '<!-- wp:paragraph --><p>Updated content</p><!-- /wp:paragraph -->';

		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $title, get_post( $post_id )->post_title );
		$this->assertFalse(
			wp_get_post_autosave( $post_id, self::$author_id ),
			'Core should update the author draft directly instead of creating an RTC revision.'
		);
	}

	/**
	 * Backdates a post's modified time by one hour.
	 *
	 * Everything in a test runs within the same clock second, and
	 * wp_update_post() always resets post_modified to the current time, so the
	 * database is updated directly to make another post the most recently
	 * modified one.
	 *
	 * @param int $post_id Post ID.
	 */
	private function backdate_post_modified( int $post_id ): void {
		global $wpdb;

		$backdated = gmdate( 'Y-m-d H:i:s', time() - HOUR_IN_SECONDS );

		$wpdb->update(
			$wpdb->posts,
			array(
				'post_modified'     => $backdated,
				'post_modified_gmt' => $backdated,
			),
			array( 'ID' => $post_id )
		);

		clean_post_cache( $post_id );
	}

	public function test_auto_draft_autosave_promotes_parent_post_when_collaboration_is_disabled() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$post_id = $this->create_auto_draft();
		$title   = 'No RTC autosaved title';
		$content = '<!-- wp:paragraph --><p>No RTC autosaved content</p><!-- /wp:paragraph -->';

		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$post = get_post( $post_id );
		$this->assertSame( 'draft', $post->post_status );
		$this->assertSame( $title, $post->post_title );
		$this->assertSame( $content, $post->post_content );
	}

	public function test_auto_draft_autosave_promotes_parent_post_when_collaboration_is_enabled() {
		$post_id = $this->create_auto_draft();
		$title   = 'RTC autosaved title';
		$content = '<!-- wp:paragraph --><p>RTC autosaved content</p><!-- /wp:paragraph -->';

		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$post = get_post( $post_id );
		$this->assertSame( 'draft', $post->post_status );
		$this->assertSame( $title, $post->post_title );
		$this->assertSame( $content, $post->post_content );
	}

	public function test_collaborator_auto_draft_autosave_promotes_parent_post_when_collaboration_is_enabled() {
		$post_id = $this->create_auto_draft();
		$title   = 'RTC collaborator autosaved title';
		$content = '<!-- wp:paragraph --><p>RTC collaborator autosaved content</p><!-- /wp:paragraph -->';

		wp_set_current_user( self::$editor_id );
		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$post = get_post( $post_id );
		$this->assertSame( 'draft', $post->post_status );
		$this->assertSame( $title, $post->post_title );
		$this->assertSame( $content, $post->post_content );
	}

	public function test_draft_autosave_creates_revision_when_collaboration_is_enabled() {
		$original_title   = 'Original RTC draft title';
		$original_content = '<!-- wp:paragraph --><p>Original RTC draft content</p><!-- /wp:paragraph -->';
		$post_id          = $this->create_draft( $original_title, $original_content );
		$title            = 'RTC draft autosaved title';
		$content          = '<!-- wp:paragraph --><p>RTC draft autosaved content</p><!-- /wp:paragraph -->';

		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$post = get_post( $post_id );
		$this->assertSame( 'draft', $post->post_status );
		$this->assertSame( $original_title, $post->post_title );
		$this->assertSame( $original_content, $post->post_content );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $autosave );
		$this->assertSame( $title, $autosave->post_title );
		$this->assertSame( $content, $autosave->post_content );
	}

	public function test_draft_autosave_does_not_create_revision_when_content_is_unchanged() {
		$title   = 'Unchanged RTC draft title';
		$content = '<!-- wp:paragraph --><p>Unchanged RTC draft content</p><!-- /wp:paragraph -->';
		$post_id = $this->create_draft( $title, $content );

		// Autosave with the exact same title and content as the saved post, while
		// still sending meta as the editor does (the CRDT document changes on
		// every autosave). The unchanged revisioned fields must win: a no-op
		// autosave should not leave behind a revision that would later be flagged
		// as "a more recent autosave" purely by its timestamp.
		$response = $this->dispatch_autosave(
			$post_id,
			$title,
			$content,
			array(
				self::CRDT_DOC_META_KEY => 'changed-crdt-doc',
			)
		);

		$this->assertSame( 200, $response->get_status() );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertFalse( $autosave, 'Expected no autosave revision for an unchanged autosave.' );
	}

	public function test_peer_autosave_matching_latest_revision_does_not_create_a_blank_revision() {
		$original_title   = 'Shared RTC draft title';
		$original_content = '<!-- wp:paragraph --><p>Shared RTC draft original</p><!-- /wp:paragraph -->';
		$post_id          = $this->create_draft( $original_title, $original_content );

		$shared_title   = 'Shared RTC draft title edited';
		$shared_content = '<!-- wp:paragraph --><p>Shared RTC draft edited in collaboration</p><!-- /wp:paragraph -->';

		// The author autosaves an edit. Under RTC it is stored as a revision and
		// the parent draft is left stale, so the latest revision (not the parent)
		// now holds the most recent shared content.
		$author_response = $this->dispatch_autosave( $post_id, $shared_title, $shared_content );
		$this->assertSame( 200, $author_response->get_status() );

		$author_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $author_autosave );

		// A peer autosaves the same shared content. It matches the latest
		// revision and differs only from the stale parent, so storing it would
		// create a second, identical revision that renders as a blank diff. It
		// must be recognized as redundant instead.
		wp_set_current_user( self::$editor_id );
		$peer_response = $this->dispatch_autosave( $post_id, $shared_title, $shared_content );
		$this->assertSame( 200, $peer_response->get_status() );

		$peer_autosave = wp_get_post_autosave( $post_id, self::$editor_id );
		$this->assertFalse(
			$peer_autosave,
			'Expected no redundant peer autosave revision matching the latest revision.'
		);
	}

	public function test_autosave_compares_against_parent_not_latest_revision_without_collaboration() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$published_title   = 'Published title';
		$published_content = '<!-- wp:paragraph --><p>Published content</p><!-- /wp:paragraph -->';
		$post_id           = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => $published_content,
				'post_status'  => 'publish',
				'post_title'   => $published_title,
				'post_type'    => 'post',
			)
		);

		$edited_title   = 'Edited title';
		$edited_content = '<!-- wp:paragraph --><p>Edited content</p><!-- /wp:paragraph -->';

		// The author autosaves an edit. A published post is never updated in
		// place, so the edit is stored as a revision while the parent keeps its
		// published content.
		$author_response = $this->dispatch_autosave( $post_id, $edited_title, $edited_content );
		$this->assertSame( 200, $author_response->get_status() );

		$author_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $author_autosave );

		// A peer autosaves the same edited content. It matches the author's
		// revision but differs from the published parent. Without collaboration
		// the baseline is the parent (core's behavior), so this is not redundant
		// and the peer's own autosave revision is still stored.
		wp_set_current_user( self::$editor_id );
		$peer_response = $this->dispatch_autosave( $post_id, $edited_title, $edited_content );
		$this->assertSame( 200, $peer_response->get_status() );

		$peer_autosave = wp_get_post_autosave( $post_id, self::$editor_id );
		$this->assertInstanceOf(
			WP_Post::class,
			$peer_autosave,
			'Without collaboration the parent post is the comparison baseline, so a peer autosave that differs from the parent must still be stored.'
		);
	}

	public function test_custom_controller_delegates_to_core_when_collaboration_is_disabled() {
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$this->assert_custom_controller_uses_core_autosave_behavior();
	}

	public function test_custom_controller_delegates_to_core_when_post_type_collaboration_is_disabled() {
		add_filter( 'wp_is_post_type_collaboration_disabled', array( $this, 'disable_post_collaboration' ), 10, 2 );

		try {
			$this->assert_custom_controller_uses_core_autosave_behavior();
		} finally {
			remove_filter( 'wp_is_post_type_collaboration_disabled', array( $this, 'disable_post_collaboration' ) );
		}
	}

	public function disable_post_collaboration( $disabled, $post_type ) {
		return 'post' === $post_type ? true : $disabled;
	}

	public function test_autosave_compares_against_parent_when_parent_is_newer_than_latest_revision() {
		$original_title   = 'Newer parent draft title';
		$original_content = '<!-- wp:paragraph --><p>Newer parent draft content</p><!-- /wp:paragraph -->';
		$post_id          = $this->create_draft( $original_title, $original_content );

		$edited_title   = 'Newer parent draft title edited';
		$edited_content = '<!-- wp:paragraph --><p>Newer parent draft content edited</p><!-- /wp:paragraph -->';

		// The author autosaves an edit, which is stored as a revision.
		$author_response = $this->dispatch_autosave( $post_id, $edited_title, $edited_content );
		$this->assertSame( 200, $author_response->get_status() );

		$author_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $author_autosave );

		// The parent is then updated directly, without storing a revision of the
		// update. A draft only receives a real post_modified_gmt once it is
		// updated; until then it is '0000-00-00 00:00:00' and every revision
		// compares as newer.
		remove_action( 'post_updated', 'wp_save_post_revision' );
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_title'   => 'Newer parent draft title saved',
				'post_content' => '<!-- wp:paragraph --><p>Newer parent draft content saved</p><!-- /wp:paragraph -->',
			)
		);
		add_action( 'post_updated', 'wp_save_post_revision' );

		// Backdate the revision so the parent is unambiguously the most recently
		// modified post; otherwise both share the same clock second and the
		// revision wins the tie.
		$this->backdate_post_modified( $author_autosave->ID );

		// A peer autosaves content matching the stale revision. Even with
		// collaboration enabled the newer parent is the comparison baseline,
		// and the autosave differs from the parent, so it must be stored
		// rather than skipped as redundant against the older revision.
		wp_set_current_user( self::$editor_id );
		$peer_response = $this->dispatch_autosave( $post_id, $edited_title, $edited_content );
		$this->assertSame( 200, $peer_response->get_status() );

		$peer_autosave = wp_get_post_autosave( $post_id, self::$editor_id );
		$this->assertInstanceOf(
			WP_Post::class,
			$peer_autosave,
			'When the parent post is newer than the latest revision the parent is the comparison baseline, so an autosave that differs from the parent must still be stored.'
		);
	}

	public function test_draft_autosave_creates_revision_when_revisioned_meta_changes() {
		// `footnotes` is the real-world example of a revisioned meta key, but a
		// dedicated key is registered here so the test does not depend on whether
		// footnotes happens to be registered in the test bootstrap.
		$meta_key = 'test_revisioned_meta';
		register_post_meta(
			'post',
			$meta_key,
			array(
				'single'            => true,
				'type'              => 'string',
				'show_in_rest'      => true,
				'revisions_enabled' => true,
			)
		);

		$title   = 'RTC draft title with revisioned meta';
		$content = '<!-- wp:paragraph --><p>RTC draft content with revisioned meta</p><!-- /wp:paragraph -->';
		$post_id = $this->create_draft( $title, $content );
		update_post_meta( $post_id, $meta_key, 'original meta value' );

		// Autosave with identical title and content but a changed revisioned meta
		// value. Because the meta is revisioned, the change is recoverable and must
		// be stored as a revision rather than skipped as a no-op.
		$response = $this->dispatch_autosave(
			$post_id,
			$title,
			$content,
			array(
				$meta_key => 'updated meta value',
			)
		);

		unregister_post_meta( 'post', $meta_key );

		$this->assertSame( 200, $response->get_status() );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $autosave );
		$this->assertSame(
			'updated meta value',
			get_post_meta( $autosave->ID, $meta_key, true )
		);
	}

	public function test_peer_autosave_compares_revisioned_meta_against_latest_revision() {
		$meta_key = 'test_revisioned_meta';
		register_post_meta(
			'post',
			$meta_key,
			array(
				'single'            => true,
				'type'              => 'string',
				'show_in_rest'      => true,
				'revisions_enabled' => true,
			)
		);

		$title   = 'RTC draft title with shared revisioned meta';
		$content = '<!-- wp:paragraph --><p>RTC draft content with shared revisioned meta</p><!-- /wp:paragraph -->';
		$post_id = $this->create_draft( $title, $content );
		update_post_meta( $post_id, $meta_key, 'original meta value' );

		// The author autosaves a meta-only change. Under RTC it is stored as a
		// revision and the parent keeps the original meta value, so the latest
		// revision (not the parent) holds the most recent shared meta.
		$author_response = $this->dispatch_autosave(
			$post_id,
			$title,
			$content,
			array(
				$meta_key => 'updated meta value',
			)
		);
		$this->assertSame( 200, $author_response->get_status() );

		$author_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $author_autosave );
		$this->assertSame(
			'updated meta value',
			get_post_meta( $author_autosave->ID, $meta_key, true )
		);

		// A peer autosaves the same shared meta value. It matches the latest
		// revision and differs only from the stale parent meta, so it must be
		// recognized as redundant instead of stored as another identical
		// revision that renders as a blank diff.
		wp_set_current_user( self::$editor_id );
		$peer_response = $this->dispatch_autosave(
			$post_id,
			$title,
			$content,
			array(
				$meta_key => 'updated meta value',
			)
		);

		unregister_post_meta( 'post', $meta_key );

		$this->assertSame( 200, $peer_response->get_status() );

		$peer_autosave = wp_get_post_autosave( $post_id, self::$editor_id );
		$this->assertFalse(
			$peer_autosave,
			'Expected no redundant peer autosave revision when revisioned meta matches the latest revision.'
		);
	}

	public function test_draft_autosave_does_not_store_crdt_doc_meta_on_revision() {
		$original_title   = 'Original RTC draft title with CRDT meta';
		$original_content = '<!-- wp:paragraph --><p>Original RTC draft content with CRDT meta</p><!-- /wp:paragraph -->';
		$post_id          = $this->create_draft( $original_title, $original_content );
		$persisted_doc    = 'persisted-crdt-doc';
		$stale_doc        = 'stale-autosave-crdt-doc';

		update_post_meta( $post_id, self::CRDT_DOC_META_KEY, $persisted_doc );

		$response = $this->dispatch_autosave(
			$post_id,
			'RTC draft autosaved title with stale CRDT meta',
			'<!-- wp:paragraph --><p>RTC draft autosaved content with stale CRDT meta</p><!-- /wp:paragraph -->',
			array(
				self::CRDT_DOC_META_KEY => $stale_doc,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $persisted_doc, get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true ) );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $autosave );
		$this->assertSame( '', get_post_meta( $autosave->ID, self::CRDT_DOC_META_KEY, true ) );
	}

	public function test_auto_draft_promotion_does_not_overwrite_crdt_doc_meta() {
		$post_id       = $this->create_auto_draft();
		$persisted_doc = 'persisted-auto-draft-crdt-doc';
		$stale_doc     = 'stale-auto-draft-autosave-crdt-doc';

		update_post_meta( $post_id, self::CRDT_DOC_META_KEY, $persisted_doc );

		$response = $this->dispatch_autosave(
			$post_id,
			'RTC promoted auto-draft title with stale CRDT meta',
			'<!-- wp:paragraph --><p>RTC promoted auto-draft content with stale CRDT meta</p><!-- /wp:paragraph -->',
			array(
				self::CRDT_DOC_META_KEY => $stale_doc,
			)
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'draft', get_post_status( $post_id ) );
		$this->assertSame( $persisted_doc, get_post_meta( $post_id, self::CRDT_DOC_META_KEY, true ) );
	}

	public function test_autosave_stores_the_crdt_snapshot_on_the_revision() {
		$post_id  = $this->create_draft( 'Snapshot draft title', '<!-- wp:paragraph --><p>Snapshot draft content</p><!-- /wp:paragraph -->' );
		$snapshot = 'AQEBAAA=';

		$response = $this->dispatch_autosave(
			$post_id,
			'Snapshot autosaved title',
			'<!-- wp:paragraph --><p>Snapshot autosaved content</p><!-- /wp:paragraph -->',
			array(),
			$snapshot
		);

		$this->assertSame( 200, $response->get_status() );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $autosave );
		$this->assertSame( $snapshot, get_post_meta( $autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );

		// The snapshot describes the autosave, not the parent post.
		$this->assertSame( '', get_post_meta( $post_id, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_autosave_replaces_the_crdt_snapshot_when_updating_an_existing_revision() {
		$post_id = $this->create_draft( 'Snapshot update draft title', '<!-- wp:paragraph --><p>Snapshot update draft content</p><!-- /wp:paragraph -->' );

		$this->dispatch_autosave(
			$post_id,
			'Snapshot update autosaved title one',
			'<!-- wp:paragraph --><p>Snapshot update autosaved content one</p><!-- /wp:paragraph -->',
			array(),
			'FIRST_SNAPSHOT'
		);

		$first_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $first_autosave );

		$response = $this->dispatch_autosave(
			$post_id,
			'Snapshot update autosaved title two',
			'<!-- wp:paragraph --><p>Snapshot update autosaved content two</p><!-- /wp:paragraph -->',
			array(),
			'SECOND_SNAPSHOT'
		);

		$this->assertSame( 200, $response->get_status() );

		$second_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertSame( $first_autosave->ID, $second_autosave->ID, 'Expected the existing autosave revision to be updated.' );
		$this->assertSame( 'SECOND_SNAPSHOT', get_post_meta( $second_autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_redundant_autosave_does_not_store_a_crdt_snapshot() {
		$title   = 'Redundant snapshot draft title';
		$content = '<!-- wp:paragraph --><p>Redundant snapshot draft content</p><!-- /wp:paragraph -->';
		$post_id = $this->create_draft( $title, $content );

		// Identical revisioned fields, so no revision is created and the
		// response carries the parent post ID.
		$response = $this->dispatch_autosave( $post_id, $title, $content, array(), 'REDUNDANT_SNAPSHOT' );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( wp_get_post_autosave( $post_id, self::$author_id ) );
		$this->assertSame( '', get_post_meta( $post_id, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_parent_draft_update_does_not_store_a_crdt_snapshot() {
		// Without collaboration an author's own draft is updated directly
		// rather than stored as a revision, so there is no autosave to describe.
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$post_id = $this->create_draft( 'Direct update draft title', '<!-- wp:paragraph --><p>Direct update draft content</p><!-- /wp:paragraph -->' );

		$response = $this->dispatch_autosave(
			$post_id,
			'Direct update autosaved title',
			'<!-- wp:paragraph --><p>Direct update autosaved content</p><!-- /wp:paragraph -->',
			array(),
			'DIRECT_UPDATE_SNAPSHOT'
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( '', get_post_meta( $post_id, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_auto_draft_promotion_does_not_store_a_crdt_snapshot() {
		$post_id = $this->create_auto_draft();

		$response = $this->dispatch_autosave(
			$post_id,
			'Promoted auto-draft title',
			'<!-- wp:paragraph --><p>Promoted auto-draft content</p><!-- /wp:paragraph -->',
			array(),
			'PROMOTION_SNAPSHOT'
		);

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'draft', get_post_status( $post_id ) );
		$this->assertSame( '', get_post_meta( $post_id, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_oversize_crdt_snapshot_is_dropped_without_failing_the_autosave() {
		$post_id = $this->create_draft( 'Oversize snapshot draft title', '<!-- wp:paragraph --><p>Oversize snapshot draft content</p><!-- /wp:paragraph -->' );

		$response = $this->dispatch_autosave(
			$post_id,
			'Oversize snapshot autosaved title',
			'<!-- wp:paragraph --><p>Oversize snapshot autosaved content</p><!-- /wp:paragraph -->',
			array(),
			str_repeat( 'A', MB_IN_BYTES + 1 )
		);

		$this->assertSame( 200, $response->get_status() );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $autosave, 'Expected the autosave revision to still be created.' );
		$this->assertSame( '', get_post_meta( $autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_autosave_without_a_crdt_snapshot_clears_a_previously_stored_snapshot() {
		$post_id = $this->create_draft( 'Stale snapshot draft title', '<!-- wp:paragraph --><p>Stale snapshot draft content</p><!-- /wp:paragraph -->' );

		$this->dispatch_autosave(
			$post_id,
			'Stale snapshot autosaved title one',
			'<!-- wp:paragraph --><p>Stale snapshot autosaved content one</p><!-- /wp:paragraph -->',
			array(),
			'STALE_SNAPSHOT'
		);

		$first_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $first_autosave );
		$this->assertSame( 'STALE_SNAPSHOT', get_post_meta( $first_autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );

		// A later autosave without a snapshot, e.g. from a non-RTC client or
		// a direct REST call, updates the same revision. The old snapshot
		// must not remain attached to content it does not describe, or it
		// could wrongly suppress the recovery notice for that content.
		$response = $this->dispatch_autosave(
			$post_id,
			'Stale snapshot autosaved title two',
			'<!-- wp:paragraph --><p>Stale snapshot autosaved content two</p><!-- /wp:paragraph -->'
		);

		$this->assertSame( 200, $response->get_status() );

		$second_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertSame( $first_autosave->ID, $second_autosave->ID, 'Expected the existing autosave revision to be updated.' );
		$this->assertSame( '', get_post_meta( $second_autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_oversize_crdt_snapshot_clears_a_previously_stored_snapshot() {
		$post_id = $this->create_draft( 'Oversize stale snapshot draft title', '<!-- wp:paragraph --><p>Oversize stale snapshot draft content</p><!-- /wp:paragraph -->' );

		$this->dispatch_autosave(
			$post_id,
			'Oversize stale snapshot autosaved title one',
			'<!-- wp:paragraph --><p>Oversize stale snapshot autosaved content one</p><!-- /wp:paragraph -->',
			array(),
			'VALID_SNAPSHOT'
		);

		$first_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $first_autosave );

		$response = $this->dispatch_autosave(
			$post_id,
			'Oversize stale snapshot autosaved title two',
			'<!-- wp:paragraph --><p>Oversize stale snapshot autosaved content two</p><!-- /wp:paragraph -->',
			array(),
			str_repeat( 'A', MB_IN_BYTES + 1 )
		);

		$this->assertSame( 200, $response->get_status() );

		$second_autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertSame( $first_autosave->ID, $second_autosave->ID, 'Expected the existing autosave revision to be updated.' );
		$this->assertSame( '', get_post_meta( $second_autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}

	public function test_autosave_without_a_crdt_snapshot_stores_no_meta() {
		$post_id = $this->create_draft( 'No snapshot draft title', '<!-- wp:paragraph --><p>No snapshot draft content</p><!-- /wp:paragraph -->' );

		$response = $this->dispatch_autosave(
			$post_id,
			'No snapshot autosaved title',
			'<!-- wp:paragraph --><p>No snapshot autosaved content</p><!-- /wp:paragraph -->'
		);

		$this->assertSame( 200, $response->get_status() );

		$autosave = wp_get_post_autosave( $post_id, self::$author_id );
		$this->assertInstanceOf( WP_Post::class, $autosave );
		$this->assertSame( '', get_post_meta( $autosave->ID, self::CRDT_SNAPSHOT_META_KEY, true ) );
	}
}
