<?php
/**
 * Tests the server side of formatting suggestions recorded as deltas: stacked
 * formatting changes on the same words and one crossing the edge of an
 * addition render their original character by character, and the payload
 * sanitizer keeps only a well-formed delta.
 *
 * @group suggestions
 */
class Tests_Suggestion_Format_Delta extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $editor_id;

	/**
	 * @var int
	 */
	private static $author_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	public function set_up(): void {
		parent::set_up();
		gutenberg_register_suggestion_meta();
	}

	public function tear_down(): void {
		$GLOBALS['gutenberg_suggestion_content_owners'] = array();
		$GLOBALS['gutenberg_suggestion_owner_frames']   = array();
		parent::tear_down();
	}

	private static function mark( int $id, string $kind, string $html ): string {
		return '<mark data-suggestion-id="' . $id . '" data-suggestion-type="' . $kind . '" data-author="1" class="wp-suggestion-' . $kind . '">' . $html . '</mark>';
	}

	/**
	 * Creates a pending formatting note on a post.
	 *
	 * @param int    $post_id     Post ID.
	 * @param string $before_html Recorded original.
	 * @return int Note ID.
	 */
	private function create_format_note( int $post_id, string $before_html ): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$editor_id,
			)
		);
		$payload = array(
			'operations' => array(
				array(
					'type'           => 'inline-suggestion',
					'attribute'      => 'content',
					'suggestionType' => 'format',
					'beforeHTML'     => $before_html,
				),
			),
		);
		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( (string) wp_json_encode( $payload ) ) );
		return $note_id;
	}

	/**
	 * Renders a paragraph as the given post's content.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $inner   Paragraph HTML.
	 * @return string Rendered HTML.
	 */
	private function render( int $post_id, string $inner ): string {
		$content = '<!-- wp:paragraph --><p>' . $inner . '</p><!-- /wp:paragraph -->';
		/** @var wpdb $wpdb */
		global $wpdb;
		$wpdb->update( $wpdb->posts, array( 'post_content' => $content ), array( 'ID' => $post_id ) );
		clean_post_cache( $post_id );
		$GLOBALS['post'] = get_post( $post_id );
		gutenberg_push_suggestion_content_owner( '' );
		$rendered = do_blocks( $content );
		gutenberg_pop_suggestion_content_owner( '' );
		return str_replace( ' class="wp-block-paragraph"', '', trim( $rendered ) );
	}

	public function test_a_change_crossing_an_addition_never_renders_the_added_text(): void {
		$post_id = self::factory()->post->create();
		// The addition (A) is " big"; the formatting change (B) bolds "lo big".
		$add_id    = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
			)
		);
		$format_id = $this->create_format_note( $post_id, 'lo big' );
		$inner     = 'Hel' . self::mark( $format_id, 'format', '<strong>lo</strong>' ) . self::mark( $add_id, 'add', self::mark( $format_id, 'format', '<strong> big</strong>' ) ) . ' world.';

		$this->assertSame( '<p>Hello world.</p>', $this->render( $post_id, $inner ) );
	}

	public function test_stacked_changes_render_the_oldest_original(): void {
		$post_id = self::factory()->post->create();
		// A bolds "word"; B, on top, removes bold and adds italic.
		$older = $this->create_format_note( $post_id, 'word' );
		$newer = $this->create_format_note( $post_id, '<strong>word</strong>' );
		$inner = 'a ' . self::mark( $older, 'format', self::mark( $newer, 'format', '<em>word</em>' ) ) . ' b';

		$this->assertSame( '<p>a word b</p>', $this->render( $post_id, $inner ) );
	}

	public function test_a_change_on_part_of_another_renders_each_original(): void {
		$post_id = self::factory()->post->create();
		// A bolds "abcd"; B italicizes "cd" on top.
		$older = $this->create_format_note( $post_id, 'abcd' );
		$newer = $this->create_format_note( $post_id, '<strong>cd</strong>' );
		$inner = self::mark( $older, 'format', '<strong>ab</strong>' . self::mark( $newer, 'format', '<strong><em>cd</em></strong>' ) ) . 'e';

		$this->assertSame( '<p>abcde</p>', $this->render( $post_id, $inner ) );
	}

	public function test_view_applies_an_accepted_older_change_under_a_pending_one(): void {
		$older = 12;
		$newer = 15;
		$html  = self::mark( $older, 'format', self::mark( $newer, 'format', '<em>word</em>' ) );
		$view  = gutenberg_get_inline_suggestion_view(
			$html,
			array( $older ),
			array(
				$older => 'word',
				$newer => '<strong>word</strong>',
			)
		);

		$this->assertSame( '<strong>word</strong>', $view );
	}

	public function test_revert_replays_an_accepted_change_over_a_pending_one(): void {
		// A (12) bolds "word"; B (15), on top, removes bold and adds italic.
		$html = self::mark( 12, 'format', self::mark( 15, 'format', '<em>word</em>' ) );

		$this->assertSame(
			'<em>word</em>',
			gutenberg_revert_inline_format_suggestions(
				$html,
				array(
					12 => 'word',
					15 => '<strong>word</strong>',
				),
				array( 15 )
			)
		);
	}

	public function test_revert_fails_closed_on_markup_it_does_not_know(): void {
		$html = self::mark( 12, 'format', '<strong>a</strong><div>b</div>' );

		$this->assertNull( gutenberg_revert_inline_format_suggestions( $html, array( 12 => 'ab' ) ) );
	}

	/**
	 * Sanitizes a payload as a user without `unfiltered_html` and returns its
	 * first operation.
	 *
	 * @param array<string, mixed> $payload Payload.
	 * @return array<string, mixed> First operation.
	 */
	private function sanitized_operation( array $payload ): array {
		$sanitized = json_decode( gutenberg_sanitize_suggestion_payload( (string) wp_json_encode( $payload ) ), true );
		$this->assertIsArray( $sanitized );
		$this->assertIsArray( $sanitized['operations'] );
		$this->assertIsArray( $sanitized['operations'][0] );
		/** @var array<string, mixed> $operation */
		$operation = $sanitized['operations'][0];
		return $operation;
	}

	public function test_sanitizer_keeps_a_well_formed_delta(): void {
		wp_set_current_user( self::$author_id );
		$payload = array(
			'operations' => array(
				array(
					'type'           => 'inline-suggestion',
					'suggestionType' => 'format',
					'delta'          => array(
						array(
							'offset'  => 0,
							'length'  => 4,
							'added'   => array(
								array(
									'type'       => 'core/link',
									'attributes' => array(
										'url'     => 'javascript:alert(1)',
										'onclick' => '<b>x</b>',
									),
								),
								array( 'type' => 'not a type' ),
							),
							'removed' => array(
								array( 'type' => 'core/bold' ),
								array(
									'type'                   => 'core/text-color',
									'attributes'             => array(
										'style' => 'color:red;background-image:url(javascript:alert(1))',
									),
									'unregisteredAttributes' => array(
										'OnMouseOver' => 'alert(1)',
										'srcdoc'      => '<script>alert(1)</script>',
										'data-x'      => 'kept',
									),
								),
							),
						),
						array(
							'offset' => -1,
							'length' => 2,
						),
						'junk',
					),
				),
			),
		);

		$operation = $this->sanitized_operation( $payload );

		$this->assertSame(
			array(
				array(
					'offset'  => 0,
					'length'  => 4,
					'added'   => array(
						array(
							'type'       => 'core/link',
							'attributes' => array(
								'url' => 'alert(1)',
							),
						),
					),
					'removed' => array(
						array( 'type' => 'core/bold' ),
						array(
							'type'                   => 'core/text-color',
							'attributes'             => array(
								'style' => 'color:red',
							),
							'unregisteredAttributes' => array(
								'data-x' => 'kept',
							),
						),
					),
				),
			),
			$operation['delta']
		);
	}

	public function test_sanitizer_drops_a_delta_that_is_not_a_list(): void {
		wp_set_current_user( self::$author_id );
		$payload = array(
			'operations' => array(
				array(
					'type'  => 'inline-suggestion',
					'delta' => array( 'offset' => 0 ),
				),
			),
		);

		$this->assertArrayNotHasKey( 'delta', $this->sanitized_operation( $payload ) );
	}
}
