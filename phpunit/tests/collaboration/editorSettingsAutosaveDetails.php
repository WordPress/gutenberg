<?php
/**
 * Tests for the collaboration autosave details in block editor settings.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_EditorSettingsAutosaveDetails extends WP_UnitTestCase {

	protected static int $author_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$author_id = $factory->user->create( array( 'role' => 'author' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$author_id );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$author_id );
	}

	public function tear_down() {
		remove_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );
		parent::tear_down();
	}

	private const CRDT_SNAPSHOT_META_KEY = Gutenberg_REST_Autosaves_Controller::CRDT_SNAPSHOT_META_KEY;

	private const TEST_SNAPSHOT = 'AQEBAAA=';

	/**
	 * Creates a draft post with an autosave revision authored by the current user.
	 *
	 * @param string|null $snapshot Optional CRDT snapshot to store on the autosave.
	 * @return array{0: WP_Post, 1: WP_Post} The post and its autosave revision.
	 */
	private function create_draft_with_autosave( ?string $snapshot = self::TEST_SNAPSHOT ): array {
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_content' => 'Draft content',
				'post_status'  => 'draft',
				'post_title'   => 'Draft title',
				'post_type'    => 'post',
			)
		);

		$autosave_id = _wp_put_post_revision( get_post( $post_id ), true );

		if ( null !== $snapshot ) {
			update_metadata( 'post', $autosave_id, self::CRDT_SNAPSHOT_META_KEY, $snapshot );
		}

		return array( get_post( $post_id ), get_post( $autosave_id ) );
	}

	/**
	 * Builds the editor settings input that core provides when an autosave is
	 * newer than the post.
	 *
	 * @param WP_Post $autosave Autosave revision.
	 * @return array Editor settings.
	 */
	private function get_settings_with_autosave( WP_Post $autosave ): array {
		return array(
			'autosave' => array(
				'editLink' => get_edit_post_link( $autosave->ID ),
			),
		);
	}

	public function test_adds_the_autosave_crdt_snapshot() {
		list( $post, $autosave ) = $this->create_draft_with_autosave();

		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$this->get_settings_with_autosave( $autosave ),
			new WP_Block_Editor_Context( array( 'post' => $post ) )
		);

		$this->assertSame( self::TEST_SNAPSHOT, $settings['autosave']['crdtSnapshot'] );
	}

	public function test_does_not_modify_settings_when_the_autosave_has_no_snapshot() {
		list( $post, $autosave ) = $this->create_draft_with_autosave( null );

		$input    = $this->get_settings_with_autosave( $autosave );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array( 'post' => $post ) )
		);

		$this->assertSame( $input, $settings );
	}

	public function test_does_not_modify_settings_when_the_snapshot_is_empty() {
		list( $post, $autosave ) = $this->create_draft_with_autosave( '' );

		$input    = $this->get_settings_with_autosave( $autosave );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array( 'post' => $post ) )
		);

		$this->assertSame( $input, $settings );
	}

	public function test_does_not_modify_settings_when_collaboration_is_disabled() {
		list( $post, $autosave ) = $this->create_draft_with_autosave();
		add_filter( 'pre_option_gutenberg-experiments', '__return_empty_array', 11 );

		$input    = $this->get_settings_with_autosave( $autosave );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array( 'post' => $post ) )
		);

		$this->assertSame( $input, $settings );
	}

	public function test_does_not_modify_settings_without_autosave_setting() {
		list( $post ) = $this->create_draft_with_autosave();

		$input    = array( 'richEditingEnabled' => true );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array( 'post' => $post ) )
		);

		$this->assertSame( $input, $settings );
	}

	public function test_does_not_modify_settings_without_context_post() {
		list( , $autosave ) = $this->create_draft_with_autosave();

		$input    = $this->get_settings_with_autosave( $autosave );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array() )
		);

		$this->assertSame( $input, $settings );
	}

	public function test_does_not_modify_settings_when_post_type_collaboration_is_disabled() {
		list( $post, $autosave ) = $this->create_draft_with_autosave();

		add_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );

		$input    = $this->get_settings_with_autosave( $autosave );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array( 'post' => $post ) )
		);

		remove_filter( 'wp_is_post_type_collaboration_disabled', '__return_true' );

		$this->assertSame( $input, $settings );
	}

	public function test_does_not_modify_settings_without_an_autosave_revision() {
		$post_id = self::factory()->post->create(
			array(
				'post_author' => self::$author_id,
				'post_status' => 'draft',
				'post_type'   => 'post',
			)
		);

		$input    = array( 'autosave' => array( 'editLink' => 'https://example.com' ) );
		$settings = gutenberg_add_autosave_details_to_editor_settings(
			$input,
			new WP_Block_Editor_Context( array( 'post' => get_post( $post_id ) ) )
		);

		$this->assertSame( $input, $settings );
	}
}
