<?php
/**
 * Tests for copying the files that saved content loads from other installed
 * themes into the Media Library.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_copy_installed_theme_files
 */
class Gutenberg_Installed_Theme_Files_Test extends WP_UnitTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Theme root directory.
	 *
	 * @var string
	 */
	private $theme_root;

	/**
	 * Original theme directories.
	 *
	 * @var string[]
	 */
	private $orig_theme_dir;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();
		$this->theme_root     = realpath( __DIR__ . '/../data/themedir1' );
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as these tests use the twenty* themes too.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		foreach ( $this->get_attachment_ids() as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	/**
	 * Returns the IDs of the attachments in the Media Library.
	 *
	 * @return int[] Attachment IDs.
	 */
	private function get_attachment_ids() {
		return get_posts(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'any',
				'numberposts' => -1,
				'fields'      => 'ids',
			)
		);
	}

	/**
	 * Saves a post that shows an image and returns its saved content.
	 *
	 * @param string $image_url URL of the image.
	 * @return string The saved content.
	 */
	private function save_post_with_image( $image_url ) {
		$post_id = self::factory()->post->create(
			array( 'post_content' => '<!-- wp:image --><figure class="wp-block-image"><img src="' . esc_url( $image_url ) . '" alt=""/></figure><!-- /wp:image -->' )
		);
		return get_post( $post_id )->post_content;
	}

	public function test_copies_files_from_other_themes_into_the_media_library() {
		switch_theme( 'block-theme' );
		$theme_url = wp_get_theme( 'block-theme-with-patterns' )->get_stylesheet_directory_uri() . '/assets/image.png';

		$content     = $this->save_post_with_image( $theme_url );
		$attachments = get_posts(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'any',
				'meta_key'    => '_gutenberg_theme_file', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value'  => 'block-theme-with-patterns/assets/image.png', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
				'fields'      => 'ids',
			)
		);

		$this->assertCount( 1, $attachments, 'The theme file should be copied into the Media Library once.' );
		$this->assertStringNotContainsString( $theme_url, $content, 'The content should not load the file from the other theme.' );
		$this->assertStringContainsString( wp_get_attachment_url( $attachments[0] ), $content, 'The content should load the copy.' );
	}

	public function test_reuses_an_earlier_copy() {
		switch_theme( 'block-theme' );
		$theme_url = wp_get_theme( 'block-theme-with-patterns' )->get_stylesheet_directory_uri() . '/assets/image.png';

		$first  = $this->save_post_with_image( $theme_url );
		$second = $this->save_post_with_image( $theme_url );

		$this->assertSame( $first, $second, 'Both posts should load the same copy.' );
	}

	public function test_leaves_files_from_the_active_theme() {
		switch_theme( 'block-theme-with-patterns' );
		$theme_url = get_stylesheet_directory_uri() . '/assets/image.png';

		$content = $this->save_post_with_image( $theme_url );

		$this->assertStringContainsString( $theme_url, $content );
		$this->assertSame( array(), $this->get_attachment_ids(), 'No file should be copied.' );
	}

	public function test_leaves_files_that_are_not_in_a_theme() {
		switch_theme( 'block-theme' );
		$url = 'https://example.org/wp-content/uploads/image.png';

		$content = $this->save_post_with_image( $url );

		$this->assertStringContainsString( $url, $content );
		$this->assertSame( array(), $this->get_attachment_ids(), 'No file should be copied.' );
	}
}
