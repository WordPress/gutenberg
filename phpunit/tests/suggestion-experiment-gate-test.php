<?php
/**
 * Tests for what the Suggestion mode experiment gates on the server: with it
 * off no suggestion can be written and the save pass does not run, while the
 * render strip keeps hiding proposals a post already carries.
 *
 * @group suggestions
 */
class Tests_Suggestion_Experiment_Gate extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static int $editor_id;

	/**
	 * @var int
	 */
	private static int $author_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		$editor_id = $factory->user->create( array( 'role' => 'administrator' ) );
		$author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::assertIsInt( $editor_id );
		self::assertIsInt( $author_id );
		self::$editor_id = $editor_id;
		self::$author_id = $author_id;
	}

	public function set_up(): void {
		parent::set_up();
		wp_create_initial_comment_meta();
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$editor_id );
		$this->set_experiment( false );
	}

	/**
	 * Turns the Suggestion mode experiment on or off.
	 *
	 * @param bool $enabled Whether the experiment is on.
	 */
	private function set_experiment( bool $enabled ): void {
		remove_all_filters( 'pre_option_gutenberg-experiments' );
		add_filter(
			'pre_option_gutenberg-experiments',
			static function () use ( $enabled ): array {
				return array( 'gutenberg-suggestion-mode' => $enabled );
			}
		);
	}

	private function payload(): string {
		return (string) wp_json_encode(
			array(
				'operations' => array(
					array(
						'type'           => 'inline-suggestion',
						'attribute'      => 'content',
						'suggestionType' => 'add',
					),
				),
			)
		);
	}

	private function create_post( string $content = '' ): int {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => $content,
				'post_author'  => self::$editor_id,
				'post_status'  => 'publish',
			)
		);
		$this->assertIsInt( $post_id );
		return $post_id;
	}

	private function create_plain_note( int $post_id ): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$author_id,
			)
		);
		$this->assertIsInt( $note_id );
		return $note_id;
	}

	private function create_note( int $post_id ): int {
		$note_id = $this->create_plain_note( $post_id );
		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( $this->payload() ) );
		return $note_id;
	}

	private function added( int $note_id, string $text ): string {
		return "<!-- wp:paragraph -->\n<p>Hello <mark data-suggestion-id=\"{$note_id}\" data-suggestion-type=\"add\" data-author=\"" . self::$author_id . "\" class=\"wp-suggestion-add\">{$text}</mark></p>\n<!-- /wp:paragraph -->";
	}

	private function save( int $post_id, string $content ): void {
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => wp_slash( $content ),
			)
		);
		clean_post_cache( $post_id );
	}

	private function stored( int $post_id ): string {
		return (string) get_post_field( 'post_content', $post_id, 'raw' );
	}

	private function edit_view( int $post_id ): string {
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$request->set_param( 'context', 'edit' );
		$data = rest_get_server()->dispatch( $request )->get_data();
		$this->assertIsArray( $data );
		$this->assertIsArray( $data['content'] );
		$this->assertIsString( $data['content']['raw'] );
		return $data['content']['raw'];
	}

	/**
	 * Sends a REST write of a note.
	 *
	 * @param string               $route  Route.
	 * @param array<string, mixed> $params Body.
	 * @return WP_REST_Response
	 */
	private function rest_write( string $route, array $params ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', $route );
		$request->set_body_params( $params );
		return rest_get_server()->dispatch( $request );
	}

	public function test_rest_refuses_a_new_suggestion_note_without_the_experiment(): void {
		$post_id = $this->create_post();

		$response = $this->rest_write(
			'/wp/v2/comments',
			array(
				'post'    => $post_id,
				'type'    => 'note',
				'status'  => 'hold',
				'content' => '',
				'meta'    => array( '_wp_suggestion' => $this->payload() ),
			)
		);

		$this->assertSame( 403, $response->get_status() );
		$error = $response->as_error();
		$this->assertInstanceOf( WP_Error::class, $error );
		$this->assertSame( 'rest_suggestions_unavailable', $error->get_error_code() );
		$this->assertCount(
			0,
			get_comments(
				array(
					'post_id' => $post_id,
					'type'    => 'note',
					'status'  => 'any',
				)
			)
		);
	}

	public function test_rest_refuses_suggestion_meta_on_an_existing_note_without_the_experiment(): void {
		$post_id = $this->create_post();
		$note_id = $this->create_plain_note( $post_id );

		$payload  = $this->rest_write( '/wp/v2/comments/' . $note_id, array( 'meta' => array( '_wp_suggestion' => $this->payload() ) ) );
		$decision = $this->rest_write( '/wp/v2/comments/' . $note_id, array( 'meta' => array( '_wp_suggestion_status' => 'applied-unsaved' ) ) );

		$this->assertSame( 403, $payload->get_status() );
		$this->assertSame( 403, $decision->get_status() );
		$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion', true ) );
		$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
	}

	public function test_rest_accepts_a_suggestion_note_with_the_experiment(): void {
		$this->set_experiment( true );
		$post_id = $this->create_post();

		$response = $this->rest_write(
			'/wp/v2/comments',
			array(
				'post'    => $post_id,
				'type'    => 'note',
				'status'  => 'hold',
				'content' => '',
				'meta'    => array( '_wp_suggestion' => $this->payload() ),
			)
		);

		$this->assertSame( 201, $response->get_status() );
	}

	public function test_rest_still_writes_a_plain_note_without_the_experiment(): void {
		$post_id = $this->create_post();

		$response = $this->rest_write(
			'/wp/v2/comments',
			array(
				'post'    => $post_id,
				'type'    => 'note',
				'status'  => 'hold',
				'content' => 'A plain note.',
				'meta'    => array( '_wp_suggestion' => '' ),
			)
		);

		$this->assertSame( 201, $response->get_status() );
	}

	public function test_save_pass_does_not_run_without_the_experiment(): void {
		$post_id = $this->create_post( "<!-- wp:paragraph -->\n<p>Hello</p>\n<!-- /wp:paragraph -->" );
		$note_id = $this->create_note( $post_id );
		$content = $this->added( $note_id, 'world' );

		$this->save( $post_id, $content );

		$this->assertSame( $content, $this->stored( $post_id ) );
		$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion_content', true ) );
	}

	public function test_a_decision_is_not_finalized_without_the_experiment(): void {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id );
		$this->set_experiment( true );
		$this->save( $post_id, $this->added( $note_id, 'world' ) );
		update_comment_meta( $note_id, '_wp_suggestion_status', 'applied-unsaved' );
		$this->set_experiment( false );

		$this->save( $post_id, "<!-- wp:paragraph -->\n<p>Hello world</p>\n<!-- /wp:paragraph -->" );

		$this->assertSame( 'applied-unsaved', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
	}

	public function test_edit_context_keeps_the_stored_anchors_without_the_experiment(): void {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id );
		$this->set_experiment( true );
		$this->save( $post_id, $this->added( $note_id, 'world' ) );
		$anchored = $this->stored( $post_id );
		$inflated = $this->edit_view( $post_id );
		$this->set_experiment( false );

		$this->assertStringNotContainsString( 'world', $anchored );
		$this->assertStringContainsString( 'world', $inflated );
		$this->assertSame( $anchored, $this->edit_view( $post_id ) );
	}

	public function test_render_hides_a_proposal_saved_without_the_experiment(): void {
		$post_id = $this->create_post( '' );
		$note_id = $this->create_note( $post_id );
		$this->save( $post_id, $this->added( $note_id, 'world' ) );

		$rendered = apply_filters( 'the_content', $this->stored( $post_id ) );
		$this->assertIsString( $rendered );

		$this->assertStringContainsString( 'Hello', $rendered );
		$this->assertStringNotContainsString( 'world', $rendered );
		$this->assertStringNotContainsString( 'wp-suggestion', $rendered );
	}
}
