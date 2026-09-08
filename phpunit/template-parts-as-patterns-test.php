<?php
/**
 * Tests for template parts as patterns.
 *
 * @package Gutenberg
 * @group blocks
 */
class Template_Parts_As_Patterns_Test extends WP_UnitTestCase {

	public static function wpSetUpBeforeClass() {
		require_once __DIR__ . '/../lib/compat/wordpress-7.2/template-parts-as-patterns.php';
	}

	public function set_up() {
		parent::set_up();
		// The plugin runs the migration at bootstrap; let the test run it again.
		delete_option( 'gutenberg_template_parts_migrated' );
		register_block_pattern(
			'testtheme/part/header',
			array(
				'title'   => 'Header',
				'synced'  => true,
				'area'    => 'header',
				'content' => '<!-- wp:paragraph --><p>Site header</p><!-- /wp:paragraph -->',
			)
		);
		add_filter( 'render_block_data', 'gutenberg_map_template_part_block_to_pattern' );
		add_filter( 'hooked_block_types', 'gutenberg_map_template_part_hooked_block_types', 10, 3 );
		add_filter( 'hooked_block', 'gutenberg_filter_template_part_hooked_block', 10, 4 );
	}

	public function tear_down() {
		unregister_block_pattern( 'testtheme/part/header' );
		remove_filter( 'render_block_data', 'gutenberg_map_template_part_block_to_pattern' );
		remove_filter( 'hooked_block_types', 'gutenberg_map_template_part_hooked_block_types', 10 );
		remove_filter( 'hooked_block', 'gutenberg_filter_template_part_hooked_block', 10 );
		delete_option( 'gutenberg_template_parts_migrated' );
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_map_template_part_block_to_pattern
	 */
	public function test_template_part_block_renders_as_pattern_instance() {
		$this->assertSame(
			'<header class="wp-block-block"><p class="wp-block-paragraph">Site header</p></header>',
			do_blocks( '<!-- wp:template-part {"slug":"header","theme":"testtheme"} /-->' )
		);
		// The instance's own element wins over the area's.
		$this->assertSame(
			'<div class="wp-block-block"><p class="wp-block-paragraph">Site header</p></div>',
			do_blocks( '<!-- wp:template-part {"slug":"header","theme":"testtheme","tagName":"div"} /-->' )
		);
	}

	/**
	 * @covers ::gutenberg_map_template_part_block_to_pattern
	 */
	public function test_template_part_block_without_theme_uses_active_stylesheet() {
		$mapped = gutenberg_map_template_part_block_to_pattern(
			array(
				'blockName' => 'core/template-part',
				'attrs'     => array( 'slug' => 'header' ),
			)
		);
		$this->assertSame( 'core/block', $mapped['blockName'] );
		$this->assertSame( get_stylesheet() . '/part/header', $mapped['attrs']['slug'] );
		$this->assertTrue( $mapped['attrs']['hasWrapper'] );
		$this->assertArrayNotHasKey( 'theme', $mapped['attrs'] );
	}

	/**
	 * @covers ::gutenberg_migrate_template_parts_to_patterns
	 */
	public function test_migration_turns_template_part_posts_into_pattern_copies() {
		$part_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_name'    => 'header',
				'post_title'   => 'My header',
				'post_content' => '<!-- wp:paragraph --><p>Edited header</p><!-- /wp:paragraph -->',
			)
		);
		wp_set_post_terms( $part_id, array( 'testtheme' ), 'wp_theme' );
		wp_set_post_terms( $part_id, array( 'header' ), 'wp_template_part_area' );
		// Navigation overlays migrate like any other part.
		$overlay_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_template_part',
				'post_status' => 'publish',
				'post_name'   => 'overlay',
				'post_title'  => 'Navigation Overlay',
			)
		);
		wp_set_post_terms( $overlay_id, array( 'testtheme' ), 'wp_theme' );
		wp_set_post_terms( $overlay_id, array( 'navigation-overlay' ), 'wp_template_part_area' );

		gutenberg_migrate_template_parts_to_patterns();

		$this->assertSame( 'trash', get_post_status( $overlay_id ) );
		$overlay_copies = get_posts(
			array(
				'post_type'  => 'wp_block',
				'meta_key'   => 'wp_pattern_slug',
				'meta_value' => 'testtheme/part/overlay',
			)
		);
		$this->assertCount( 1, $overlay_copies );
		$this->assertSame( 'navigation-overlay', get_post_meta( $overlay_copies[0]->ID, 'wp_pattern_area', true ) );
		wp_delete_post( $overlay_copies[0]->ID, true );
		wp_delete_post( $overlay_id, true );

		$copies = get_posts(
			array(
				'post_type'   => 'wp_block',
				'post_status' => 'publish',
				'meta_key'    => 'wp_pattern_slug',
				'meta_value'  => 'testtheme/part/header',
			)
		);
		$this->assertCount( 1, $copies );
		$this->assertSame( 'My header', $copies[0]->post_title );
		$this->assertSame( 'header', get_post_meta( $copies[0]->ID, 'wp_pattern_area', true ) );
		$this->assertSame( 'trash', get_post_status( $part_id ) );

		// The copy now renders in place of the registered part.
		$this->assertSame(
			'<header class="wp-block-block"><p class="wp-block-paragraph">Edited header</p></header>',
			do_blocks( '<!-- wp:template-part {"slug":"header","theme":"testtheme"} /-->' )
		);

		wp_delete_post( $copies[0]->ID, true );
		wp_delete_post( $part_id, true );
	}

	/**
	 * @covers ::gutenberg_map_template_part_hooked_block_types
	 * @covers ::gutenberg_filter_template_part_hooked_block
	 */
	public function test_blocks_hooked_to_template_parts_hook_to_their_pattern_instances() {
		register_block_type(
			'test/hooked-after-header',
			array(
				'block_hooks'     => array( 'core/template-part' => 'after' ),
				'render_callback' => static function () {
					return '<p class="hooked">Hooked</p>';
				},
			)
		);
		try {
			$content = apply_block_hooks_to_content( '<!-- wp:block {"slug":"testtheme/part/header","hasWrapper":true} /-->', null, 'insert_hooked_blocks' );
			$this->assertStringContainsString( 'wp:test/hooked-after-header', $content );

			// A pattern instance that is not a template part is left alone.
			$content = apply_block_hooks_to_content( '<!-- wp:block {"slug":"testtheme/card","hasWrapper":true} /-->', null, 'insert_hooked_blocks' );
			$this->assertStringNotContainsString( 'wp:test/hooked-after-header', $content );
		} finally {
			unregister_block_type( 'test/hooked-after-header' );
		}
	}

	/**
	 * The core test fixtures provide `block-theme` with a `small-header` part
	 * and `block-theme-child` without parts of its own.
	 *
	 * @covers ::gutenberg_register_template_parts_as_patterns
	 * @covers ::gutenberg_map_template_part_block_to_pattern
	 */
	public function test_child_theme_parts_register_under_the_child_stylesheet() {
		$previous = get_stylesheet();
		switch_theme( 'block-theme-child' );
		$registry = WP_Block_Patterns_Registry::get_instance();
		try {
			gutenberg_register_template_parts_as_patterns();

			$this->assertTrue( $registry->is_registered( 'block-theme-child/part/small-header' ), 'A part inherited from the parent theme registers under the child.' );
			$this->assertFalse( $registry->is_registered( 'block-theme/part/small-header' ) );
			$pattern = $registry->get_registered( 'block-theme-child/part/small-header' );
			$this->assertSame( 'Small Header', $pattern['title'] );
			$this->assertSame( 'header', $pattern['area'] );
			$this->assertNotEmpty( $pattern['content'] );

			// A reference to the parent theme resolves to the child's part.
			$mapped = gutenberg_map_template_part_block_to_pattern(
				array(
					'blockName' => 'core/template-part',
					'attrs'     => array(
						'slug'  => 'small-header',
						'theme' => 'block-theme',
					),
				)
			);
			$this->assertSame( 'block-theme-child/part/small-header', $mapped['attrs']['slug'] );
			// Rendered as a pattern instance wrapped in the area's element.
			$this->assertSame(
				'<header class="wp-block-block">' . do_blocks( $pattern['content'] ) . '</header>',
				do_blocks( '<!-- wp:template-part {"slug":"small-header"} /-->' )
			);
		} finally {
			unregister_block_pattern( 'block-theme-child/part/small-header' );
			switch_theme( $previous );
		}
	}

	/**
	 * @covers ::gutenberg_migrate_template_part_post
	 * @covers ::gutenberg_map_template_part_block_to_pattern
	 */
	public function test_custom_part_migrates_to_a_user_pattern() {
		$part_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_name'    => 'promo',
				'post_title'   => 'Promo',
				'post_content' => '<!-- wp:paragraph --><p>Promo content</p><!-- /wp:paragraph -->',
			)
		);
		wp_set_post_terms( $part_id, array( get_stylesheet() ), 'wp_theme' );
		wp_set_post_terms( $part_id, array( 'footer' ), 'wp_template_part_area' );

		$copy_id = gutenberg_migrate_template_part_post( get_post( $part_id ) );

		$this->assertIsInt( $copy_id );
		$this->assertSame( 'trash', get_post_status( $part_id ) );
		$copy = get_post( $copy_id );
		$this->assertSame( 'wp_block', $copy->post_type );
		$this->assertSame( 'promo', $copy->post_name );
		$this->assertSame( '', get_post_meta( $copy_id, 'wp_pattern_slug', true ), 'A custom part is a user pattern, not a customization.' );
		$this->assertSame( 'footer', get_post_meta( $copy_id, 'wp_pattern_area', true ) );
		$this->assertContains( 'footer', wp_get_object_terms( $copy_id, 'wp_pattern_category', array( 'fields' => 'slugs' ) ) );

		// Template part blocks reference it by id, with its area.
		$mapped = gutenberg_map_template_part_block_to_pattern(
			array(
				'blockName' => 'core/template-part',
				'attrs'     => array( 'slug' => 'promo' ),
			)
		);
		$this->assertSame( 'core/block', $mapped['blockName'] );
		$this->assertSame( $copy_id, $mapped['attrs']['ref'] );
		$this->assertSame( 'footer', $mapped['attrs']['area'] );
		$this->assertArrayNotHasKey( 'slug', $mapped['attrs'] );
		$this->assertSame(
			'<footer class="wp-block-block"><p class="wp-block-paragraph">Promo content</p></footer>',
			do_blocks( '<!-- wp:template-part {"slug":"promo"} /-->' )
		);
		$this->assertArrayHasKey( 'promo', gutenberg_get_user_template_parts() );

		wp_delete_post( $copy_id, true );
		wp_delete_post( $part_id, true );
	}
}
