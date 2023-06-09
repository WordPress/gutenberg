<?php
/**
 * Tests_Block_Template_Utils class
 *
 * @package WordPress
 */

class Tests_Block_Template_Utils extends WP_UnitTestCase {
	const TEST_THEME = 'emptytheme';

	private static $template_post;

	private static $template_part_post;

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		register_post_type(
			'custom_book',
			array(
				'public'       => true,
				'show_in_rest' => true,
			)
		);
		register_taxonomy( 'book_type', 'custom_book' );

		// Set up template post.
		self::$template_post = $factory->post->create_and_get(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => 'my_template',
				'post_title'   => 'My Template',
				'post_content' => 'Content',
				'post_excerpt' => 'Description of my template',
				'tax_input'    => array(
					'wp_theme' => array(
						self::TEST_THEME,
					),
				),
			)
		);

		wp_set_post_terms( self::$template_post->ID, self::TEST_THEME, 'wp_theme' );

		// Set up template part post.
		self::$template_part_post = $factory->post->create_and_get(
			array(
				'post_type'    => 'wp_template_part',
				'post_name'    => 'my_template_part',
				'post_title'   => 'My Template Part',
				'post_content' => 'Content',
				'post_excerpt' => 'Description of my template part',
				'tax_input'    => array(
					'wp_theme'              => array(
						self::TEST_THEME,
					),
					'wp_template_part_area' => array(
						WP_TEMPLATE_PART_AREA_HEADER,
					),
				),
			)
		);

		wp_set_post_terms( self::$template_part_post->ID, WP_TEMPLATE_PART_AREA_HEADER, 'wp_template_part_area' );
		wp_set_post_terms( self::$template_part_post->ID, self::TEST_THEME, 'wp_theme' );
	}

	public static function wpTearDownAfterClass() {
		unregister_post_type( 'custom_book' );
		unregister_taxonomy( 'book_type' );
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

	public function test_build_block_template_result_from_post() {
		$template = _gutenberg_build_block_template_result_from_post(
			self::$template_post,
			'wp_template'
		);

		$this->assertNotWPError( $template );
		$this->assertSame( get_stylesheet() . '//my_template', $template->id );
		$this->assertSame( get_stylesheet(), $template->theme );
		$this->assertSame( 'my_template', $template->slug );
		$this->assertSame( 'publish', $template->status );
		$this->assertSame( 'custom', $template->source );
		$this->assertSame( 'My Template', $template->title );
		$this->assertSame( 'Description of my template', $template->description );
		$this->assertSame( 'wp_template', $template->type );
		$this->assertSame( self::$template_post->post_modified, $template->modified );

		// Test template parts.
		$template_part = _gutenberg_build_block_template_result_from_post(
			self::$template_part_post,
			'wp_template_part'
		);

		$this->assertNotWPError( $template_part );
		$this->assertSame( get_stylesheet() . '//my_template_part', $template_part->id );
		$this->assertSame( get_stylesheet(), $template_part->theme );
		$this->assertSame( 'my_template_part', $template_part->slug );
		$this->assertSame( 'publish', $template_part->status );
		$this->assertSame( 'custom', $template_part->source );
		$this->assertSame( 'My Template Part', $template_part->title );
		$this->assertSame( 'Description of my template part', $template_part->description );
		$this->assertSame( 'wp_template_part', $template_part->type );
		$this->assertSame( WP_TEMPLATE_PART_AREA_HEADER, $template_part->area );
		$this->assertSame( self::$template_part_post->post_modified, $template->modified );
	}
}
