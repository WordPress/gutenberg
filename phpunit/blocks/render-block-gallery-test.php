<?php
/**
 * Gallery block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Gallery block, in particular its dynamic mode where images are
 * resolved from a source (`dynamicContent`) rather than from inner image blocks.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Gallery extends WP_UnitTestCase {

	/**
	 * Post that the attachments are attached to.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * Image attachment IDs attached to self::$post_id.
	 *
	 * @var int[]
	 */
	private static $attachment_ids = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create(
			array( 'post_title' => 'Gallery dynamic mode test post' )
		);

		$file = DIR_TESTDATA . '/images/canola.jpg';
		// Two images attached to the post.
		self::$attachment_ids[] = $factory->attachment->create_upload_object( $file, self::$post_id );
		self::$attachment_ids[] = $factory->attachment->create_upload_object( $file, self::$post_id );

		// Give the attachments distinct dates so `orderby=date` is deterministic
		// and actually reverses between asc and desc. Created back-to-back from
		// the same file they would otherwise share a `post_date`, which MySQL
		// tie-breaks by ID regardless of order direction.
		wp_update_post(
			array(
				'ID'            => self::$attachment_ids[0],
				'post_date'     => '2020-01-01 00:00:00',
				'post_date_gmt' => '2020-01-01 00:00:00',
			)
		);
		wp_update_post(
			array(
				'ID'            => self::$attachment_ids[1],
				'post_date'     => '2020-01-02 00:00:00',
				'post_date_gmt' => '2020-01-02 00:00:00',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		wp_delete_post( self::$post_id, true );
	}

	/**
	 * Renders a gallery block within the loop for self::$post_id so that the
	 * `core/attached-media` source resolves against it (via the `get_the_ID()`
	 * fallback).
	 *
	 * @param string $block_markup Serialized gallery block.
	 * @return string Rendered HTML.
	 */
	private function render_in_loop( $block_markup ) {
		global $post;
		$post = get_post( self::$post_id );
		setup_postdata( $post );
		$output = do_blocks( $block_markup );
		wp_reset_postdata();
		return $output;
	}

	public function test_dynamic_attached_to_post_renders_attached_images() {
		$output = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media"}} /-->'
		);

		// The gallery wrapper is built from scratch (no markup is persisted in
		// dynamic mode), so assert it carries the gallery-specific classes plus
		// the flex layout class added by the layout render filter — i.e. the same
		// wrapper a static gallery would produce.
		foreach ( array(
			'wp-block-gallery',
			'has-nested-images',
			'columns-default',
			'is-cropped',
			'is-layout-flex',
		) as $expected_class ) {
			$this->assertStringContainsString(
				$expected_class,
				$output,
				"Constructed gallery wrapper should include the `$expected_class` class."
			);
		}

		// One image figure per attached image.
		$this->assertSame(
			count( self::$attachment_ids ),
			substr_count( $output, 'wp-block-image' ),
			'Should render one image block per attached image.'
		);

		foreach ( self::$attachment_ids as $attachment_id ) {
			$this->assertStringContainsString(
				'wp-image-' . $attachment_id,
				$output,
				"Rendered gallery should contain attachment $attachment_id."
			);
		}
	}

	public function test_dynamic_attached_to_post_honours_order() {
		$asc  = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media","args":{"orderBy":"date","order":"asc"}}} /-->'
		);
		$desc = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media","args":{"orderBy":"date","order":"desc"}}} /-->'
		);

		$first  = self::$attachment_ids[0];
		$second = self::$attachment_ids[1];

		// Oldest to newest: the first-created attachment renders before the second.
		$this->assertLessThan(
			strpos( $asc, 'wp-image-' . $second ),
			strpos( $asc, 'wp-image-' . $first ),
			'With order=asc the earlier attachment should render first.'
		);

		// Newest to oldest reverses that order.
		$this->assertLessThan(
			strpos( $desc, 'wp-image-' . $first ),
			strpos( $desc, 'wp-image-' . $second ),
			'With order=desc the later attachment should render first.'
		);
	}

	public function test_dynamic_source_with_no_images_renders_nothing() {
		// An unrecognized source (like a valid source that resolves to no images)
		// should render nothing at all — not an empty gallery wrapper.
		$output = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"notARealSource"}} /-->'
		);

		$this->assertStringNotContainsString( 'wp-block-image', $output );
		$this->assertStringNotContainsString( 'wp-block-gallery', $output );
		$this->assertSame( '', trim( $output ) );
	}

	public function test_dynamic_gallery_ignores_malformed_dynamic_content() {
		// A `dynamicContent` that isn't the expected `{ source, args }` object
		// (e.g. corrupted or hand-edited markup) resolves to no source and renders
		// nothing, without reading array offsets off a non-array value.
		$non_object = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":"not-an-object"} /-->'
		);
		$this->assertSame(
			'',
			trim( $non_object ),
			'A non-object dynamicContent should resolve to no source and render nothing.'
		);

		// A valid source with a malformed (non-array) `args` falls back to the
		// default ordering and still renders the attached images, again without
		// indexing a non-array.
		$malformed_args = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media","args":"oops"}} /-->'
		);
		$this->assertSame(
			count( self::$attachment_ids ),
			substr_count( $malformed_args, 'wp-block-image' ),
			'A gallery with malformed args should still render the attached images using the default ordering.'
		);
	}

	public function test_dynamic_gallery_sanitizes_image_aspect_ratio_style() {
		$valid_output = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media"},"aspectRatio":"16/9"} /-->'
		);

		$this->assertStringContainsString(
			'style="aspect-ratio:16/9;object-fit:cover"',
			$valid_output,
			'A valid aspect ratio should be rendered as an image style.'
		);

		// A value that tries to break out of the style attribute is run through
		// `safecss_filter_attr` and escaped on output, so it cannot introduce an
		// event handler or extra markup.
		$malicious_output = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media"},"aspectRatio":"16/9\" onload=\"alert(1)"} /-->'
		);

		$this->assertStringNotContainsString(
			'onload="alert(1)',
			$malicious_output,
			'A malicious aspect ratio must not break out of the style attribute.'
		);
		$this->assertStringNotContainsString(
			'<script',
			$malicious_output,
			'A malicious aspect ratio must not inject markup.'
		);
	}

	public function test_dynamic_gallery_renders_saved_caption_after_images() {
		// In dynamic mode `save.js` persists only the gallery-level caption, so the
		// saved content is a bare `<figcaption>`. The render callback builds the
		// wrapper, injects the resolved images, then appends the caption.
		$output = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media"}} --><figcaption class="blocks-gallery-caption wp-element-caption">My gallery caption</figcaption><!-- /wp:gallery -->'
		);

		$this->assertStringContainsString(
			'<figcaption class="blocks-gallery-caption wp-element-caption">My gallery caption</figcaption>',
			$output,
			'The saved gallery caption should be rendered.'
		);

		// The caption is appended after the images (mirroring a static gallery).
		$this->assertGreaterThan(
			strpos( $output, 'wp-image-' . self::$attachment_ids[0] ),
			strpos( $output, 'blocks-gallery-caption' ),
			'The gallery caption should render after the images.'
		);

		// It sits inside the gallery figure, not loose after it.
		$this->assertStringEndsWith( '</figure>', trim( $output ) );
	}

	public function test_static_gallery_without_dynamic_source_is_unaffected() {
		$attachment_id = self::$attachment_ids[0];
		$image_url     = wp_get_attachment_image_url( $attachment_id, 'large' );
		$markup        = sprintf(
			'<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped"><!-- wp:image {"id":%1$d,"sizeSlug":"large"} --><figure class="wp-block-image size-large"><img src="%2$s" alt="" class="wp-image-%1$d"/></figure><!-- /wp:image --></figure><!-- /wp:gallery -->',
			$attachment_id,
			$image_url
		);

		$output = $this->render_in_loop( $markup );

		// The single, manually-added image renders; the dynamic source path is
		// not engaged, so no extra attached images are injected.
		$this->assertSame( 1, substr_count( $output, 'wp-block-image' ) );
		$this->assertStringContainsString( 'wp-image-' . $attachment_id, $output );
	}

	public function test_dynamic_caption_mirrors_raw_excerpt_and_ignores_filter() {
		$attachment_id = self::$attachment_ids[0];

		// Give the attachment a raw caption (`post_excerpt`).
		wp_update_post(
			array(
				'ID'           => $attachment_id,
				'post_excerpt' => 'Raw caption text',
			)
		);

		// The editor preview builds the image caption from the REST `caption.raw`
		// value and cannot see PHP filters, so a `wp_get_attachment_caption` filter
		// must NOT influence the rendered figcaption — otherwise the frontend would
		// diverge from the preview.
		$filter = static function () {
			return 'Filtered caption text';
		};
		add_filter( 'wp_get_attachment_caption', $filter );

		try {
			$output = $this->render_in_loop(
				'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media"}} /-->'
			);
		} finally {
			remove_filter( 'wp_get_attachment_caption', $filter );
			// Reset so the shared fixture doesn't leak into other tests.
			wp_update_post(
				array(
					'ID'           => $attachment_id,
					'post_excerpt' => '',
				)
			);
		}

		$this->assertStringContainsString(
			'wp-element-caption',
			$output,
			'Dynamic render should output a caption element.'
		);
		$this->assertStringContainsString(
			'Raw caption text',
			$output,
			'Dynamic render should use the raw attachment caption, mirroring the editor preview.'
		);
		$this->assertStringNotContainsString(
			'Filtered caption text',
			$output,
			'The wp_get_attachment_caption filter must not affect the dynamic render; it cannot be mirrored in the editor preview.'
		);
	}

	public function test_dynamic_lightbox_link_adds_interactivity_directives() {
		$output = $this->render_in_loop(
			'<!-- wp:gallery {"dynamicContent":{"source":"core/attached-media"},"linkTo":"lightbox"} /-->'
		);

		// Lightbox-enabled images go through the image block's lightbox render,
		// which the gallery then wires up for navigation.
		$this->assertStringContainsString( 'data-wp-interactive="core/gallery"', $output );
		$this->assertStringContainsString( 'lightbox-trigger', $output );
	}
}
