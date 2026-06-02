<?php
/**
 * Cover block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Cover block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Cover extends WP_UnitTestCase {
	/**
	 * Post object.
	 *
	 * @var object
	 */
	protected static $post;

	/** @var int Featured-image / post-thumbnail attachment. */
	protected static $attachment_id;

	/** @var int Bound override attachment used to assert the bound value wins. */
	protected static $override_attachment_id;

	const TEST_SOURCE_NAME = 'test/cover-bindings';

	/**
	 * Holds the current test's `get_value_callback`. Set by each test before it
	 * calls `register_test_source()`; consumed by the registered closure.
	 *
	 * @var callable|null
	 */
	protected $source_callback;

	/**
	 * Default saved Cover markup with a plain `<img>` background and a
	 * `has-background-dim has-background-dim-100` overlay span. Reused by tests
	 * that don't need a custom saved form.
	 */
	const DEFAULT_SAVED_MARKUP = '<div class="wp-block-cover"><img class="wp-block-cover__image-background" alt="" src="https://saved.example.com/old.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100"></span><div class="wp-block-cover__inner-container"></div></div>';

	public static function wpSetUpBeforeClass() {
		self::$post = self::factory()->post->create_and_get();
		$file       = DIR_TESTDATA . '/images/canola.jpg';

		self::$attachment_id          = self::factory()->attachment->create_upload_object( $file, self::$post->ID, array( 'post_mime_type' => 'image/jpeg' ) );
		self::$override_attachment_id = self::factory()->attachment->create_upload_object( $file, self::$post->ID, array( 'post_mime_type' => 'image/jpeg' ) );

		set_post_thumbnail( self::$post, self::$attachment_id );
		update_post_meta( self::$override_attachment_id, '_wp_attachment_image_alt', 'Override alt text' );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID, true );
		wp_delete_post( self::$attachment_id, true );
		wp_delete_post( self::$override_attachment_id, true );
	}

	public function set_up() {
		parent::set_up();
		$this->source_callback = null;
	}

	public function tear_down() {
		if ( get_block_bindings_source( self::TEST_SOURCE_NAME ) ) {
			unregister_block_bindings_source( self::TEST_SOURCE_NAME );
		}
		$this->source_callback = null;

		parent::tear_down();
	}

	/**
	 * Registers the test binding source delegating to `$this->source_callback`.
	 */
	protected function register_test_source( callable $callback ) {
		$this->source_callback = $callback;
		$test                  = $this;
		register_block_bindings_source(
			self::TEST_SOURCE_NAME,
			array(
				'label'              => array( 'label' => 'Test cover source' ),
				'get_value_callback' => function ( $source_args, $block_instance, $attribute_name ) use ( $test ) {
					return call_user_func( $test->source_callback, $source_args, $block_instance, $attribute_name );
				},
			)
		);
	}

	/**
	 * Shortcut: register a source that resolves `id` to `$id` and `url` to `$url`.
	 */
	protected function register_id_url_source( int $id, string $url ) {
		$this->register_test_source(
			function ( $source_args, $block_instance, $attribute_name ) use ( $id, $url ) {
				return 'url' === $attribute_name ? $url : $id;
			}
		);
	}

	/**
	 * Builds a parsed Cover block array with a same-source `{ id, url }` binding
	 * shape against the test source.
	 */
	protected function build_bound_cover_block( string $saved_markup, array $extra_attributes = array(), $bindings_override = null ): array {
		$bindings = null !== $bindings_override
			? $bindings_override
			: array(
				'id'  => array( 'source' => self::TEST_SOURCE_NAME ),
				'url' => array( 'source' => self::TEST_SOURCE_NAME ),
			);

		$attrs = array_merge(
			array(
				'backgroundType' => 'image',
				'metadata'       => array( 'bindings' => $bindings ),
			),
			$extra_attributes
		);

		return array(
			'blockName'    => 'core/cover',
			'attrs'        => $attrs,
			'innerBlocks'  => array(),
			'innerHTML'    => $saved_markup,
			'innerContent' => array( $saved_markup ),
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover() {

		global $wp_query;

		// Fake being in the loop.
		$wp_query->in_the_loop = true;
		$wp_query->post        = self::$post;

		$wp_query->posts = array( self::$post );
		$GLOBALS['post'] = self::$post;

		$attributes = array(
			'useFeaturedImage' => true,
			'backgroundType'   => 'image',
			'hasParallax'      => true,
			'isRepeated'       => true,
			'minHeight'        => '100px',
		);

		$content  = '<div class="wp-block-cover" style="min-height:100px"><span></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered = gutenberg_render_block_core_cover( $attributes, $content );

		$this->assertStringContainsString( wp_get_attachment_image_url( self::$attachment_id, 'full' ), $rendered );
		$this->assertStringContainsString( 'background-image', $rendered );
		$this->assertStringContainsString( 'min-height', $rendered );

		// If cover background type is not image.
		$attributes['backgroundType'] = 'color';
		$rendered                     = gutenberg_render_block_core_cover( $attributes, '' );
		$this->assertEmpty( $rendered );

		// If cover background is not post featured image.
		$attributes['backgroundType']   = 'image';
		$attributes['useFeaturedImage'] = false;
		$rendered                       = gutenberg_render_block_core_cover( $attributes, '' );
		$this->assertEmpty( $rendered );
	}

	/**
	 * @covers ::gutenberg_render_block_core_cover
	 */
	public function test_gutenberg_render_block_core_cover_fixed_or_repeated_background() {

		global $wp_query;

		// Fake being in the loop.
		$wp_query->post  = self::$post;
		$GLOBALS['post'] = self::$post;

		$attributes = array(
			'useFeaturedImage' => true,
			'backgroundType'   => 'image',
			'hasParallax'      => false,
			'isRepeated'       => false,
			'minHeight'        => '100px',
			'focalPoint'       => array(
				'x' => 10,
				'y' => 10,
			),
		);

		$content  = '<div class="wp-block-cover"><span></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered = gutenberg_render_block_core_cover( $attributes, $content );

		$this->assertStringContainsString( wp_get_attachment_image_url( self::$attachment_id, 'full' ), $rendered );
		$this->assertStringContainsString( 'object-position', $rendered );
		$this->assertStringNotContainsString( 'background-image', $rendered );
		$this->assertStringNotContainsString( 'min-height', $rendered );
	}

	// AC-3: bound URL substitutes into the plain `<img>` saved form; old src and
	// any pre-existing `wp-image-*` class are removed.
	public function test_bound_url_substitutes_in_plain_img_form() {
		$bound_url = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$bound_id  = self::$override_attachment_id;
		$this->register_id_url_source( $bound_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover"><img class="wp-block-cover__image-background wp-image-999" alt="" src="https://saved.example.com/old.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block( $this->build_bound_cover_block( $saved_markup ) );

		$this->assertStringContainsString( 'src="' . esc_attr( $bound_url ) . '"', $rendered );
		$this->assertStringNotContainsString( 'https://saved.example.com/old.jpg', $rendered );
		$this->assertStringContainsString( 'wp-image-' . $bound_id, $rendered );
		$this->assertStringNotContainsString( 'wp-image-999', $rendered );
	}

	// AC-16 / AC-25: stored `dimRatio: 100` is relaxed (no -100 modifier class).
	public function test_default_dim_ratio_class_is_relaxed() {
		$bound_url = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$this->register_id_url_source( self::$override_attachment_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover"><img class="wp-block-cover__image-background" alt="" src="https://saved.example.com/old.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100" style="background-color:#123456"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block( $this->build_bound_cover_block( $saved_markup, array( 'dimRatio' => 100 ) ) );

		$this->assertStringNotContainsString( 'has-background-dim-100', $rendered );
		$this->assertStringContainsString( 'has-background-dim', $rendered );
		$this->assertStringNotContainsString( 'background-color:#123456', $rendered );
	}

	public function test_user_overlay_color_is_preserved() {
		$bound_url = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$this->register_id_url_source( self::$override_attachment_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover"><img class="wp-block-cover__image-background" alt="" src="https://saved.example.com/old.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim" style="background-color:#123456"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block(
			$this->build_bound_cover_block(
				$saved_markup,
				array(
					'dimRatio'           => 50,
					'isUserOverlayColor' => true,
				)
			)
		);

		$this->assertStringContainsString( 'background-color:#123456', $rendered );
	}

	// AC-17: non-default `dimRatio` is preserved untouched on bound covers.
	public function test_non_default_dim_ratio_is_preserved() {
		$bound_url = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$this->register_id_url_source( self::$override_attachment_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover"><img class="wp-block-cover__image-background" alt="" src="https://saved.example.com/old.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-70"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block( $this->build_bound_cover_block( $saved_markup, array( 'dimRatio' => 70 ) ) );

		$this->assertStringContainsString( 'has-background-dim-70', $rendered );
		$this->assertStringContainsString( 'src="' . esc_attr( $bound_url ) . '"', $rendered );
	}

	// AC-19: parallax/repeat `<div>` form is rebuilt as an `<img>` carrying the
	// bound URL / `wp-image-{id}` and no parallax/repeat classes.
	public function test_parallax_saved_markup_is_rebuilt_as_img() {
		$bound_url = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$bound_id  = self::$override_attachment_id;
		$this->register_id_url_source( $bound_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover has-parallax is-repeated"><div role="img" aria-label="" class="wp-block-cover__image-background wp-image-555 has-parallax is-repeated" style="background-position:50% 50%;background-image:url(https://saved.example.com/old.jpg)"></div><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block(
			$this->build_bound_cover_block(
				$saved_markup,
				array(
					'hasParallax' => true,
					'isRepeated'  => true,
				)
			)
		);

		$this->assertMatchesRegularExpression( '/<img[^>]*\bwp-block-cover__image-background\b[^>]*>/', $rendered );
		$this->assertStringNotContainsString( 'background-image:url(https://saved.example.com/old.jpg)', $rendered );
		// The rebuilt <img> must not carry has-parallax / is-repeated (the outer
		// wrapper MAY still — the bind path only rewrites the inner image).
		$this->assertDoesNotMatchRegularExpression( '/<img[^>]*\bwp-block-cover__image-background\b[^>]*\bhas-parallax\b/', $rendered );
		$this->assertDoesNotMatchRegularExpression( '/<img[^>]*\bwp-block-cover__image-background\b[^>]*\bis-repeated\b/', $rendered );
		$this->assertStringContainsString( 'src="' . esc_attr( $bound_url ) . '"', $rendered );
		$this->assertStringContainsString( 'wp-image-' . $bound_id, $rendered );
	}

	// AC-6: bindings with mismatched sources strip the saved image element.
	// AC-5: resolved URL with an `id` that is not an attachment (e.g. a post id)
	// strips the saved image — internal-only media is required.
	public function test_external_url_strips_image() {
		$bound_url = 'https://external.example.com/photo.jpg';
		$this->register_id_url_source( self::$post->ID, $bound_url ); // post id, not attachment.

		$rendered = render_block( $this->build_bound_cover_block( self::DEFAULT_SAVED_MARKUP ) );

		$this->assertStringNotContainsString( 'wp-block-cover__image-background', $rendered );
		$this->assertStringNotContainsString( $bound_url, $rendered );
	}

	// AC-18: `useFeaturedImage: true` + active binding -> binding wins; exactly
	// one `wp-block-cover__image-background` with the bound URL, no featured URL.
	public function test_use_featured_image_with_active_binding_emits_exactly_one_img_with_bound_url() {
		global $wp_query;
		$wp_query->in_the_loop = true;
		$wp_query->post        = self::$post;
		$wp_query->posts       = array( self::$post );
		$GLOBALS['post']       = self::$post;

		$bound_url    = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$featured_url = wp_get_attachment_image_url( self::$attachment_id, 'full' );
		$this->register_id_url_source( self::$override_attachment_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover"><img class="wp-block-cover__image-background" alt="" src="" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block(
			$this->build_bound_cover_block(
				$saved_markup,
				array(
					'useFeaturedImage' => true,
					'hasParallax'      => false,
					'isRepeated'       => false,
				)
			)
		);

		$this->assertSame( 1, substr_count( $rendered, esc_attr( $bound_url ) ) );
		$this->assertStringNotContainsString( $featured_url, $rendered );
		$this->assertSame( 1, preg_match_all( '/class="[^"]*\bwp-block-cover__image-background\b[^"]*"/', $rendered ) );
	}

	// AC-21: `backgroundType: 'embed-video'` short-circuits both filters.
	public function test_embed_video_short_circuits() {
		$bound_url = wp_get_attachment_image_url( self::$override_attachment_id, 'full' );
		$this->register_id_url_source( self::$override_attachment_id, $bound_url );

		$saved_markup = '<div class="wp-block-cover"><figure class="wp-block-cover__video-background wp-block-cover__embed-background wp-block-embed"><div class="wp-block-embed__wrapper">https://example.com/video</div></figure><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100"></span><div class="wp-block-cover__inner-container"></div></div>';
		$rendered     = render_block(
			$this->build_bound_cover_block(
				$saved_markup,
				array(
					'backgroundType' => 'embed-video',
					'url'            => 'https://example.com/video',
				)
			)
		);

		$this->assertStringNotContainsString( $bound_url, $rendered );
		$this->assertStringContainsString( 'has-background-dim-100', $rendered );
	}

	// AC-20: unbound covers render byte-identically with and without the filters.
	public function test_unbound_cover_is_byte_identical_to_trunk() {
		$saved_markup = '<div class="wp-block-cover"><img class="wp-block-cover__image-background wp-image-42" alt="" src="https://example.com/local.jpg" data-object-fit="cover"/><span aria-hidden="true" class="wp-block-cover__background has-background-dim has-background-dim-100"></span><div class="wp-block-cover__inner-container"></div></div>';
		$parsed_block = array(
			'blockName'    => 'core/cover',
			'attrs'        => array(
				'backgroundType' => 'image',
				'url'            => 'https://example.com/local.jpg',
				'id'             => 42,
				'dimRatio'       => 100,
			),
			'innerBlocks'  => array(),
			'innerHTML'    => $saved_markup,
			'innerContent' => array( $saved_markup ),
		);

		$with_filter = render_block( $parsed_block );

		remove_filter( 'render_block', 'gutenberg_cover_bindings_render_block', 9 );
		remove_filter( 'render_block_data', 'gutenberg_cover_bindings_prepare_block', 10 );
		$without_filter = render_block( $parsed_block );
		add_filter( 'render_block', 'gutenberg_cover_bindings_render_block', 9, 3 );
		add_filter( 'render_block_data', 'gutenberg_cover_bindings_prepare_block', 10, 3 );

		$this->assertSame( $without_filter, $with_filter );
	}
}
