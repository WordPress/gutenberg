<?php
/**
 * Tests for the collaboration autosaves REST controller override.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group restapi
 */
class Tests_Collaboration_RestAutosavesController extends WP_UnitTestCase {

	protected static int $author_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$author_id );
		delete_option( 'wp_collaboration_enabled' );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$author_id );
	}

	/**
	 * Creates an empty auto-draft post.
	 *
	 * @return int Post ID.
	 */
	private function create_auto_draft(): int {
		return self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => '',
				'post_status'  => 'auto-draft',
				'post_title'   => 'Auto Draft',
				'post_type'    => 'post',
			)
		);
	}

	/**
	 * Dispatches an autosave request for a post.
	 *
	 * @param int    $post_id Post ID.
	 * @param string $title   Autosaved post title.
	 * @param string $content Autosaved post content.
	 * @return WP_REST_Response Autosave response.
	 */
	private function dispatch_autosave( int $post_id, string $title, string $content ): WP_REST_Response {
		$request = new WP_REST_Request( 'POST', "/wp/v2/posts/{$post_id}/autosaves" );
		$request->set_param( 'title', $title );
		$request->set_param( 'content', $content );
		$request->set_param( 'status', 'draft' );

		return rest_get_server()->dispatch( $request );
	}

	public function test_auto_draft_autosave_promotes_parent_post_when_collaboration_is_disabled() {
		update_option( 'wp_collaboration_enabled', 0 );

		$post_id = $this->create_auto_draft();
		$title   = 'No RTC autosaved title';
		$content = '<!-- wp:paragraph --><p>No RTC autosaved content</p><!-- /wp:paragraph -->';

		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$post = get_post( $post_id );
		$this->assertSame( 'draft', $post->post_status );
		$this->assertSame( $title, $post->post_title );
		$this->assertSame( $content, $post->post_content );
	}

	public function test_auto_draft_autosave_promotes_parent_post_when_collaboration_is_enabled() {
		update_option( 'wp_collaboration_enabled', 1 );

		$post_id = $this->create_auto_draft();
		$title   = 'RTC autosaved title';
		$content = '<!-- wp:paragraph --><p>RTC autosaved content</p><!-- /wp:paragraph -->';

		$response = $this->dispatch_autosave( $post_id, $title, $content );

		$this->assertSame( 200, $response->get_status() );
		$post = get_post( $post_id );
		$this->assertSame( 'draft', $post->post_status );
		$this->assertSame( $title, $post->post_title );
		$this->assertSame( $content, $post->post_content );
	}
}
