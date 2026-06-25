<?php
/**
 * Tests for persisted CRDT document post meta freshness checks.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_PersistedCrdtDocumentMeta extends WP_UnitTestCase {

	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();
		delete_post_meta( self::$post_id, '_crdt_document' );
	}

	/**
	 * Creates a persisted CRDT document meta value.
	 *
	 * @param string      $document     Document payload.
	 * @param string|null $base_version Optional base version.
	 * @return string Persisted CRDT document meta value.
	 */
	private function create_crdt_document_meta_value( string $document, ?string $base_version = null ): string {
		$value = array(
			'document' => $document,
			'updateId' => 123,
		);

		if ( null !== $base_version ) {
			$value['baseVersion'] = $base_version;
		}

		return wp_json_encode( $value );
	}

	public function test_allows_update_when_base_version_matches_current_document(): void {
		$meta_key      = '_crdt_document';
		$current_value = $this->create_crdt_document_meta_value( 'current-document' );
		$this->assertNotFalse( update_post_meta( self::$post_id, $meta_key, $current_value ) );

		$base_version = gutenberg_get_persisted_crdt_document_version( $current_value );
		$next_value   = $this->create_crdt_document_meta_value( 'next-document', $base_version );

		$this->assertNotFalse( update_post_meta( self::$post_id, $meta_key, $next_value ) );
		$this->assertSame( $next_value, get_post_meta( self::$post_id, $meta_key, true ) );
	}

	public function test_rejects_update_when_base_version_is_stale(): void {
		$meta_key      = '_crdt_document';
		$current_value = $this->create_crdt_document_meta_value( 'current-document' );
		$old_value     = $this->create_crdt_document_meta_value( 'old-document' );
		$this->assertNotFalse( update_post_meta( self::$post_id, $meta_key, $current_value ) );

		$stale_base_version = gutenberg_get_persisted_crdt_document_version( $old_value );
		$stale_value        = $this->create_crdt_document_meta_value( 'stale-document', $stale_base_version );

		$this->assertFalse( update_post_meta( self::$post_id, $meta_key, $stale_value ) );
		$this->assertSame( $current_value, get_post_meta( self::$post_id, $meta_key, true ) );
	}

	public function test_rejects_update_without_base_version_when_current_document_differs(): void {
		$meta_key      = '_crdt_document';
		$current_value = $this->create_crdt_document_meta_value( 'current-document' );
		$stale_value   = $this->create_crdt_document_meta_value( 'stale-document' );
		$this->assertNotFalse( update_post_meta( self::$post_id, $meta_key, $current_value ) );

		$this->assertFalse( update_post_meta( self::$post_id, $meta_key, $stale_value ) );
		$this->assertSame( $current_value, get_post_meta( self::$post_id, $meta_key, true ) );
	}

	public function test_restore_revision_removes_persisted_crdt_document_meta(): void {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => '<!-- wp:paragraph --><p>Original content</p><!-- /wp:paragraph -->',
				'post_title'   => 'Original title',
			)
		);

		$original_value = $this->create_crdt_document_meta_value( 'original-document' );
		$this->assertNotFalse( update_post_meta( $post_id, '_crdt_document', $original_value ) );

		$revision_id = wp_save_post_revision( $post_id );
		$this->assertIsInt( $revision_id );
		$this->assertGreaterThan( 0, $revision_id );

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => '<!-- wp:paragraph --><p>New content</p><!-- /wp:paragraph -->',
				'post_title'   => 'New title',
			)
		);

		$base_version = gutenberg_get_persisted_crdt_document_version( $original_value );
		$new_value    = $this->create_crdt_document_meta_value( 'new-document', $base_version );
		$this->assertNotFalse( update_post_meta( $post_id, '_crdt_document', $new_value ) );

		$this->assertIsInt( wp_restore_post_revision( $revision_id ) );

		$this->assertSame( '', get_post_meta( $post_id, '_crdt_document', true ) );

		wp_delete_post( $post_id, true );
	}
}
