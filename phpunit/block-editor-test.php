<?php
/**
 * WP_Block Tests
 *
 * @package Gutenberg
 * @subpackage Blocks
 * @since 10.5.0
 */

/**
 * Tests for the block editor methods.
 *
 * This is a temporary solution until the Gutenberg plugin sets
 * the required WordPress version to 5.8.
 *
 * @since 10.5.0
 *
 * @group blocks
 */
class WP_Test_Block_Editor extends WP_UnitTestCase {

	/**
	 * Sets up each test method.
	 */
	public function setUp() {
		global $post;

		parent::setUp();

		$args = array(
			'post_title' => 'Example',
		);

		$post = $this->factory()->post->create_and_get( $args );
	}

	function filter_set_block_categories_post( $block_categories, $post ) {
		if ( empty( $post ) ) {
			return $block_categories;
		}

		return array(
			array(
				'slug'  => 'filtered-category',
				'title' => 'Filtered Category',
				'icon'  => null,
			),
		);
	}

	function filter_set_allowed_block_types_post( $allowed_block_types, $post ) {
		if ( empty( $post ) ) {
			return $allowed_block_types;
		}

		return array( 'test/filtered-block' );
	}

	function filter_set_block_editor_settings_post( $editor_settings, $post ) {
		if ( empty( $post ) ) {
			return $editor_settings;
		}

		return array(
			'filter' => 'deprecated',
		);
	}

	/**
	 * @ticket 52920
	 * @expectedDeprecated block_categories
	 */
	function test_get_block_categories_deprecated_filter_post_object() {
		add_filter( 'block_categories', array( $this, 'filter_set_block_categories_post' ), 10, 2 );

		$block_categories = gutenberg_get_block_categories( get_post() );

		remove_filter( 'block_categories', array( $this, 'filter_set_block_categories_post' ) );

		$this->assertSameSets(
			array(
				array(
					'slug'  => 'filtered-category',
					'title' => 'Filtered Category',
					'icon'  => null,
				),
			),
			$block_categories
		);
	}

	/**
	 * @ticket 52920
	 * @expectedDeprecated block_categories
	 */
	function test_get_block_categories_deprecated_filter_post_editor() {
		add_filter( 'block_categories', array( $this, 'filter_set_block_categories_post' ), 10, 2 );

		$block_categories = gutenberg_get_block_categories( 'post-editor' );

		remove_filter( 'block_categories', array( $this, 'filter_set_block_categories_post' ) );

		$this->assertSameSets(
			array(
				array(
					'slug'  => 'filtered-category',
					'title' => 'Filtered Category',
					'icon'  => null,
				),
			),
			$block_categories
		);
	}

	/**
	 * @ticket 52920
	 */
	function test_get_allowed_block_types_default() {
		$allowed_block_types = gutenberg_get_allowed_block_types( 'post-editor' );

		$this->assertTrue( $allowed_block_types );
	}

	/**
	 * @ticket 52920
	 * @expectedDeprecated allowed_block_types
	 */
	function test_get_allowed_block_types_deprecated_filter_post_editor() {
		add_filter( 'allowed_block_types', array( $this, 'filter_set_allowed_block_types_post' ), 10, 2 );

		$allowed_block_types = gutenberg_get_allowed_block_types( 'post-editor' );

		remove_filter( 'allowed_block_types', array( $this, 'filter_set_allowed_block_types_post' ) );

		$this->assertSameSets( array( 'test/filtered-block' ), $allowed_block_types );
	}

