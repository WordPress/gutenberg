<?php
/**
 * Tests for several authors' suggestions on one block: the save pass anchors
 * each suggestion nested on a block's marker by its own note, outdates one a
 * decision left without an anchor, and outdates a post field proposal an
 * accepted one left with nothing to change.
 *
 * @group suggestions
 */
class Tests_Suggestion_Block_Overlap extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $editor_id;

	/**
	 * @var int
	 */
	private static $anne_id;

	/**
	 * @var int
	 */
	private static $bob_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		self::$editor_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$anne_id   = $factory->user->create( array( 'role' => 'editor' ) );
		self::$bob_id    = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public function set_up(): void {
		parent::set_up();
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$editor_id );
	}

	/**
	 * @param int                              $post_id    Post ID.
	 * @param array<int, array<string, mixed>> $operations Payload operations.
	 * @param int                              $author     Note author.
	 * @param string                           $status     `_wp_suggestion_status`, or '' for none.
	 * @return int Note ID.
	 */
	private function create_note( int $post_id, array $operations, int $author, string $status = '' ): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'comment_parent'   => 0,
				'user_id'          => $author,
			)
		);
		update_comment_meta( $note_id, '_wp_suggestion', wp_json_encode( array( 'operations' => $operations ) ) );
		if ( '' !== $status ) {
			update_comment_meta( $note_id, '_wp_suggestion_status', $status );
		}
		return (int) $note_id;
	}

	/**
	 * @param array<string, mixed> $suggestion `metadata.suggestion`.
	 * @param int[]                $note_ids   `metadata.noteId`.
	 * @return string Heading block markup.
	 */
	private function heading( array $suggestion, array $note_ids ): string {
		$attrs = wp_json_encode(
			array(
				'metadata' => array(
					'noteId'     => $note_ids,
					'suggestion' => $suggestion,
				),
			)
		);
		return '<!-- wp:heading ' . $attrs . " -->\n<h2 class=\"wp-block-heading\">T</h2>\n<!-- /wp:heading -->";
	}

	private function create_post( string $content = '' ): int {
		return (int) self::factory()->post->create(
			array(
				'post_content' => $content,
				'post_author'  => self::$editor_id,
			)
		);
	}

	private function set_content( int $post_id, string $content ): void {
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => wp_slash( $content ),
			)
		);
	}

	private function status_of( int $note_id ): string {
		$status = get_comment_meta( $note_id, '_wp_suggestion_status', true );
		return is_string( $status ) ? $status : '';
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	private function level_op( int $level ): array {
		return array(
			array(
				'type'      => 'attribute-set',
				'attribute' => 'level',
				'after'     => $level,
			),
		);
	}

	public function test_anchor_index_anchors_a_nested_suggestion_by_its_own_note(): void {
		$content = $this->heading(
			array(
				'type'      => 'pending-insert',
				'commentId' => 12,
				'nested'    => array(
					array(
						'type'      => 'pending-remove',
						'commentId' => 15,
					),
					array(
						'type'      => 'pending-attributes',
						'commentId' => 18,
						'after'     => array( 'level' => 3 ),
					),
				),
			),
			array( 12, 15, 18, 20 )
		);

		$index = gutenberg_get_suggestion_anchor_index( $content );

		$this->assertSame( array( 'pending-insert' => true ), $index[12] );
		$this->assertSame( array( 'pending-remove' => true ), $index[15] );
		$this->assertSame( array( 'pending-attributes' => true ), $index[18] );
		$this->assertArrayNotHasKey( 20, $index, 'A note link no marker claims anchors nothing once the marker has its note.' );
	}

	public function test_anchor_index_falls_back_to_note_links_for_a_marker_without_its_note(): void {
		$index = gutenberg_get_suggestion_anchor_index(
			$this->heading(
				array(
					'type'  => 'pending-move',
					'after' => array( 'level' => 3 ),
				),
				array( 12 )
			)
		);

		$this->assertSame(
			array(
				'pending-move'       => true,
				'pending-attributes' => true,
			),
			$index[12]
		);
	}

	public function test_a_nested_proposal_a_decision_dropped_becomes_outdated(): void {
		$post_id = $this->create_post();
		$anne    = $this->create_note( $post_id, $this->level_op( 3 ), self::$anne_id, 'applied-unsaved' );
		$bob     = $this->create_note( $post_id, $this->level_op( 3 ), self::$bob_id );
		$this->set_content(
			$post_id,
			$this->heading(
				array(
					'type'      => 'pending-attributes',
					'authorId'  => self::$anne_id,
					'commentId' => $anne,
					'after'     => array( 'level' => 3 ),
					'nested'    => array(
						array(
							'type'      => 'pending-attributes',
							'authorId'  => self::$bob_id,
							'commentId' => $bob,
							'after'     => array( 'level' => 3 ),
						),
					),
				),
				array( $anne, $bob )
			)
		);
		$this->assertSame( 'applied-unsaved', $this->status_of( $anne ) );
		$this->assertSame( '', $this->status_of( $bob ) );

		// Anne's level 3 is accepted; Bob's identical proposal is dropped with it.
		$this->set_content( $post_id, '<!-- wp:heading {"level":3,"metadata":{"noteId":[' . $anne . ',' . $bob . ']}} -->' . "\n<h3 class=\"wp-block-heading\">T</h3>\n<!-- /wp:heading -->" );

		$this->assertSame( 'applied', $this->status_of( $anne ) );
		$this->assertSame( 'outdated', $this->status_of( $bob ) );
	}

	public function test_a_nested_suggestion_still_on_the_block_stays_pending(): void {
		$post_id = $this->create_post();
		$anne    = $this->create_note(
			$post_id,
			array(
				array(
					'type'     => 'block-insert-after',
					'clientId' => 'x',
				),
			),
			self::$anne_id,
			'applied-unsaved'
		);
		$bob     = $this->create_note(
			$post_id,
			array(
				array(
					'type'     => 'block-remove',
					'clientId' => 'x',
				),
			),
			self::$bob_id
		);
		$this->set_content(
			$post_id,
			$this->heading(
				array(
					'type'      => 'pending-insert',
					'commentId' => $anne,
					'nested'    => array(
						array(
							'type'      => 'pending-remove',
							'commentId' => $bob,
						),
					),
				),
				array( $anne, $bob )
			)
		);

		// Anne's insertion is accepted: Bob's removal takes the marker's place.
		$this->set_content(
			$post_id,
			$this->heading(
				array(
					'type'      => 'pending-remove',
					'commentId' => $bob,
				),
				array( $anne, $bob )
			)
		);

		$this->assertSame( 'applied', $this->status_of( $anne ) );
		$this->assertSame( '', $this->status_of( $bob ) );
	}

	public function test_a_title_proposal_an_accepted_one_already_holds_becomes_outdated(): void {
		$post_id = $this->create_post( "<!-- wp:paragraph -->\n<p>Body</p>\n<!-- /wp:paragraph -->" );
		$title   = static function ( string $after ): array {
			return array(
				array(
					'type'      => 'post-attribute-set',
					'attribute' => 'title',
					'after'     => $after,
				),
			);
		};
		$anne    = $this->create_note( $post_id, $title( 'Better title' ), self::$anne_id, 'applied-unsaved' );
		$bob     = $this->create_note( $post_id, $title( 'Better title' ), self::$bob_id );
		$carl    = $this->create_note( $post_id, $title( 'Another title' ), self::$bob_id );

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Better title',
			)
		);

		$this->assertSame( 'applied', $this->status_of( $anne ) );
		$this->assertSame( 'outdated', $this->status_of( $bob ) );
		$this->assertSame( '', $this->status_of( $carl ), 'A proposal that still changes the title stays pending.' );
	}
}
