<?php
/**
 * Comment Edit Link block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Comment Edit Link block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_comment_edit_link
 */
class Tests_Blocks_Render_Comment_Edit_Link extends WP_UnitTestCase {

	/**
	 * Post the comments belong to.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Approved comment.
	 *
	 * @var int
	 */
	private static $comment_id;

	/**
	 * Administrator user.
	 *
	 * @var int
	 */
	private static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id   = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$post_id    = $factory->post->create();
		self::$comment_id = $factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_approved' => '1',
			)
		);
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
	}

	/**
	 * Renders a Comment Edit Link block and returns its links.
	 *
	 * @param array $attributes Block attributes.
	 * @param int   $comment_id Comment ID to render the block for.
	 * @return array Links keyed by label, each with `href` and `target`.
	 */
	private function get_links( $attributes, $comment_id = null ) {
		$parsed_block = parse_blocks( '<!-- wp:comment-edit-link ' . wp_json_encode( (object) $attributes ) . ' /-->' )[0];
		$block        = new WP_Block( $parsed_block, array( 'commentId' => $comment_id ? $comment_id : self::$comment_id ) );

		preg_match_all( '/<a href="([^"]*)"([^>]*)>([^<]*)<\/a>/', $block->render(), $matches, PREG_SET_ORDER );

		$links = array();
		foreach ( $matches as $match ) {
			preg_match( '/target="([^"]*)"/', $match[2], $target );
			$links[ $match[3] ] = array(
				'href'   => html_entity_decode( $match[1] ),
				'target' => $target ? $target[1] : null,
			);
		}
		return $links;
	}

	/**
	 * Asserts that a link points to a moderation action with a valid nonce.
	 *
	 * @param string $href         Link URL.
	 * @param string $action       Expected `comment.php` action.
	 * @param string $nonce_action Nonce action the request is checked against.
	 * @param int    $comment_id   Comment ID.
	 */
	private function assert_moderation_link( $href, $action, $nonce_action, $comment_id ) {
		$query = array();
		wp_parse_str( (string) wp_parse_url( $href, PHP_URL_QUERY ), $query );

		$this->assertStringStartsWith( admin_url( 'comment.php' ), $href );
		$this->assertSame( $action, $query['action'] );
		$this->assertSame( (string) $comment_id, $query['c'] );
		$this->assertNotFalse( wp_verify_nonce( $query['_wpnonce'], $nonce_action . $comment_id ) );
	}

	public function test_renders_only_edit_link_by_default() {
		$this->assertSame( array( 'Edit' ), array_keys( $this->get_links( array() ) ) );
	}

	public function test_renders_moderation_links_when_enabled() {
		$links = $this->get_links( array( 'showModerationLinks' => true ) );

		$this->assertSame( array( 'Edit', 'Unapprove', 'Spam', 'Trash' ), array_keys( $links ) );
		$this->assert_moderation_link( $links['Unapprove']['href'], 'unapprovecomment', 'approve-comment_', self::$comment_id );
		$this->assert_moderation_link( $links['Spam']['href'], 'spamcomment', 'delete-comment_', self::$comment_id );
		$this->assert_moderation_link( $links['Trash']['href'], 'trashcomment', 'delete-comment_', self::$comment_id );
	}

	public function test_renders_approve_link_for_pending_comment() {
		$pending_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_approved' => '0',
			)
		);

		$links = $this->get_links( array( 'showModerationLinks' => true ), $pending_id );

		$this->assertSame( array( 'Edit', 'Approve', 'Spam', 'Trash' ), array_keys( $links ) );
		$this->assert_moderation_link( $links['Approve']['href'], 'approvecomment', 'approve-comment_', $pending_id );
	}

	public function test_moderation_links_always_open_in_same_tab() {
		$links = $this->get_links(
			array(
				'showModerationLinks' => true,
				'linkTarget'          => '_blank',
			)
		);

		$this->assertSame( '_blank', $links['Edit']['target'] );
		$this->assertNull( $links['Spam']['target'] );
	}

	public function test_renders_nothing_for_users_who_cannot_edit_comment() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'subscriber' ) ) );

		$this->assertSame( array(), $this->get_links( array( 'showModerationLinks' => true ) ) );
	}
}
