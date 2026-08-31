<?php
/**
 * Tests for extending the default (reserved) block template types with
 * post-type- and taxonomy-specific hierarchy templates.
 *
 * @see gutenberg_extend_default_template_types_with_registered_types()
 * @see https://github.com/WordPress/gutenberg/issues/79696
 */
class Tests_Get_Default_Block_Template_Types extends WP_UnitTestCase {
	private $theme_root;

	public function set_up() {
		parent::set_up();

		// Point the active theme at Gutenberg's own fixtures, which ship the
		// templates this test relies on (the shared `block-theme` name also exists
		// in core's test fixtures, so force resolution to this copy).
		$this->theme_root = realpath( __DIR__ . '/data/themedir1' );
		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		switch_theme( 'block-theme' );
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	public function test_registered_post_type_hierarchy_templates_are_reserved() {
		register_post_type(
			'book',
			array(
				'public'      => true,
				'has_archive' => true,
				'labels'      => array(
					'name'          => 'Books',
					'singular_name' => 'Book',
				),
			)
		);

		$types = get_default_block_template_types();

		$this->assertArrayHasKey( 'single-book', $types, 'single-{post_type} should be reserved.' );
		$this->assertArrayHasKey( 'archive-book', $types, 'archive-{post_type} should be reserved when the post type has an archive.' );
		$this->assertSame( 'Single item: Book', $types['single-book']['title'] );
		$this->assertSame( 'Archive: Books', $types['archive-book']['title'] );

		unregister_post_type( 'book' );
	}

	public function test_registered_taxonomy_template_is_reserved() {
		register_taxonomy(
			'genre',
			'post',
			array(
				'public' => true,
				'labels' => array(
					'name'          => 'Genres',
					'singular_name' => 'Genre',
				),
			)
		);

		$types = get_default_block_template_types();

		$this->assertArrayHasKey( 'taxonomy-genre', $types, 'taxonomy-{taxonomy} should be reserved.' );
		$this->assertSame( 'Taxonomy: Genre', $types['taxonomy-genre']['title'] );

		unregister_taxonomy( 'genre' );
	}

	public function test_archive_not_reserved_for_post_type_without_archive() {
		register_post_type(
			'note',
			array(
				'public'      => true,
				'has_archive' => false,
			)
		);

		$types = get_default_block_template_types();

		$this->assertArrayHasKey( 'single-note', $types, 'single-{post_type} should still be reserved.' );
		$this->assertArrayNotHasKey( 'archive-note', $types, 'archive-{post_type} should not be reserved without an archive.' );

		unregister_post_type( 'note' );
	}

	/**
	 * The reported bug: a theme `archive-{post_type}.html` file with no explicit
	 * `postTypes` metadata must not be offered in a singular post's template
	 * picker. Meanwhile templates that are not hierarchy templates for a
	 * registered type must still be offered, so the fix does not over-exclude.
	 *
	 * The `block-theme` fixture ships:
	 * - `archive-book.html`         — hierarchy template for the registered `book` CPT.
	 * - `single-featured.html`      — looks like a hierarchy slug, but `featured` is
	 *                                 not a registered post type, so it is a generic
	 *                                 custom template.
	 * - `custom-hero-template.html` — a plain generic custom template.
	 */
	public function test_archive_template_is_not_offered_for_singular_post_type() {
		register_post_type(
			'book',
			array(
				'public'      => true,
				'has_archive' => true,
			)
		);

		$slugs = wp_list_pluck( get_block_templates( array( 'post_type' => 'book' ), 'wp_template' ), 'slug' );

		$this->assertNotContains( 'archive-book', $slugs, 'The archive template must not leak into the singular picker.' );
		$this->assertContains( 'single-featured', $slugs, 'A hierarchy-looking template for an unregistered type must not be over-excluded.' );
		$this->assertContains( 'custom-hero-template', $slugs, 'A generic custom template should still be offered.' );

		unregister_post_type( 'book' );
	}
}
