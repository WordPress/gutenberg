<?php
/**
 * Tests for emoji reactions targeting blocks.
 *
 * @package gutenberg
 * @group block-reactions
 */
class Block_Reactions_Test extends WP_Test_REST_TestCase {
	protected static $editor_id;
	protected static $other_editor_id;
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id       = $factory->user->create( array( 'role' => 'editor' ) );
		self::$other_editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id   = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		self::delete_user( self::$other_editor_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Inserts an approved block reaction row directly, bypassing REST.
	 *
	 * @param int    $post_id Post the block belongs to.
	 * @param string $anchor  Block anchor (`metadata.reactionsId`).
	 * @param int    $user_id Reacting user.
	 * @param string $slug    Reaction storage slug.
	 * @return int Reaction comment ID.
	 */
	protected function insert_block_reaction( $post_id, $anchor, $user_id, $slug = 'heart' ) {
		return wp_insert_comment(
			array(
				'comment_post_ID'  => $post_id,
				'comment_parent'   => 0,
				'comment_type'     => 'reaction',
				'comment_content'  => $slug,
				'comment_approved' => 1,
				'user_id'          => $user_id,
				'comment_meta'     => array( '_wp_reaction_block' => $anchor ),
			)
		);
	}

	public function test_reaction_block_meta_is_registered() {
		$registered = get_registered_meta_keys( 'comment' );

		$this->assertArrayHasKey( '_wp_reaction_block', $registered );
		$this->assertSame( 'string', $registered['_wp_reaction_block']['type'] );
		$this->assertTrue( $registered['_wp_reaction_block']['single'] );
		$this->assertFalse( $registered['_wp_reaction_block']['show_in_rest'] );
	}

	/**
	 * @dataProvider data_reaction_block_anchors
	 *
	 * @param string $anchor   Anchor to sanitize.
	 * @param string $expected Sanitized value.
	 */
	public function test_reaction_block_meta_sanitizes_invalid_anchor_to_empty( $anchor, $expected ) {
		$this->assertSame( $expected, sanitize_meta( '_wp_reaction_block', $anchor, 'comment' ) );
	}

	public function data_reaction_block_anchors() {
		return array(
			'valid'         => array( 'abc123xy', 'abc123xy' ),
			'six chars'     => array( 'abcdef', 'abcdef' ),
			'sixteen chars' => array( '0123456789abcdef', '0123456789abcdef' ),
			'uppercase'     => array( 'ABCDEF12', '' ),
			'too short'     => array( 'abc12', '' ),
			'too long'      => array( '0123456789abcdefg', '' ),
			'hyphen'        => array( 'abc-1234', '' ),
			'empty'         => array( '', '' ),
		);
	}

	/**
	 * @dataProvider data_reaction_targets
	 *
	 * @param array       $args     Resolver arguments (post is substituted).
	 * @param string|null $expected Expected target type, or the expected error code.
	 */
	public function test_resolve_reaction_target( $args, $expected ) {
		wp_set_current_user( self::$editor_id );
		$post_id       = self::factory()->post->create();
		$other_post_id = self::factory()->post->create();
		$note_id       = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);
		$comment_id    = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'comment',
			)
		);
		$other_note_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => $other_post_id,
				'comment_type'    => 'note',
			)
		);

		$ids = compact( 'post_id', 'note_id', 'comment_id', 'other_note_id' );
		foreach ( $args as $key => $value ) {
			if ( is_string( $value ) && isset( $ids[ $value ] ) ) {
				$args[ $key ] = $ids[ $value ];
			}
		}
		$args['post'] = $post_id;

		$target = gutenberg_resolve_reaction_target( $args );

		if ( str_starts_with( $expected, 'rest_' ) ) {
			$this->assertWPError( $target );
			$this->assertSame( $expected, $target->get_error_code() );
			return;
		}

		$this->assertIsArray( $target );
		$this->assertSame( $expected, $target['type'] );
		$this->assertSame( $post_id, $target['post_id'] );
		if ( 'block' === $expected ) {
			$this->assertSame( 0, $target['parent'] );
			$this->assertSame( $args['block'], $target['block'] );
		} else {
			$this->assertSame( $args['parent'], $target['parent'] );
			$this->assertSame( '', $target['block'] );
		}
	}

	public function data_reaction_targets() {
		return array(
			'note parent'           => array( array( 'parent' => 'note_id' ), 'comment' ),
			'block anchor'          => array( array( 'block' => 'abc123xy' ), 'block' ),
			'both parent and block' => array(
				array(
					'parent' => 'note_id',
					'block'  => 'abc123xy',
				),
				'rest_comment_invalid_reaction_target',
			),
			'neither'               => array( array(), 'rest_comment_invalid_reaction_target' ),
			'parent is a comment'   => array( array( 'parent' => 'comment_id' ), 'rest_comment_invalid_parent' ),
			'parent on other post'  => array( array( 'parent' => 'other_note_id' ), 'rest_comment_invalid_parent' ),
			'bad anchor'            => array( array( 'block' => 'NOPE' ), 'rest_comment_invalid_block' ),
		);
	}

	public function test_reaction_target_query_args_for_block_scopes_by_post_and_meta() {
		$args = gutenberg_get_reaction_target_query_args(
			array(
				'type'    => 'block',
				'post_id' => 42,
				'parent'  => 0,
				'block'   => 'abc123xy',
			),
			array( 'status' => 'approve' )
		);

		$this->assertSame( 42, $args['post_id'] );
		$this->assertSame( 0, $args['parent'] );
		$this->assertSame( 'reaction', $args['type'] );
		$this->assertSame( '_wp_reaction_block', $args['meta_key'] );
		$this->assertSame( 'abc123xy', $args['meta_value'] );
		$this->assertSame( 'approve', $args['status'] );

		$note_args = gutenberg_get_reaction_target_query_args(
			array(
				'type'    => 'comment',
				'post_id' => 42,
				'parent'  => 7,
				'block'   => '',
			)
		);
		$this->assertSame( 7, $note_args['parent'] );
		$this->assertArrayNotHasKey( 'meta_key', $note_args );
	}

	public function test_get_block_reaction_summary_shape() {
		$post_id = self::factory()->post->create();
		$mine    = $this->insert_block_reaction( $post_id, 'blockaaa', self::$editor_id, 'heart' );
		$this->insert_block_reaction( $post_id, 'blockaaa', self::$other_editor_id, 'heart' );
		$this->insert_block_reaction( $post_id, 'blockbbb', self::$other_editor_id, 'rocket' );

		$summary = gutenberg_get_block_reaction_summary( $post_id, self::$editor_id );

		$this->assertSame(
			array(
				'blockaaa' => array(
					'heart' => array(
						'count'          => 2,
						'reacted'        => true,
						'my_reaction_id' => $mine,
					),
				),
				'blockbbb' => array(
					'rocket' => array(
						'count'          => 1,
						'reacted'        => false,
						'my_reaction_id' => 0,
					),
				),
			),
			$summary
		);
	}

	public function test_get_block_reaction_summary_excludes_trashed() {
		$post_id     = self::factory()->post->create();
		$reaction_id = $this->insert_block_reaction( $post_id, 'blockaaa', self::$editor_id );
		wp_trash_comment( $reaction_id );

		$this->assertSame( array(), gutenberg_get_block_reaction_summary( $post_id, self::$editor_id ) );
	}

	public function test_get_block_reaction_summary_excludes_note_reactions() {
		$post_id = self::factory()->post->create();
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);
		wp_insert_comment(
			array(
				'comment_post_ID'  => $post_id,
				'comment_parent'   => $note_id,
				'comment_type'     => 'reaction',
				'comment_content'  => 'heart',
				'comment_approved' => 1,
				'user_id'          => self::$editor_id,
			)
		);

		$this->assertSame( array(), gutenberg_get_block_reaction_summary( $post_id, self::$editor_id ) );
	}

	public function test_post_response_includes_block_reaction_summary_in_edit_context() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$mine    = $this->insert_block_reaction( $post_id, 'blockaaa', self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'block_reaction_summary', $data );
		$this->assertSame(
			array(
				'blockaaa' => array(
					'heart' => array(
						'count'          => 1,
						'reacted'        => true,
						'my_reaction_id' => $mine,
					),
				),
			),
			$data['block_reaction_summary']
		);
	}

	public function test_post_response_omits_block_reaction_summary_in_view_context() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$this->insert_block_reaction( $post_id, 'blockaaa', self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'block_reaction_summary', $response->get_data() );
	}

	/**
	 * Core-data shares one record cache between single and collection
	 * responses, so a placeholder here would erase the edited post's summary.
	 */
	public function test_posts_collection_omits_block_reaction_summary() {
		wp_set_current_user( self::$editor_id );
		$post_id = self::factory()->post->create();
		$this->insert_block_reaction( $post_id, 'blockaaa', self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts' );
		$request->set_param( 'context', 'edit' );
		$request->set_param( 'include', array( $post_id ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertCount( 1, $data );
		$this->assertArrayNotHasKey( 'block_reaction_summary', $data[0] );
	}

	public function test_block_reaction_summary_not_registered_for_media() {
		wp_set_current_user( self::$editor_id );
		$attachment_id = self::factory()->attachment->create_object(
			'image.jpg',
			0,
			array(
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
			)
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $attachment_id );
		$request->set_param( 'context', 'edit' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'block_reaction_summary', $response->get_data() );
	}

	public function test_deleting_post_removes_block_reactions_and_meta() {
		$post_id     = self::factory()->post->create();
		$reaction_id = $this->insert_block_reaction( $post_id, 'blockaaa', self::$editor_id );
		$this->assertSame( 'blockaaa', get_comment_meta( $reaction_id, '_wp_reaction_block', true ) );

		wp_delete_post( $post_id, true );

		$this->assertNull( get_comment( $reaction_id ) );
		$this->assertSame( '', get_comment_meta( $reaction_id, '_wp_reaction_block', true ) );
	}
}
