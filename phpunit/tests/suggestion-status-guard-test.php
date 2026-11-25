<?php
/**
 * Tests that the suggestion status rules hold for a caller outside REST, and
 * that the stored proposals a note's author wrote by hand never reach the
 * content an editor loads.
 *
 * @group suggestions
 */
class Tests_Suggestion_Status_Guard extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $admin_id;

	/**
	 * @var int
	 */
	private static $contributor_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ): void {
		$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
		self::assertIsInt( $admin_id );
		self::assertIsInt( $contributor_id );
		self::$admin_id       = $admin_id;
		self::$contributor_id = $contributor_id;
	}

	public function set_up(): void {
		parent::set_up();
		// Suggestion writes over REST need the experiment.
		add_filter(
			'pre_option_gutenberg-experiments',
			static function () {
				return array( 'gutenberg-suggestion-mode' => true );
			}
		);
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$contributor_id );
	}

	private function create_post( string $content = '' ): int {
		$post_id = self::factory()->post->create(
			array(
				'post_content' => $content,
				'post_author'  => self::$contributor_id,
				'post_status'  => 'draft',
			)
		);
		$this->assertIsInt( $post_id );
		return $post_id;
	}

	/**
	 * @param int $post_id Post ID.
	 * @return positive-int Note ID.
	 */
	private function create_note( int $post_id ): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$contributor_id,
			)
		);
		if ( ! is_int( $note_id ) || $note_id < 1 ) {
			self::fail( 'The note was not created.' );
		}
		update_comment_meta( $note_id, '_wp_suggestion', wp_slash( '{"operations":[{"type":"block-insert-after"}]}' ) );
		return $note_id;
	}

	/**
	 * What `edit_comment()` does with the form the comment edit screen posts.
	 *
	 * @param int                  $note_id Note ID.
	 * @param array<string, mixed> $meta    Posted `comment_meta`.
	 */
	private function post_comment_form( int $note_id, array $meta ): void {
		wp_update_comment(
			wp_slash(
				array(
					'comment_ID'   => $note_id,
					'comment_meta' => $meta,
				)
			)
		);
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function data_refused_statuses(): array {
		return array(
			'applied'  => array( 'applied' ),
			'rejected' => array( 'rejected' ),
			'outdated' => array( 'outdated' ),
			'unknown'  => array( 'anything-else' ),
		);
	}

	/**
	 * @dataProvider data_refused_statuses
	 *
	 * @param string $status Status.
	 */
	public function test_comment_update_cannot_write_a_final_status( string $status ): void {
		$note_id = $this->create_note( $this->create_post() );

		$this->post_comment_form( $note_id, array( '_wp_suggestion_status' => $status ) );

		$this->assertSame( '', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
	}

	public function test_comment_update_writes_a_provisional_status_and_the_server_stamps_the_decider(): void {
		$note_id = $this->create_note( $this->create_post() );

		$this->post_comment_form( $note_id, array( '_wp_suggestion_status' => 'applied-unsaved' ) );

		$this->assertSame( 'applied-unsaved', get_comment_meta( $note_id, '_wp_suggestion_status', true ) );
		$this->assertSame( (string) self::$contributor_id, get_comment_meta( $note_id, '_wp_suggestion_decided_by', true ) );

		$this->post_comment_form( $note_id, array( '_wp_suggestion_status' => 'pending' ) );

		$this->assertSame( array(), get_comment_meta( $note_id, '_wp_suggestion_decided_by' ) );
	}

	public function test_rest_decision_records_the_decider(): void {
		wp_set_current_user( self::$admin_id );
		$note_id = $this->create_note( $this->create_post() );

		$request = new WP_REST_Request( 'POST', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'status', 'hold' );
		$request->set_param( 'meta', array( '_wp_suggestion_status' => 'rejected-unsaved' ) );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( (string) self::$admin_id, get_comment_meta( $note_id, '_wp_suggestion_decided_by', true ) );
	}

	public function test_hand_written_proposals_never_reach_the_edit_view(): void {
		$post_id = $this->create_post();
		$note_id = $this->create_note( $post_id );
		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => wp_slash( '<!-- wp:suggestion-placeholder {"id":' . $note_id . ',"type":"pending-insert","run":0} /-->' ),
			)
		);

		$this->post_comment_form(
			$note_id,
			array( '_wp_suggestion_content' => '{"v":1,"items":[{"kind":"block","run":0,"anchor":"","original":"<!-- wp:html --><script>alert(1)</script><!-- /wp:html -->"}]}' )
		);

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . $post_id );
		$request->set_param( 'context', 'edit' );
		$data = rest_get_server()->dispatch( $request )->get_data();

		$this->assertStringNotContainsString( '<script>', (string) wp_json_encode( $data ) );
	}

	/**
	 * @param int    $note_id Note ID.
	 * @param string $payload Payload to write.
	 */
	private function rest_write_payload( int $note_id, string $payload ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', '/wp/v2/comments/' . $note_id );
		$request->set_param( 'meta', array( '_wp_suggestion' => $payload ) );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function data_final_statuses(): array {
		return array(
			'applied'  => array( 'applied' ),
			'rejected' => array( 'rejected' ),
			'outdated' => array( 'outdated' ),
		);
	}

	/**
	 * @dataProvider data_final_statuses
	 *
	 * @param string $status Final status.
	 */
	public function test_a_decided_suggestion_keeps_its_payload( string $status ): void {
		wp_set_current_user( self::$admin_id );
		$note_id = $this->create_note( $this->create_post() );
		$stored  = get_comment_meta( $note_id, '_wp_suggestion', true );
		$this->assertIsString( $stored );
		gutenberg_update_suggestion_server_meta( $note_id, '_wp_suggestion_status', $status );

		$response = $this->rest_write_payload( $note_id, '{"operations":[{"type":"block-remove"}]}' );

		$this->assertSame( 409, $response->get_status() );
		$error = $response->as_error();
		$this->assertInstanceOf( WP_Error::class, $error );
		$this->assertSame( 'rest_suggestion_decided', $error->get_error_code() );
		$this->assertSame( $stored, get_comment_meta( $note_id, '_wp_suggestion', true ) );

		$this->post_comment_form( $note_id, array( '_wp_suggestion' => '{"operations":[{"type":"block-remove"}]}' ) );
		$this->assertSame( $stored, get_comment_meta( $note_id, '_wp_suggestion', true ), 'Nor outside REST.' );

		$this->assertFalse( delete_comment_meta( $note_id, '_wp_suggestion' ) );
		$this->assertSame( $stored, get_comment_meta( $note_id, '_wp_suggestion', true ) );

		$this->assertSame( 200, $this->rest_write_payload( $note_id, $stored )->get_status(), 'Sending the stored payload again changes nothing.' );
	}

	/**
	 * @return array<string, array{0: string}>
	 */
	public function data_open_statuses(): array {
		return array(
			'no status'        => array( '' ),
			'pending'          => array( 'pending' ),
			'applied-unsaved'  => array( 'applied-unsaved' ),
			'rejected-unsaved' => array( 'rejected-unsaved' ),
		);
	}

	/**
	 * @dataProvider data_open_statuses
	 *
	 * @param string $status Status.
	 */
	public function test_an_undecided_suggestion_takes_a_new_payload( string $status ): void {
		wp_set_current_user( self::$admin_id );
		$note_id = $this->create_note( $this->create_post() );
		if ( '' !== $status ) {
			update_comment_meta( $note_id, '_wp_suggestion_status', $status );
		}
		$payload = '{"operations":[{"type":"block-remove"}]}';

		$this->assertSame( 200, $this->rest_write_payload( $note_id, $payload )->get_status() );
		$this->assertSame( $payload, get_comment_meta( $note_id, '_wp_suggestion', true ) );
	}

	public function test_a_reopened_suggestion_takes_a_new_payload(): void {
		wp_set_current_user( self::$admin_id );
		$note_id = $this->create_note( $this->create_post() );
		gutenberg_update_suggestion_server_meta( $note_id, '_wp_suggestion_status', 'applied' );

		$reopen = new WP_REST_Request( 'POST', '/wp/v2/comments/' . $note_id );
		$reopen->set_param( 'status', 'hold' );
		$reopen->set_param( 'meta', array( '_wp_suggestion_status' => 'pending' ) );
		$this->assertSame( 200, rest_get_server()->dispatch( $reopen )->get_status() );

		$payload = '{"operations":[{"type":"block-remove"}]}';
		$this->assertSame( 200, $this->rest_write_payload( $note_id, $payload )->get_status() );
		$this->assertSame( $payload, get_comment_meta( $note_id, '_wp_suggestion', true ) );
	}
}
