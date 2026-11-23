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
		self::$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
	}

	public function set_up(): void {
		parent::set_up();
		gutenberg_register_suggestion_meta();
		wp_set_current_user( self::$contributor_id );
	}

	private function create_post( string $content = '' ): int {
		return self::factory()->post->create(
			array(
				'post_content' => $content,
				'post_author'  => self::$contributor_id,
				'post_status'  => 'draft',
			)
		);
	}

	private function create_note( int $post_id ): int {
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => $post_id,
				'comment_type'     => 'note',
				'comment_approved' => '0',
				'user_id'          => self::$contributor_id,
			)
		);
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

		$this->assertStringNotContainsString( '<script>', $data['content']['raw'] );
	}
}
