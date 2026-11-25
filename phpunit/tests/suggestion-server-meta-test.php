<?php
/**
 * Tests that the note meta only the server writes cannot be written by a
 * caller outside REST, where no `auth_callback` is consulted: the wp-admin
 * comment edit screen hands its `comment_meta` to `wp_update_comment()`.
 *
 * @group suggestions
 */
class Tests_Suggestion_Server_Meta extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $contributor_id;

	/**
	 * @var int
	 */
	private static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
		$post_id        = $factory->post->create(
			array(
				'post_author' => $contributor_id,
				'post_status' => 'draft',
			)
		);
		self::assertIsInt( $contributor_id );
		self::assertIsInt( $post_id );
		self::$contributor_id = $contributor_id;
		self::$post_id        = $post_id;
	}

	public function set_up(): void {
		parent::set_up();
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$contributor_id );
	}

	/**
	 * @return positive-int Note ID.
	 */
	private function create_note(): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$contributor_id,
			)
		);
		if ( ! is_int( $note_id ) || $note_id < 1 ) {
			self::fail( 'The note was not created.' );
		}
		return $note_id;
	}

	/**
	 * @return array<string, array{0: string, 1: mixed}>
	 */
	public function data_server_only_meta(): array {
		return array(
			'stored proposals'   => array( '_wp_suggestion_content', '{"v":1,"items":[{"kind":"block","run":0,"anchor":"","original":"<!-- wp:html --><script>alert(1)</script><!-- /wp:html -->"}]}' ),
			'decided by'         => array( '_wp_suggestion_decided_by', 1 ),
			'resolved by'        => array( '_wp_suggestion_resolved_by', 1 ),
			'extraction skipped' => array( '_wp_suggestion_extraction_skipped', true ),
		);
	}

	/**
	 * @dataProvider data_server_only_meta
	 *
	 * @param string $meta_key   Meta key.
	 * @param mixed  $meta_value Meta value.
	 */
	public function test_comment_update_cannot_write_server_only_meta( string $meta_key, $meta_value ): void {
		$note_id = $this->create_note();
		$this->assertTrue( current_user_can( 'edit_comment', $note_id ), 'The note author can reach the comment edit screen.' );

		// What `edit_comment()` does with the posted form.
		wp_update_comment(
			wp_slash(
				array(
					'comment_ID'   => $note_id,
					'comment_meta' => array( $meta_key => $meta_value ),
				)
			)
		);

		$this->assertSame( array(), get_comment_meta( $note_id, $meta_key ) );
	}

	/**
	 * @dataProvider data_server_only_meta
	 *
	 * @param string $meta_key   Meta key.
	 * @param mixed  $meta_value Meta value.
	 */
	public function test_comment_insert_cannot_write_server_only_meta( string $meta_key, $meta_value ): void {
		$note_id = wp_insert_comment(
			wp_slash(
				array(
					'comment_post_ID'  => self::$post_id,
					'comment_type'     => 'note',
					'comment_approved' => '0',
					'user_id'          => self::$contributor_id,
					'comment_meta'     => array( $meta_key => $meta_value ),
				)
			)
		);

		$this->assertIsInt( $note_id );
		$this->assertSame( array(), get_comment_meta( $note_id, $meta_key ) );
	}

	/**
	 * @dataProvider data_server_only_meta
	 *
	 * @param string $meta_key   Meta key.
	 * @param mixed  $meta_value Meta value.
	 */
	public function test_server_writes_and_deletes_server_only_meta( string $meta_key, $meta_value ): void {
		$note_id = $this->create_note();

		$this->assertTrue( gutenberg_update_suggestion_server_meta( $note_id, $meta_key, is_string( $meta_value ) ? wp_slash( $meta_value ) : $meta_value ) );
		$this->assertEquals( $meta_value, get_comment_meta( $note_id, $meta_key, true ) );

		$this->assertFalse( delete_comment_meta( $note_id, $meta_key ), 'Only the server deletes it.' );
		$this->assertEquals( $meta_value, get_comment_meta( $note_id, $meta_key, true ) );

		$this->assertTrue( gutenberg_delete_suggestion_server_meta( $note_id, $meta_key ) );
		$this->assertSame( array(), get_comment_meta( $note_id, $meta_key ) );
	}

	public function test_server_write_does_not_leave_the_meta_writable(): void {
		$note_id = $this->create_note();
		gutenberg_update_suggestion_server_meta( $note_id, '_wp_suggestion_resolved_by', 1 );

		$this->assertFalse( update_comment_meta( $note_id, '_wp_suggestion_resolved_by', 2 ) );
		$this->assertSame( '1', get_comment_meta( $note_id, '_wp_suggestion_resolved_by', true ) );
	}

	public function test_other_comment_meta_is_unaffected(): void {
		$note_id = $this->create_note();

		wp_update_comment(
			array(
				'comment_ID'   => $note_id,
				'comment_meta' => array( 'some_plugin_key' => 'value' ),
			)
		);

		$this->assertSame( 'value', get_comment_meta( $note_id, 'some_plugin_key', true ) );
	}

	/**
	 * @param array<string, mixed> $operation A post-level operation.
	 */
	private function post_field_payload( array $operation ): string {
		return (string) wp_json_encode(
			array(
				'schemaVersion' => 2,
				'operations'    => array( array_merge( array( 'type' => 'post-attribute-set' ), $operation ) ),
			)
		);
	}

	public function test_comment_update_cannot_suggest_a_post_field_rest_refuses(): void {
		$note_id = $this->create_note();

		wp_update_comment(
			wp_slash(
				array(
					'comment_ID'   => $note_id,
					'comment_meta' => array(
						'_wp_suggestion' => $this->post_field_payload(
							array(
								'attribute' => 'status',
								'before'    => 'draft',
								'after'     => 'publish',
							)
						),
					),
				)
			)
		);

		$this->assertSame( array(), get_comment_meta( $note_id, '_wp_suggestion' ) );
	}

	public function test_comment_update_stores_a_suggested_post_field_sanitized(): void {
		$note_id = $this->create_note();

		wp_update_comment(
			wp_slash(
				array(
					'comment_ID'   => $note_id,
					'comment_meta' => array(
						'_wp_suggestion' => $this->post_field_payload(
							array(
								'attribute' => 'slug',
								'before'    => 'old',
								'after'     => 'New Slug!',
							)
						),
					),
				)
			)
		);

		$stored = get_comment_meta( $note_id, '_wp_suggestion', true );
		$this->assertIsString( $stored );
		$this->assertSame(
			array(
				'schemaVersion' => 2,
				'operations'    => array(
					array(
						'type'      => 'post-attribute-set',
						'attribute' => 'slug',
						'before'    => 'old',
						'after'     => 'new-slug',
					),
				),
			),
			json_decode( $stored, true )
		);
	}

	public function test_a_block_suggestion_is_stored_outside_rest(): void {
		$note_id = $this->create_note();
		$payload = '{"schemaVersion":2,"operations":[{"type":"attribute-set","attribute":"level","before":2,"after":3}]}';

		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( $payload ) );

		$this->assertSame( $payload, get_comment_meta( $note_id, '_wp_suggestion', true ) );
	}
}
