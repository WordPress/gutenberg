<?php
/**
 * Gallery block media folder source rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests the Gallery block's `core/media-folder` dynamic source, which resolves a
 * gallery's images from a `wp_media_folder` term rather than from the post the
 * gallery is rendered within.
 *
 * The taxonomy is registered by an experiment (see
 * `lib/experimental/media-folders.php`), which is off in the test environment —
 * so these tests register it themselves. The one test that matters for the
 * experiment being off is `test_folder_source_renders_nothing_without_taxonomy`,
 * which deliberately runs without it.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Gallery_Media_Folder extends WP_UnitTestCase {

	/**
	 * Image attachment IDs filed under the folder, in creation order.
	 *
	 * @var int[]
	 */
	private $attachment_ids = array();

	/**
	 * The folder the gallery points at.
	 *
	 * @var int
	 */
	private $folder_id;

	/**
	 * An image outside the folder, to prove the source actually filters.
	 *
	 * @var int
	 */
	private $unfiled_attachment_id;

	public function set_up() {
		parent::set_up();

		$this->register_media_folder_taxonomy();

		$folder          = wp_insert_term( 'Holiday', 'wp_media_folder' );
		$this->folder_id = $folder['term_id'];

		$file = DIR_TESTDATA . '/images/canola.jpg';

		// Distinct titles and dates so both orderings are deterministic. Created
		// back-to-back from one file the attachments would otherwise share a
		// `post_date`, which MySQL tie-breaks by ID regardless of direction.
		foreach ( array( 'Beach', 'Apple' ) as $index => $title ) {
			$attachment_id          = self::factory()->attachment->create_upload_object( $file );
			$this->attachment_ids[] = $attachment_id;

			wp_update_post(
				array(
					'ID'            => $attachment_id,
					'post_title'    => $title,
					'post_date'     => sprintf( '2020-01-0%d 00:00:00', $index + 1 ),
					'post_date_gmt' => sprintf( '2020-01-0%d 00:00:00', $index + 1 ),
				)
			);
			wp_set_object_terms( $attachment_id, array( $this->folder_id ), 'wp_media_folder' );
		}

		$this->unfiled_attachment_id = self::factory()->attachment->create_upload_object( $file );
	}

	public function tear_down() {
		foreach ( array_merge( $this->attachment_ids, array( $this->unfiled_attachment_id ) ) as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		$this->attachment_ids = array();

		unregister_taxonomy( 'wp_media_folder' );

		parent::tear_down();
	}

	/**
	 * Registers the media folders taxonomy the way the experiment does.
	 *
	 * Loads the experiment's own registration rather than restating its
	 * arguments, so the tests exercise the real configuration — in particular
	 * `update_count_callback`, which the count assertion below depends on.
	 */
	private function register_media_folder_taxonomy() {
		if ( ! function_exists( 'gutenberg_register_media_folder_taxonomy' ) ) {
			require_once __DIR__ . '/../../lib/experimental/media-folders.php';
		}
		gutenberg_register_media_folder_taxonomy();
	}

	/**
	 * Renders a gallery block outside any loop.
	 *
	 * Unlike `core/attached-media`, a folder source names its own content, so it
	 * must resolve with no post in context — which is what lets a folder gallery
	 * work in a template part or pattern.
	 *
	 * @param array $dynamic_content The gallery's `dynamicContent` attribute.
	 * @return string Rendered HTML.
	 */
	private function render_folder_gallery( $dynamic_content ) {
		return do_blocks(
			'<!-- wp:gallery ' . wp_json_encode( array( 'dynamicContent' => $dynamic_content ) ) . ' /-->'
		);
	}

	public function test_folder_source_renders_only_that_folders_images() {
		$output = $this->render_folder_gallery(
			array(
				'source' => 'core/media-folder',
				'args'   => array( 'folderId' => $this->folder_id ),
			)
		);

		$this->assertSame(
			count( $this->attachment_ids ),
			substr_count( $output, 'wp-block-image' ),
			'Should render one image block per image in the folder.'
		);

		foreach ( $this->attachment_ids as $attachment_id ) {
			$this->assertStringContainsString(
				'wp-image-' . $attachment_id,
				$output,
				"Rendered gallery should contain attachment $attachment_id."
			);
		}

		$this->assertStringNotContainsString(
			'wp-image-' . $this->unfiled_attachment_id,
			$output,
			'An image outside the folder should not be rendered.'
		);
	}

	public function test_folder_source_honours_order() {
		$by_title = $this->render_folder_gallery(
			array(
				'source' => 'core/media-folder',
				'args'   => array(
					'folderId' => $this->folder_id,
					'orderBy'  => 'title',
					'order'    => 'asc',
				),
			)
		);

		list( $beach, $apple ) = $this->attachment_ids;

		// A → Z puts "Apple" before "Beach", the reverse of creation order — so
		// this also proves the ordering args reach the query at all.
		$this->assertLessThan(
			strpos( $by_title, 'wp-image-' . $beach ),
			strpos( $by_title, 'wp-image-' . $apple ),
			'With orderBy=title and order=asc, "Apple" should render before "Beach".'
		);
	}

	public function test_folder_source_counts_unattached_media() {
		// The taxonomy's `update_count_callback` exists for exactly this: WordPress'
		// default counts an attachment against its parent post's status and skips
		// unattached media, which would report every folder as empty.
		$folder = get_term( $this->folder_id, 'wp_media_folder' );

		$this->assertSame(
			count( $this->attachment_ids ),
			$folder->count,
			'A folder should count the unattached media filed under it.'
		);
	}

	public function test_folder_source_renders_nothing_without_a_folder() {
		foreach ( array(
			'missing folder id' => array(),
			'empty folder id'   => array( 'folderId' => 0 ),
			'non-numeric id'    => array( 'folderId' => 'oops' ),
			'unknown folder'    => array( 'folderId' => 999999 ),
		) as $case => $args ) {
			$output = $this->render_folder_gallery(
				array(
					'source' => 'core/media-folder',
					'args'   => $args,
				)
			);

			$this->assertSame(
				'',
				trim( $output ),
				"A folder gallery with $case should render nothing at all."
			);
		}
	}

	public function test_folder_source_renders_nothing_without_taxonomy() {
		// With the experiment off the taxonomy doesn't exist, so a gallery saved
		// while it was on has to degrade to rendering nothing rather than erroring
		// or falling back to some other set of images.
		unregister_taxonomy( 'wp_media_folder' );

		$output = $this->render_folder_gallery(
			array(
				'source' => 'core/media-folder',
				'args'   => array( 'folderId' => $this->folder_id ),
			)
		);

		$this->assertSame(
			'',
			trim( $output ),
			'A folder gallery should render nothing when media folders are unavailable.'
		);

		// Re-registered so `tear_down` can unregister it symmetrically.
		$this->register_media_folder_taxonomy();
	}
}
