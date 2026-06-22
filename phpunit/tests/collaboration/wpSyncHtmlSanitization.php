<?php
/**
 * Tests for server-side HTML sanitization of real-time collaboration sync updates.
 *
 * Verifies that updates from users without the unfiltered_html capability are
 * sanitized before they are stored and broadcast, while updates from capable
 * users are left untouched.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_WpSyncHtmlSanitization extends WP_Test_REST_Controller_Testcase {

	protected static int $editor_id;
	protected static int $author_id;
	protected static int $editor_post_id;
	protected static int $author_post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		// Editors have the unfiltered_html capability; authors do not.
		self::$editor_id      = $factory->user->create( array( 'role' => 'editor' ) );
		self::$author_id      = $factory->user->create( array( 'role' => 'author' ) );
		self::$editor_post_id = $factory->post->create( array( 'post_author' => self::$editor_id ) );
		self::$author_post_id = $factory->post->create( array( 'post_author' => self::$author_id ) );

		update_option( 'wp_collaboration_enabled', 1 );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$author_id );
		wp_delete_post( self::$editor_post_id, true );
		wp_delete_post( self::$author_post_id, true );
		delete_option( 'wp_collaboration_enabled' );
	}

	public function set_up() {
		parent::set_up();

		update_option( 'wp_collaboration_enabled', 1 );

		// Reset storage post ID cache after transaction rollback between tests.
		$reflection = new ReflectionProperty( 'WP_Sync_Post_Meta_Storage_Gutenberg', 'storage_post_ids' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, array() );

		// Reset the cached block attribute schemas so tests that register blocks
		// observe a freshly rebuilt cache.
		$schema_cache = new ReflectionProperty( 'WP_Sync_CRDT_Document', 'attribute_schemas' );
		if ( PHP_VERSION_ID < 80100 ) {
			$schema_cache->setAccessible( true );
		}
		$schema_cache->setValue( null, null );
	}

	public function tear_down() {
		if ( WP_Block_Type_Registry::get_instance()->is_registered( 'my-plugin/custom-link' ) ) {
			unregister_block_type( 'my-plugin/custom-link' );
		}

		parent::tear_down();
	}

	/**
	 * Confirms the test fixtures match the capability assumptions the suite relies
	 * on: editors can persist unfiltered HTML, authors cannot.
	 */
	public function test_capability_fixtures() {
		$this->assertTrue( user_can( self::$editor_id, 'unfiltered_html' ) );
		$this->assertFalse( user_can( self::$author_id, 'unfiltered_html' ) );
		$this->assertTrue( user_can( self::$author_id, 'edit_post', self::$author_post_id ) );
	}

	/*
	 * Helpers.
	 */

	private function author_room(): string {
		return 'postType/post:' . self::$author_post_id;
	}

	private function editor_room(): string {
		return 'postType/post:' . self::$editor_post_id;
	}

	/**
	 * Dispatches a sync update request for a single room.
	 *
	 * @param string $room      Room identifier.
	 * @param array  $updates   Updates to send.
	 * @param int    $client_id Client identifier.
	 * @param int    $cursor    Cursor value.
	 * @return WP_REST_Response Response object.
	 */
	private function dispatch_sync( string $room, array $updates, int $client_id = 1, int $cursor = 0 ) {
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/updates' );
		$request->set_body_params(
			array(
				'rooms' => array(
					array(
						'after'     => $cursor,
						'awareness' => array( 'user' => 'test' ),
						'client_id' => $client_id,
						'room'      => $room,
						'updates'   => $updates,
					),
				),
			)
		);
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Builds a base64 V2 update for a document with a single block.
	 *
	 * @param array $block_spec Block specification (see append_block()).
	 * @param int   $client_id  Yjs client ID.
	 * @param array $fields     Optional post-record rich-text fields (title/content/excerpt).
	 * @return string Base64-encoded update.
	 */
	private function build_block_update( array $block_spec, int $client_id, array $fields = array() ): string {
		return Yjs\encodeStateAsUpdateV2( $this->build_block_doc( array( $block_spec ), $client_id, $fields ) )->toBase64();
	}

	/**
	 * Builds a Yjs document with a `document` root map containing blocks.
	 *
	 * @param array $block_specs Block specifications.
	 * @param int   $client_id   Yjs client ID.
	 * @param array $fields      Optional post-record rich-text fields.
	 * @return Yjs\Doc Document.
	 */
	private function build_block_doc( array $block_specs, int $client_id, array $fields = array() ): Yjs\Doc {
		$doc = new Yjs\Doc();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- External y-php API uses clientID.
		$doc->clientID = $client_id;

		$record = $doc->getMap( 'document' );

		foreach ( $fields as $key => $text ) {
			$y_text = new Yjs\YText();
			$record->set( $key, $y_text );
			if ( '' !== $text ) {
				$y_text->insert( 0, $text );
			}
		}

		$blocks = new Yjs\YArray();
		$record->set( 'blocks', $blocks );

		foreach ( $block_specs as $spec ) {
			$this->append_block( $blocks, $spec );
		}

		return $doc;
	}

	/**
	 * Appends a block (Y.Map) to a blocks Y.Array.
	 *
	 * Spec keys: name, richText (key => string), strings (key => string),
	 * originalContent (string), innerBlocks (array of specs).
	 *
	 * @param Yjs\YArray $blocks Blocks array.
	 * @param array      $spec   Block specification.
	 */
	private function append_block( $blocks, array $spec ): void {
		$block = new Yjs\YMap();
		$blocks->push( array( $block ) );

		$block->set( 'name', $spec['name'] ?? 'core/paragraph' );

		$attributes = new Yjs\YMap();
		$block->set( 'attributes', $attributes );

		foreach ( $spec['richText'] ?? array() as $key => $value ) {
			$y_text = new Yjs\YText();
			$attributes->set( $key, $y_text );
			if ( '' !== $value ) {
				$y_text->insert( 0, $value );
			}
		}

		foreach ( $spec['strings'] ?? array() as $key => $value ) {
			$attributes->set( $key, $value );
		}

		if ( isset( $spec['originalContent'] ) ) {
			$block->set( 'originalContent', $spec['originalContent'] );
		}

		$inner_blocks = new Yjs\YArray();
		$block->set( 'innerBlocks', $inner_blocks );

		foreach ( $spec['innerBlocks'] ?? array() as $inner_spec ) {
			$this->append_block( $inner_blocks, $inner_spec );
		}
	}

	/**
	 * Reconstructs the authoritative document for a room from stored updates.
	 *
	 * @param string $room Room identifier.
	 * @return Yjs\Doc Reconstructed document.
	 */
	private function reconstruct_room_doc( string $room ): Yjs\Doc {
		$storage  = new WP_Sync_Post_Meta_Storage_Gutenberg();
		$snapshot = $storage->get_update_snapshot( $room );

		$doc = new Yjs\Doc();
		foreach ( $snapshot['updates'] as $update ) {
			if ( 'sync_step1' === $update['type'] ) {
				continue;
			}

			if ( 'sync_step2' === $update['type'] ) {
				Yjs\Protocols\Sync::readSyncMessage(
					Yjs\Lib0\Decoding::createDecoder( Yjs\Lib0\Buffer::fromBase64( $update['data'] ) ),
					Yjs\Lib0\Encoding::createEncoder(),
					$doc,
					'test'
				);
				continue;
			}

			Yjs\applyUpdateV2( $doc, Yjs\Lib0\Buffer::fromBase64( $update['data'] ) );
		}

		return $doc;
	}

	/**
	 * Returns the stored updates for a room.
	 *
	 * @param string $room Room identifier.
	 * @return array<int, array<string, mixed>> Stored updates.
	 */
	private function get_room_updates( string $room ): array {
		$storage  = new WP_Sync_Post_Meta_Storage_Gutenberg();
		$snapshot = $storage->get_update_snapshot( $room );
		return $snapshot['updates'];
	}

	/**
	 * Returns a block's attributes map from a reconstructed document.
	 *
	 * @param Yjs\Doc $doc   Document.
	 * @param int     $index Block index.
	 * @return Yjs\Types\YMap Attributes map.
	 */
	private function get_block_attributes( Yjs\Doc $doc, int $index = 0 ) {
		return $doc->getMap( 'document' )->get( 'blocks' )->get( $index )->get( 'attributes' );
	}

	/*
	 * Polling sync sanitization tests.
	 */

	public function test_incapable_user_script_in_rich_text_is_sanitized() {
		wp_set_current_user( self::$author_id );

		$malicious = 'Hello <script>alert(1)</script> world';
		$raw       = $this->build_block_update(
			array(
				'name'     => 'core/paragraph',
				'richText' => array( 'content' => $malicious ),
			),
			700
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			700
		);

		$doc     = $this->reconstruct_room_doc( $this->author_room() );
		$content = $this->get_block_attributes( $doc )->get( 'content' );

		$this->assertSame( wp_kses_post( $malicious ), $content->toString() );
		$this->assertStringNotContainsString( '<script>', $content->toString() );

		// The raw bytes must never be stored; only a server-attributed normalized update.
		$updates = $this->get_room_updates( $this->author_room() );
		$this->assertCount( 1, $updates );
		$this->assertSame( WP_HTTP_Polling_Sync_Server_Gutenberg::SERVER_CLIENT_ID, $updates[0]['client_id'] );
		$this->assertNotSame( $raw, $updates[0]['data'] );
	}

	public function test_incapable_user_core_html_raw_content_is_sanitized() {
		wp_set_current_user( self::$author_id );

		$malicious = '<script>alert(1)</script><p>safe</p>';
		$raw       = $this->build_block_update(
			array(
				'name'    => 'core/html',
				'strings' => array( 'content' => $malicious ),
			),
			710
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			710
		);

		$doc     = $this->reconstruct_room_doc( $this->author_room() );
		$content = $this->get_block_attributes( $doc )->get( 'content' );

		$this->assertSame( wp_kses_post( $malicious ), $content );
		$this->assertStringNotContainsString( '<script>', $content );
	}

	public function test_incapable_user_javascript_url_stripped_legit_url_preserved() {
		wp_set_current_user( self::$author_id );

		$legit_url = 'https://example.com/path?a=1&b=2';
		$raw       = $this->build_block_update(
			array(
				'name'    => 'core/image',
				'strings' => array(
					'url'  => 'javascript:alert(1)',
					'href' => $legit_url,
				),
			),
			720
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			720
		);

		$attributes = $this->get_block_attributes( $this->reconstruct_room_doc( $this->author_room() ) );

		// The javascript: protocol is stripped by esc_url_raw.
		$this->assertSame( '', $attributes->get( 'url' ) );
		// A legitimate URL with an ampersand is left intact (no false positive).
		$this->assertSame( $legit_url, $attributes->get( 'href' ) );
	}

	public function test_incapable_user_custom_named_url_attribute_is_sanitized() {
		// A block whose URL lives in a non-conventional attribute name, sourced
		// into an href. Detection must key off the schema's target attribute, not
		// the attribute key name.
		register_block_type(
			'my-plugin/custom-link',
			array(
				'attributes' => array(
					'linkUrl' => array(
						'type'      => 'string',
						'source'    => 'attribute',
						'selector'  => 'a',
						'attribute' => 'href',
					),
				),
			)
		);

		wp_set_current_user( self::$author_id );

		$raw = $this->build_block_update(
			array(
				'name'    => 'my-plugin/custom-link',
				'strings' => array( 'linkUrl' => 'javascript:alert(1)' ),
			),
			795
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			795
		);

		$attributes = $this->get_block_attributes( $this->reconstruct_room_doc( $this->author_room() ) );
		$this->assertSame( '', $attributes->get( 'linkUrl' ) );
	}

	public function test_incapable_user_nested_query_attribute_is_sanitized() {
		wp_set_current_user( self::$author_id );

		$malicious = 'Cell <script>alert(1)</script>';

		// Build a core/table-like block whose `body` is a Y.Array of rows, each a
		// Y.Map with a `cells` Y.Array of Y.Maps holding a rich-text `content`.
		$doc = new Yjs\Doc();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- External y-php API uses clientID.
		$doc->clientID = 730;

		$record = $doc->getMap( 'document' );
		$blocks = new Yjs\YArray();
		$record->set( 'blocks', $blocks );

		$block = new Yjs\YMap();
		$blocks->push( array( $block ) );
		$block->set( 'name', 'core/table' );

		$attributes = new Yjs\YMap();
		$block->set( 'attributes', $attributes );

		$body = new Yjs\YArray();
		$attributes->set( 'body', $body );

		$row = new Yjs\YMap();
		$body->push( array( $row ) );

		$cells = new Yjs\YArray();
		$row->set( 'cells', $cells );

		$cell = new Yjs\YMap();
		$cells->push( array( $cell ) );

		$cell_content = new Yjs\YText();
		$cell->set( 'content', $cell_content );
		$cell_content->insert( 0, $malicious );

		$raw = Yjs\encodeStateAsUpdateV2( $doc )->toBase64();

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			730
		);

		$reconstructed = $this->reconstruct_room_doc( $this->author_room() );
		$sanitized     = $reconstructed->getMap( 'document' )->get( 'blocks' )->get( 0 )
			->get( 'attributes' )->get( 'body' )->get( 0 )
			->get( 'cells' )->get( 0 )->get( 'content' );

		$this->assertSame( wp_kses_post( $malicious ), $sanitized->toString() );
	}

	public function test_incapable_user_title_excerpt_content_sanitized() {
		wp_set_current_user( self::$author_id );

		$title   = '<script>t</script>My Title';
		$content = '<p>ok</p><script>alert(1)</script>';
		$excerpt = '<b>bold</b><iframe src="evil"></iframe>';

		$raw = $this->build_block_update(
			array(
				'name'     => 'core/paragraph',
				'richText' => array( 'content' => 'body' ),
			),
			740,
			array(
				'title'   => $title,
				'content' => $content,
				'excerpt' => $excerpt,
			)
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			740
		);

		$record = $this->reconstruct_room_doc( $this->author_room() )->getMap( 'document' );

		$this->assertSame( sanitize_text_field( $title ), $record->get( 'title' )->toString() );
		$this->assertSame( wp_kses_post( $content ), $record->get( 'content' )->toString() );
		$this->assertSame( wp_kses_post( $excerpt ), $record->get( 'excerpt' )->toString() );
	}

	public function test_capable_user_unfiltered_html_is_preserved() {
		wp_set_current_user( self::$editor_id );

		$html = 'Trusted <script>console.log(1)</script>';
		$raw  = $this->build_block_update(
			array(
				'name'     => 'core/paragraph',
				'richText' => array( 'content' => $html ),
			),
			750
		);

		$this->dispatch_sync(
			$this->editor_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			750
		);

		$doc = $this->reconstruct_room_doc( $this->editor_room() );
		$this->assertSame( $html, $this->get_block_attributes( $doc )->get( 'content' )->toString() );

		// The raw bytes are stored verbatim, attributed to the sending client.
		$updates = $this->get_room_updates( $this->editor_room() );
		$this->assertCount( 1, $updates );
		$this->assertSame( 750, $updates[0]['client_id'] );
		$this->assertSame( $raw, $updates[0]['data'] );
	}

	public function test_incapable_user_legitimate_markup_not_over_sanitized() {
		wp_set_current_user( self::$author_id );

		// Allowed inline formatting and already-escaped entities survive unchanged.
		$content = 'Hello <strong>world</strong> &amp; <em>friends</em>';
		$raw     = $this->build_block_update(
			array(
				'name'     => 'core/paragraph',
				'richText' => array( 'content' => $content ),
			),
			760
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			760
		);

		$doc = $this->reconstruct_room_doc( $this->author_room() );
		$this->assertSame( $content, $this->get_block_attributes( $doc )->get( 'content' )->toString() );

		// Exactly one normalized update is stored; no sanitization storm.
		$this->assertCount( 1, $this->get_room_updates( $this->author_room() ) );
	}

	public function test_incapable_user_unknown_block_rich_text_is_sanitized() {
		wp_set_current_user( self::$author_id );

		$malicious = 'x<script>alert(1)</script>';
		$raw       = $this->build_block_update(
			array(
				'name'     => 'my-plugin/unregistered',
				'richText' => array( 'content' => $malicious ),
			),
			770
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			770
		);

		$doc = $this->reconstruct_room_doc( $this->author_room() );
		$this->assertSame( wp_kses_post( $malicious ), $this->get_block_attributes( $doc )->get( 'content' )->toString() );
	}

	public function test_sanitized_update_delivered_to_peer_and_offender_without_raw_bytes() {
		wp_set_current_user( self::$author_id );

		$malicious = 'A<script>alert(1)</script>B';
		$raw       = $this->build_block_update(
			array(
				'name'     => 'core/paragraph',
				'richText' => array( 'content' => $malicious ),
			),
			780
		);

		// Author (client 780) sends the malicious update.
		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'update',
					'data' => $raw,
				),
			),
			780
		);

		// A peer (the editor, client 2) polls and must receive only the sanitized update.
		wp_set_current_user( self::$editor_id );
		$peer    = $this->dispatch_sync( $this->author_room(), array(), 2 );
		$updates = $peer->get_data()['rooms'][0]['updates'];

		$this->assertCount( 1, $updates );
		$this->assertNotSame( $raw, $updates[0]['data'] );

		$peer_doc = new Yjs\Doc();
		Yjs\applyUpdateV2( $peer_doc, Yjs\Lib0\Buffer::fromBase64( $updates[0]['data'] ) );
		$peer_content = $peer_doc->getMap( 'document' )->get( 'blocks' )->get( 0 )->get( 'attributes' )->get( 'content' );
		$this->assertSame( wp_kses_post( $malicious ), $peer_content->toString() );

		// The offender (client 780) also receives the correction, since the update
		// is attributed to the server rather than to the offender's client ID.
		wp_set_current_user( self::$author_id );
		$offender = $this->dispatch_sync( $this->author_room(), array(), 780 );
		$this->assertCount( 1, $offender->get_data()['rooms'][0]['updates'] );
	}

	public function test_incapable_user_compaction_is_sanitized() {
		wp_set_current_user( self::$author_id );

		$malicious = 'C<script>alert(1)</script>D';
		$raw       = $this->build_block_update(
			array(
				'name'     => 'core/paragraph',
				'richText' => array( 'content' => $malicious ),
			),
			790
		);

		$this->dispatch_sync(
			$this->author_room(),
			array(
				array(
					'type' => 'compaction',
					'data' => $raw,
				),
			),
			790
		);

		$doc = $this->reconstruct_room_doc( $this->author_room() );
		$this->assertSame( wp_kses_post( $malicious ), $this->get_block_attributes( $doc )->get( 'content' )->toString() );

		$updates = $this->get_room_updates( $this->author_room() );
		$this->assertNotEmpty( $updates );
		foreach ( $updates as $update ) {
			$this->assertNotSame( $raw, $update['data'], 'Raw compaction bytes must not be stored.' );
		}
	}

	/*
	 * Save endpoint sanitization tests.
	 */

	/**
	 * Dispatches a CRDT document save request.
	 *
	 * @param string $room Room identifier.
	 * @param string $doc  Serialized CRDT document payload.
	 * @return WP_REST_Response Response object.
	 */
	private function dispatch_save( string $room, string $doc ) {
		$request = new WP_REST_Request( 'POST', '/wp-sync/v1/save' );
		$request->set_body_params(
			array(
				'room' => $room,
				'doc'  => $doc,
			)
		);
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Serializes a document the way the client persists it.
	 *
	 * @param Yjs\Doc $doc Document.
	 * @return string JSON payload.
	 */
	private function serialize_persisted_doc( Yjs\Doc $doc ): string {
		return wp_json_encode(
			array(
				'document' => Yjs\encodeStateAsUpdateV2( $doc )->toBase64(),
				'updateId' => 1,
			)
		);
	}

	private function persisted_doc_content( int $post_id ): string {
		$stored  = get_post_meta( $post_id, '_crdt_document', true );
		$decoded = json_decode( $stored, true );
		$doc     = new Yjs\Doc();
		Yjs\applyUpdateV2( $doc, Yjs\Lib0\Buffer::fromBase64( $decoded['document'] ) );
		return $doc->getMap( 'document' )->get( 'blocks' )->get( 0 )->get( 'attributes' )->get( 'content' )->toString();
	}

	public function test_save_sanitizes_persisted_doc_for_incapable_user() {
		wp_set_current_user( self::$author_id );

		$malicious = 'Save<script>alert(1)</script>Me';
		$doc       = $this->build_block_doc(
			array(
				array(
					'name'     => 'core/paragraph',
					'richText' => array( 'content' => $malicious ),
				),
			),
			800
		);

		$response = $this->dispatch_save( $this->author_room(), $this->serialize_persisted_doc( $doc ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( wp_kses_post( $malicious ), $this->persisted_doc_content( self::$author_post_id ) );
	}

	public function test_save_preserves_persisted_doc_for_capable_user() {
		wp_set_current_user( self::$editor_id );

		$html    = 'Trusted<script>x()</script>';
		$doc     = $this->build_block_doc(
			array(
				array(
					'name'     => 'core/paragraph',
					'richText' => array( 'content' => $html ),
				),
			),
			810
		);
		$payload = $this->serialize_persisted_doc( $doc );

		$response = $this->dispatch_save( $this->editor_room(), $payload );

		$this->assertSame( 200, $response->get_status() );
		// Stored verbatim for capable users.
		$this->assertSame( $payload, get_post_meta( self::$editor_post_id, '_crdt_document', true ) );
		$this->assertSame( $html, $this->persisted_doc_content( self::$editor_post_id ) );
	}

	public function test_save_rejects_malformed_doc_for_incapable_user() {
		wp_set_current_user( self::$author_id );

		$response = $this->dispatch_save( $this->author_room(), 'not-a-json-payload' );

		$this->assertErrorResponse( 'rest_crdt_save_failed', $response, 400 );
	}

	/*
	 * Required abstract method implementations (single POST endpoints, not CRUD).
	 */

	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wp-sync/v1/updates', $routes );
		$this->assertArrayHasKey( '/wp-sync/v1/save', $routes );
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {}
}
