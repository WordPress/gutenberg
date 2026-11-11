<?php
/**
 * Tests for the note anchor snapshot meta.
 *
 * @package gutenberg
 */
class Tests_Notes_Anchor extends WP_UnitTestCase {

	public function test_strips_disallowed_html_without_unfiltered_html(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );

		$value = gutenberg_sanitize_note_anchor(
			array(
				array(
					'path'    => array( 0, 2 ),
					'content' => '<!-- wp:paragraph --><p><mark class="wp-note" data-id="new">Hi</mark><script>alert(1)</script></p><!-- /wp:paragraph -->',
				),
			)
		);

		$this->assertSame(
			array(
				array(
					'path'    => array( 0, 2 ),
					'content' => '<!-- wp:paragraph --><p><mark class="wp-note" data-id="new">Hi</mark></p><!-- /wp:paragraph -->',
				),
			),
			$value
		);
	}

	public function test_keeps_anchor_when_saved_content_does_not_link_to_note(): void {
		$post_id = self::factory()->post->create();
		$note_id = self::factory()->comment->create(
			array(
				'comment_post_ID' => $post_id,
				'comment_type'    => 'note',
			)
		);
		$anchor  = array(
			array(
				'path'    => array( 0 ),
				'content' => '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->',
			),
		);
		add_comment_meta( $note_id, '_wp_note_anchor', $anchor );

		wp_update_post(
			array(
				'ID'           => $post_id,
				'post_content' => '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->',
			)
		);
		$this->assertSame( $anchor, get_comment_meta( $note_id, '_wp_note_anchor', true ) );
	}
}
