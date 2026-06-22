<?php
/**
 * Tests for the unfiltered-HTML warning surfaced to collaborators who lack the
 * unfiltered_html capability.
 *
 * Covers the CRDT dry-run detection, the post-level detection helper, and the
 * editor-setting filter that flags a post so the editor can warn the user before
 * they make a change that would strip existing CSS or JavaScript.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_WpCollaborationUnfilteredHtmlWarning extends WP_UnitTestCase {

	protected static int $editor_id;
	protected static int $author_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		// Editors have the unfiltered_html capability; authors do not.
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$author_id );
	}

	public function set_up() {
		parent::set_up();

		update_option( 'wp_collaboration_enabled', 1 );
	}

	public function tear_down() {
		delete_option( 'wp_collaboration_enabled' );

		parent::tear_down();
	}

	/*
	 * Helpers.
	 */

	/**
	 * Builds a base64 V2 document with a single paragraph whose rich-text content
	 * is the given string.
	 *
	 * @param string $content Rich-text content for the paragraph.
	 * @return string Base64-encoded V2 update.
	 */
	private function build_encoded_doc( string $content ): string {
		$doc = new Yjs\Doc();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- External y-php API uses clientID.
		$doc->clientID = 900;

		$record = $doc->getMap( 'document' );
		$blocks = new Yjs\YArray();
		$record->set( 'blocks', $blocks );

		$block = new Yjs\YMap();
		$blocks->push( array( $block ) );
		$block->set( 'name', 'core/paragraph' );

		$attributes = new Yjs\YMap();
		$block->set( 'attributes', $attributes );

		$y_text = new Yjs\YText();
		$attributes->set( 'content', $y_text );
		if ( '' !== $content ) {
			$y_text->insert( 0, $content );
		}

		$block->set( 'innerBlocks', new Yjs\YArray() );

		return Yjs\encodeStateAsUpdateV2( $doc )->toBase64();
	}

	/**
	 * Serializes a persisted CRDT document payload the way the client persists it.
	 *
	 * @param string $content Rich-text content for the paragraph.
	 * @return string JSON payload.
	 */
	private function persisted_doc_payload( string $content ): string {
		return wp_json_encode(
			array(
				'document' => $this->build_encoded_doc( $content ),
				'updateId' => 1,
			)
		);
	}

	/*
	 * CRDT dry-run detection.
	 */

	public function test_encoded_state_would_change_detects_unfiltered_html() {
		$encoded = $this->build_encoded_doc( 'Hello <script>alert(1)</script> world' );
		$this->assertTrue( WP_Sync_CRDT_Document::encoded_state_would_change( $encoded ) );
	}

	public function test_encoded_state_would_change_leaves_clean_document_unchanged() {
		$encoded = $this->build_encoded_doc( 'Hello <strong>world</strong>' );
		$this->assertFalse( WP_Sync_CRDT_Document::encoded_state_would_change( $encoded ) );
	}

	/*
	 * Post-level detection helper.
	 */

	public function test_helper_detects_unfiltered_html_in_post_content() {
		// Create as a capable user so the script survives wp_insert_post's kses
		// filtering, mirroring an admin saving unfiltered HTML.
		wp_set_current_user( self::$editor_id );

		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$editor_id,
				'post_content' => '<p>safe</p><script>alert(1)</script>',
			)
		);

		$this->assertTrue( gutenberg_collaboration_post_contains_unfiltered_html( get_post( $post_id ) ) );
	}

	public function test_helper_ignores_clean_block_post_content() {
		// Stored raw (capable user) so this genuinely verifies wp_kses_post does
		// not flag ordinary block markup, including its comment delimiters.
		wp_set_current_user( self::$editor_id );

		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$editor_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>Hello world</p>\n<!-- /wp:paragraph -->",
			)
		);

		$this->assertFalse( gutenberg_collaboration_post_contains_unfiltered_html( get_post( $post_id ) ) );
	}

	public function test_helper_detects_unfiltered_html_in_persisted_crdt_doc() {
		// Post content is clean, but the persisted collaborative document is not.
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>clean</p>\n<!-- /wp:paragraph -->",
			)
		);

		update_post_meta(
			$post_id,
			WP_Sync_Save_Server::CRDT_DOC_META_KEY,
			$this->persisted_doc_payload( 'Hello <script>alert(1)</script>' )
		);

		$this->assertTrue( gutenberg_collaboration_post_contains_unfiltered_html( get_post( $post_id ) ) );
	}

	public function test_helper_ignores_clean_persisted_crdt_doc() {
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>clean</p>\n<!-- /wp:paragraph -->",
			)
		);

		update_post_meta(
			$post_id,
			WP_Sync_Save_Server::CRDT_DOC_META_KEY,
			$this->persisted_doc_payload( 'Hello world' )
		);

		$this->assertFalse( gutenberg_collaboration_post_contains_unfiltered_html( get_post( $post_id ) ) );
	}

	/*
	 * Editor-setting filter.
	 */

	public function test_filter_flags_post_for_incapable_user() {
		// The author owns the post (so they can edit it), but a capable user has
		// injected unfiltered HTML into it. The author then joins to collaborate.
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => '<p>clean</p>',
			)
		);

		wp_set_current_user( self::$editor_id );
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => '<p>safe</p><script>alert(1)</script>',
			)
		);

		wp_set_current_user( self::$author_id );

		$settings = apply_filters(
			'block_editor_settings_all',
			array(),
			new WP_Block_Editor_Context( array( 'post' => get_post( $post_id ) ) )
		);

		$this->assertArrayHasKey( 'collaborationContainsUnfilteredHTML', $settings );
		$this->assertTrue( $settings['collaborationContainsUnfilteredHTML'] );
	}

	public function test_filter_flags_clean_post_as_false_for_incapable_user() {
		wp_set_current_user( self::$author_id );

		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => "<!-- wp:paragraph -->\n<p>clean</p>\n<!-- /wp:paragraph -->",
			)
		);

		$settings = apply_filters(
			'block_editor_settings_all',
			array(),
			new WP_Block_Editor_Context( array( 'post' => get_post( $post_id ) ) )
		);

		$this->assertArrayHasKey( 'collaborationContainsUnfilteredHTML', $settings );
		$this->assertFalse( $settings['collaborationContainsUnfilteredHTML'] );
	}

	public function test_filter_skips_capable_user() {
		wp_set_current_user( self::$editor_id );

		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$editor_id,
				'post_content' => '<p>safe</p><script>alert(1)</script>',
			)
		);

		$settings = apply_filters(
			'block_editor_settings_all',
			array(),
			new WP_Block_Editor_Context( array( 'post' => get_post( $post_id ) ) )
		);

		$this->assertArrayNotHasKey( 'collaborationContainsUnfilteredHTML', $settings );
	}

	public function test_filter_skips_when_collaboration_disabled() {
		update_option( 'wp_collaboration_enabled', 0 );
		wp_set_current_user( self::$author_id );

		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => '<p>safe</p><script>alert(1)</script>',
			)
		);

		$settings = apply_filters(
			'block_editor_settings_all',
			array(),
			new WP_Block_Editor_Context( array( 'post' => get_post( $post_id ) ) )
		);

		$this->assertArrayNotHasKey( 'collaborationContainsUnfilteredHTML', $settings );
	}
}
