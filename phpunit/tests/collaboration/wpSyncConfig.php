<?php
/**
 * Tests for the WP_Sync_Config class.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_WpSyncConfig extends WP_UnitTestCase {

	protected static int $editor_id;
	protected static int $subscriber_id;
	protected static int $post_id;
	protected static int $page_id;
	protected static int $category_id;
	protected static int $tag_id;
	protected static int $comment_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$post_id       = $factory->post->create(
			array(
				'post_author' => self::$editor_id,
				'post_type'   => 'post',
			)
		);
		self::$page_id       = $factory->post->create(
			array(
				'post_author' => self::$editor_id,
				'post_type'   => 'page',
			)
		);
		self::$category_id   = $factory->category->create();
		self::$tag_id        = $factory->tag->create();
		self::$comment_id    = $factory->comment->create( array( 'comment_post_ID' => self::$post_id ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$subscriber_id );
		wp_delete_post( self::$post_id, true );
		wp_delete_post( self::$page_id, true );
		wp_delete_term( self::$category_id, 'category' );
		wp_delete_term( self::$tag_id, 'post_tag' );
		wp_delete_comment( self::$comment_id, true );
	}

	public function test_parse_room_for_single_entity() {
		$this->assertSame(
			array(
				'entity_kind' => 'postType',
				'entity_name' => 'post',
				'object_id'   => '100',
			),
			WP_Sync_Config::parse_room( 'postType/post:100' )
		);
	}

	public function test_parse_room_for_collection() {
		$this->assertSame(
			array(
				'entity_kind' => 'taxonomy',
				'entity_name' => 'category',
				'object_id'   => null,
			),
			WP_Sync_Config::parse_room( 'taxonomy/category' )
		);
	}

	/**
	 * @dataProvider data_invalid_room_identifiers
	 *
	 * @param string $room Room identifier.
	 */
	public function test_parse_room_rejects_invalid_room_identifiers( string $room ) {
		$this->assertNull( WP_Sync_Config::parse_room( $room ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{0:string}>
	 */
	public function data_invalid_room_identifiers(): array {
		return array(
			'empty room'          => array( '' ),
			'missing slash'       => array( 'postType-post:100' ),
			'extra slash'         => array( 'postType/post/extra:100' ),
			'empty entity kind'   => array( '/post:100' ),
			'empty entity name'   => array( 'postType/:100' ),
			'empty object id'     => array( 'postType/post:' ),
			'missing entity name' => array( 'postType/' ),
		);
	}

	public function test_can_user_sync_single_post_entity() {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'post', (string) self::$post_id ) );
	}

	public function test_can_user_sync_single_page_entity() {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'page', (string) self::$page_id ) );
	}

	public function test_can_user_sync_single_post_entity_requires_edit_permission() {
		wp_set_current_user( self::$subscriber_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'post', (string) self::$post_id ) );
	}

	/**
	 * @dataProvider data_invalid_post_entity_ids
	 *
	 * @param string $entity_name Entity name.
	 * @param string $object_id   Object ID.
	 */
	public function test_can_user_sync_single_post_entity_rejects_invalid_ids( string $entity_name, string $object_id ) {
		wp_set_current_user( self::$editor_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'postType', $entity_name, $object_id ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{0:string, 1:string}>
	 */
	public function data_invalid_post_entity_ids(): array {
		return array(
			'nonnumeric id'       => array( 'post', 'abc' ),
			'zero id'             => array( 'post', '0' ),
			'nonexistent post id' => array( 'post', '999999' ),
		);
	}

	public function test_can_user_sync_single_post_entity_rejects_wrong_post_type() {
		wp_set_current_user( self::$editor_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'page', (string) self::$post_id ) );
	}

	public function test_can_user_sync_post_type_collection() {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'post', null ) );
	}

	public function test_can_user_sync_page_collection() {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'page', null ) );
	}

	public function test_can_user_sync_post_type_collection_requires_collection_capability() {
		wp_set_current_user( self::$subscriber_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'postType', 'post', null ) );
	}

	public function test_can_user_sync_single_taxonomy_term() {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( 'taxonomy', 'category', (string) self::$category_id ) );
	}

	/**
	 * @dataProvider data_invalid_taxonomy_term_ids
	 *
	 * @param string $taxonomy  Taxonomy name.
	 * @param string $object_id Object ID.
	 */
	public function test_can_user_sync_single_taxonomy_term_rejects_invalid_ids( string $taxonomy, string $object_id ) {
		wp_set_current_user( self::$editor_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'taxonomy', $taxonomy, $object_id ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{0:string, 1:string}>
	 */
	public function data_invalid_taxonomy_term_ids(): array {
		return array(
			'nonnumeric id'       => array( 'category', 'abc' ),
			'zero id'             => array( 'category', '0' ),
			'nonexistent term id' => array( 'category', '999999' ),
		);
	}

	public function test_can_user_sync_single_taxonomy_term_rejects_wrong_taxonomy() {
		wp_set_current_user( self::$editor_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'taxonomy', 'category', (string) self::$tag_id ) );
	}

	public function test_can_user_sync_single_comment_entity() {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( 'root', 'comment', (string) self::$comment_id ) );
	}

	/**
	 * @dataProvider data_collection_entity_types
	 *
	 * @param string $entity_kind Entity kind.
	 * @param string $entity_name Entity name.
	 */
	public function test_can_user_sync_allowed_collections( string $entity_kind, string $entity_name ) {
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( WP_Sync_Config::can_user_sync_entity_type( $entity_kind, $entity_name, null ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{0:string, 1:string}>
	 */
	public function data_collection_entity_types(): array {
		return array(
			'post type collection' => array( 'postType', 'post' ),
			'taxonomy collection'  => array( 'taxonomy', 'category' ),
			'root collection'      => array( 'root', 'site' ),
		);
	}

	public function test_can_user_sync_rejects_unknown_collection_entity_type() {
		wp_set_current_user( self::$editor_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'unknown', 'entity', null ) );
	}

	public function test_can_user_sync_rejects_object_id_for_unsupported_single_entity_type() {
		wp_set_current_user( self::$editor_id );

		$this->assertFalse( WP_Sync_Config::can_user_sync_entity_type( 'root', 'site', '123' ) );
	}

	public function test_supports_crdt_doc_persistence_for_single_post_entity() {
		$this->assertTrue( WP_Sync_Config::supports_crdt_doc_persistence( 'postType', 'post', (string) self::$post_id ) );
	}

	public function test_supports_crdt_doc_persistence_for_single_page_entity() {
		$this->assertTrue( WP_Sync_Config::supports_crdt_doc_persistence( 'postType', 'page', (string) self::$page_id ) );
	}

	/**
	 * @dataProvider data_rooms_without_crdt_doc_persistence
	 *
	 * @param string      $entity_kind Entity kind.
	 * @param string      $entity_name Entity name.
	 * @param string|null $object_id   Object ID.
	 */
	public function test_supports_crdt_doc_persistence_rejects_unsupported_rooms( string $entity_kind, string $entity_name, ?string $object_id ) {
		$this->assertFalse( WP_Sync_Config::supports_crdt_doc_persistence( $entity_kind, $entity_name, $object_id ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<string, array{0:string, 1:string, 2:string|null}>
	 */
	public function data_rooms_without_crdt_doc_persistence(): array {
		return array(
			'post type collection' => array( 'postType', 'post', null ),
			'nonnumeric post id'   => array( 'postType', 'post', 'abc' ),
			'zero post id'         => array( 'postType', 'post', '0' ),
			'root collection'      => array( 'root', 'site', null ),
		);
	}

	public function test_supports_crdt_doc_persistence_rejects_wrong_post_type() {
		$this->assertFalse( WP_Sync_Config::supports_crdt_doc_persistence( 'postType', 'page', (string) self::$post_id ) );
	}

	public function test_supports_crdt_doc_persistence_rejects_taxonomy_term() {
		$this->assertFalse( WP_Sync_Config::supports_crdt_doc_persistence( 'taxonomy', 'category', (string) self::$category_id ) );
	}

	public function test_get_crdt_doc_persistence_post_id_returns_post_id_for_supported_room() {
		$this->assertSame(
			self::$post_id,
			WP_Sync_Config::get_crdt_doc_persistence_post_id( 'postType', 'post', (string) self::$post_id )
		);
	}

	public function test_get_crdt_doc_persistence_post_id_returns_page_id_for_supported_post_type_room() {
		$this->assertSame(
			self::$page_id,
			WP_Sync_Config::get_crdt_doc_persistence_post_id( 'postType', 'page', (string) self::$page_id )
		);
	}

	public function test_get_crdt_doc_persistence_post_id_returns_null_for_unsupported_room() {
		$this->assertNull(
			WP_Sync_Config::get_crdt_doc_persistence_post_id( 'taxonomy', 'category', (string) self::$category_id )
		);
	}
}
