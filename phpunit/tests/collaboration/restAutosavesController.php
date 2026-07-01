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

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$author_id );
		self::delete_user( self::$editor_id );
		delete_option( 'wp_collaboration_enabled' );
	}

	public function set_up() {
		parent::set_up();
		update_option( 'wp_collaboration_enabled', 1 );
		wp_set_current_user( self::$author_id );
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
	 * Dispatches an autosave request for a post.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $title   Autosaved post title.
	 * @param string $content Autosaved post content.
	 * @param array  $meta    Autosaved post meta.
	 * @return WP_REST_Response Autosave response.
	 */
	private function dispatch_autosave( int $post_id, string $title, string $content, array $meta = array() ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', "/wp/v2/posts/{$post_id}/autosaves" );
		$request->set_param( 'title', $title );
		$request->set_param( 'content', $content );
		$request->set_param( 'status', 'draft' );
		if ( ! empty( $meta ) ) {
			$request->set_param( 'meta', $meta );
		}

		return rest_get_server()->dispatch( $request );
	}

	public function test_auto_draft_autosave_promotes_parent_post_when_collaboration_is_disabled() {
		update_option( 'wp_collaboration_enabled', 0 );

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
}
