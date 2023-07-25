<?php
/**
 * Tests_Block_Template_Utils class
 *
 * @package WordPress
 */

class Tests_Block_Template_Utils extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
		register_post_type(
			'custom_book',
			array(
				'public'       => true,
				'show_in_rest' => true,
			)
		);
		register_taxonomy( 'book_type', 'custom_book' );
	}

	public function tear_down() {
		unregister_post_type( 'custom_book' );
		unregister_taxonomy( 'book_type' );
		parent::tear_down();
	}

	public function test_get_template_hierarchy() {
		$hierarchy = gutenberg_get_template_hierarchy( 'front-page' );
		$this->assertEquals( array( 'front-page', 'home', 'index' ), $hierarchy );
		// Custom templates.
		$hierarchy = gutenberg_get_template_hierarchy( 'whatever-slug', true );
		$this->assertEquals( array( 'page', 'singular', 'index' ), $hierarchy );
		// Single slug templates(ex. page, tag, author, etc..
		$hierarchy = gutenberg_get_template_hierarchy( 'page' );
		$this->assertEquals( array( 'page', 'singular', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'tag' );
		$this->assertEquals( array( 'tag', 'archive', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'author' );
		$this->assertEquals( array( 'author', 'archive', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'date' );
		$this->assertEquals( array( 'date', 'archive', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy' );
		$this->assertEquals( array( 'taxonomy', 'archive', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'attachment' );
		$this->assertEquals(
			array(
				'attachment',
				'single',
				'singular',
				'index',
			),
			$hierarchy
		);
		$hierarchy = gutenberg_get_template_hierarchy( 'singular' );
		$this->assertEquals( array( 'singular', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'single' );
		$this->assertEquals( array( 'single', 'singular', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'archive' );
		$this->assertEquals( array( 'archive', 'index' ), $hierarchy );
		$hierarchy = gutenberg_get_template_hierarchy( 'index' );
		$this->assertEquals( array( 'index' ), $hierarchy );

		// Taxonomies.
		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy-book_type', false );
		$this->assertEquals( array( 'taxonomy-book_type', 'taxonomy', 'archive', 'index' ), $hierarchy );

		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy-books', false, 'taxonomy-books' );
		$this->assertEquals( array( 'taxonomy-books', 'taxonomy', 'archive', 'index' ), $hierarchy );
		// Single word category.
		$hierarchy = gutenberg_get_template_hierarchy( 'category-fruits', false );
		$this->assertEquals(
			array(
				'category-fruits',
				'category',
				'archive',
				'index',
			),
			$hierarchy
		);

		$hierarchy = gutenberg_get_template_hierarchy( 'category-fruits', false, 'category' );
		$this->assertEquals(
			array(
				'category-fruits',
				'category',
				'archive',
				'index',
			),
			$hierarchy
		);
		// Multi word category.
		$hierarchy = gutenberg_get_template_hierarchy( 'category-fruits-yellow', false );
		$this->assertEquals(
			array(
				'category-fruits-yellow',
				'category',
				'archive',
				'index',
			),
			$hierarchy
		);

		$hierarchy = gutenberg_get_template_hierarchy( 'category-fruits-yellow', false, 'category' );
		$this->assertEquals(
			array(
				'category-fruits-yellow',
				'category',
				'archive',
				'index',
			),
			$hierarchy
		);
		// Single word taxonomy.
		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy-books-action', false, 'taxonomy-books' );
		$this->assertEquals(
			array(
				'taxonomy-books-action',
				'taxonomy-books',
				'taxonomy',
				'archive',
				'index',
			),
			$hierarchy
		);

		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy-book_type-adventure', false );
		$this->assertEquals( array( 'taxonomy-book_type-adventure', 'taxonomy-book_type', 'taxonomy', 'archive', 'index' ), $hierarchy );

		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy-books-action-adventure', false, 'taxonomy-books' );
		$this->assertEquals(
			array(
				'taxonomy-books-action-adventure',
				'taxonomy-books',
				'taxonomy',
				'archive',
				'index',
			),
			$hierarchy
		);
		// Multi word taxonomy/terms.
		$hierarchy = gutenberg_get_template_hierarchy( 'taxonomy-greek-books-action-adventure', false, 'taxonomy-greek-books' );
		$this->assertEquals(
			array(
				'taxonomy-greek-books-action-adventure',
				'taxonomy-greek-books',
				'taxonomy',
				'archive',
				'index',
			),
			$hierarchy
		);
		// Post types.
		$hierarchy = gutenberg_get_template_hierarchy( 'single-book', false, 'single-book' );
		$this->assertEquals(
			array(
				'single-book',
				'single',
				'singular',
				'index',
			),
			$hierarchy
		);
		$hierarchy = gutenberg_get_template_hierarchy( 'single-art-project', false, 'single-art-project' );
		$this->assertEquals(
			array(
				'single-art-project',
				'single',
				'singular',
				'index',
			),
			$hierarchy
		);
		$hierarchy = gutenberg_get_template_hierarchy( 'single-art-project-imagine', false, 'single-art-project' );
		$this->assertEquals(
			array(
				'single-art-project-imagine',
				'single-art-project',
				'single',
				'singular',
				'index',
			),
			$hierarchy
		);

		$hierarchy = gutenberg_get_template_hierarchy( 'single-custom_book', false );
		$this->assertEquals(
			array(
				'single-custom_book',
				'single',
				'singular',
				'index',
			),
			$hierarchy
		);

		$hierarchy = gutenberg_get_template_hierarchy( 'single-custom_book-book-1', false );
		$this->assertEquals(
			array(
				'single-custom_book-book-1',
				'single-custom_book',
				'single',
				'singular',
				'index',
			),
			$hierarchy
		);

		$hierarchy = gutenberg_get_template_hierarchy( 'page-hi', false, 'page' );
		$this->assertEquals(
			array(
				'page-hi',
				'page',
				'singular',
				'index',
			),
			$hierarchy
		);
		$hierarchy = gutenberg_get_template_hierarchy( 'page-hi', false );
		$this->assertEquals(
			array(
				'page-hi',
				'page',
				'singular',
				'index',
			),
			$hierarchy
		);
		// Authors.
		$hierarchy = gutenberg_get_template_hierarchy( 'author-rigas', false, 'author' );
		$this->assertEquals(
			array(
				'author-rigas',
				'author',
				'archive',
				'index',
			),
			$hierarchy
		);
		// Archive post types.
		$hierarchy = gutenberg_get_template_hierarchy( 'archive-book', false );
		$this->assertEquals(
			array(
				'archive-book',
				'archive',
				'index',
			),
			$hierarchy
		);
	}
}