	/**
	 * @ticket 52920
	 */
	function test_get_default_block_editor_settings() {
		$settings = gutenberg_get_default_block_editor_settings();

		$this->assertCount( 17, $settings );
		$this->assertTrue( $settings['__unstableEnableFullSiteEditingBlocks'] );
		$this->assertFalse( $settings['alignWide'] );
		$this->assertInternalType( 'array', $settings['allowedMimeTypes'] );
		$this->assertTrue( $settings['allowedBlockTypes'] );
		$this->assertSameSets(
			array(
				array(
					'slug'  => 'text',
					'title' => 'Text',
					'icon'  => null,
				),
				array(
					'slug'  => 'media',
					'title' => 'Media',
					'icon'  => null,
				),
				array(
					'slug'  => 'design',
					'title' => 'Design',
					'icon'  => null,
				),
				array(
					'slug'  => 'widgets',
					'title' => 'Widgets',
					'icon'  => null,
				),
				array(
					'slug'  => 'theme',
					'title' => 'Theme',
					'icon'  => null,
				),
				array(
					'slug'  => 'embed',
					'title' => 'Embeds',
					'icon'  => null,
				),
				array(
					'slug'  => 'reusable',
					'title' => 'Reusable Blocks',
					'icon'  => null,
				),
			),
			$settings['blockCategories']
		);
		$this->assertFalse( $settings['disableCustomColors'] );
		$this->assertFalse( $settings['disableCustomFontSizes'] );
		$this->assertFalse( $settings['disableCustomGradients'] );
		$this->assertFalse( $settings['enableCustomLineHeight'] );
		$this->assertFalse( $settings['enableCustomSpacing'] );
		$this->assertFalse( $settings['enableCustomUnits'] );
		$this->assertFalse( $settings['isRTL'] );
		$this->assertSame( 'large', $settings['imageDefaultSize'] );
		$this->assertSameSets(
			array(
				array(
					'width'  => 150,
					'height' => 150,
					'crop'   => true,
				),
				array(
					'width'  => 300,
					'height' => 300,
					'crop'   => false,
				),
				array(
					'width'  => 1024,
					'height' => 1024,
					'crop'   => false,
				),
			),
			$settings['imageDimensions']
		);
		$this->assertTrue( $settings['imageEditing'] );
		$this->assertSameSets(
			array(
				array(
					'slug' => 'full',
					'name' => 'Full Size',
				),
				array(
					'slug' => 'large',
					'name' => 'Large',
				),
				array(
					'slug' => 'medium',
					'name' => 'Medium',
				),
				array(
					'slug' => 'thumbnail',
					'name' => 'Thumbnail',
				),
			),
			$settings['imageSizes']
		);
		$this->assertInternalType( 'int', $settings['maxUploadFileSize'] );
	}

	/**
	 * @ticket 52920
	 */
	function test_get_block_editor_settings_overrides_default_settings_all_editors() {
		function filter_allowed_block_types_my_editor() {
			return array( 'test/filtered-my-block' );
		}
		function filter_block_categories_my_editor() {
			return array(
				array(
					'slug'  => 'filtered-my-category',
					'title' => 'Filtered My Category',
					'icon'  => null,
				),
			);
		}
		function filter_block_editor_settings_my_editor( $editor_settings ) {
			$editor_settings['maxUploadFileSize'] = 12345;

			return $editor_settings;
		}

		add_filter( 'allowed_block_types_all', 'filter_allowed_block_types_my_editor', 10, 1 );
		add_filter( 'block_categories_all', 'filter_block_categories_my_editor', 10, 1 );
		add_filter( 'block_editor_settings_all', 'filter_block_editor_settings_my_editor', 10, 1 );

		$settings = gutenberg_get_block_editor_settings( 'my-editor' );

		remove_filter( 'allowed_block_types_all', 'filter_allowed_block_types_my_editor' );
		remove_filter( 'block_categories_all', 'filter_block_categories_my_editor' );
		remove_filter( 'block_editor_settings_all', 'filter_block_editor_settings_my_editor' );

		$this->assertSameSets( array( 'test/filtered-my-block' ), $settings['allowedBlockTypes'] );
		$this->assertSameSets(
			array(
				array(
					'slug'  => 'filtered-my-category',
					'title' => 'Filtered My Category',
					'icon'  => null,
				),
			),
			$settings['blockCategories']
		);
		$this->assertSame( 12345, $settings['maxUploadFileSize'] );
	}

	/**
	 * @ticket 52920
	 * @expectedDeprecated block_editor_settings
	 */
	function test_get_block_editor_settings_deprecated_filter_post_editor() {
		// This filter needs to run last to account for other filters registered in the plugin.
		add_filter( 'block_editor_settings', array( $this, 'filter_set_block_editor_settings_post' ), PHP_INT_MAX, 2 );

		$settings = gutenberg_get_block_editor_settings( 'post-editor' );

		remove_filter( 'block_editor_settings', array( $this, 'filter_set_block_editor_settings_post' ) );

		$this->assertSameSets(
			array(
				'filter' => 'deprecated',
			),
			$settings
		);
	}
}
