<?php
/**
 * Tests for the template inheritance experiment.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_get_template_parent
 * @covers ::gutenberg_get_template_ancestors
 * @covers ::gutenberg_update_template_parent
 * @covers ::gutenberg_template_inheritance_compose
 */
class Gutenberg_Template_Inheritance_Test extends WP_UnitTestCase {

	const SLOT = '<!-- wp:post-content /-->';

	public function tear_down() {
		global $_wp_current_template_id, $_wp_current_template_content;
		$_wp_current_template_id                         = null;
		$_wp_current_template_content                    = null;
		$GLOBALS['gutenberg_template_inheritance_slots'] = array();
		parent::tear_down();
	}

	/**
	 * Creates a template for the active theme.
	 *
	 * @param string $slug        Template slug.
	 * @param string $content     Template content.
	 * @param string $parent_slug Parent template slug.
	 * @return WP_Block_Template The template.
	 */
	private function create_template( $slug, $content, $parent_slug = '' ) {
		$post_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => $slug,
				'post_title'   => $slug,
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);
		wp_set_post_terms( $post_id, get_stylesheet(), 'wp_theme' );
		if ( $parent_slug ) {
			update_post_meta( $post_id, GUTENBERG_TEMPLATE_PARENT_META_KEY, $parent_slug );
		}
		return get_block_template( get_stylesheet() . '//' . $slug, 'wp_template' );
	}

	private static function paragraph( $text ) {
		return '<!-- wp:paragraph --><p>' . $text . '</p><!-- /wp:paragraph -->';
	}

	public function test_ancestors_are_returned_closest_first() {
		$this->create_template( 'shell', self::paragraph( 'Shell' ) . self::SLOT );
		$this->create_template( 'blog', self::paragraph( 'Blog' ) . self::SLOT, 'shell' );
		$single = $this->create_template( 'single', self::paragraph( 'Single' ), 'blog' );

		$ancestors = gutenberg_get_template_ancestors( $single );

		$this->assertSame( array( 'blog', 'shell' ), wp_list_pluck( $ancestors, 'slug' ) );
	}

	public function test_ancestors_stop_at_a_parent_without_a_content_block() {
		$this->create_template( 'shell', self::paragraph( 'Shell' ) );
		$single = $this->create_template( 'single', self::paragraph( 'Single' ), 'shell' );

		$this->assertSame( array(), gutenberg_get_template_ancestors( $single ) );
	}

	public function test_ancestors_stop_at_a_cycle() {
		$this->create_template( 'a', self::SLOT, 'b' );
		$this->create_template( 'b', self::SLOT, 'c' );
		$c = $this->create_template( 'c', self::SLOT, 'a' );

		$this->assertSame( array( 'a', 'b' ), wp_list_pluck( gutenberg_get_template_ancestors( $c ), 'slug' ) );
	}

	public function test_compose_renders_each_template_inside_its_parent() {
		global $_wp_current_template_id, $_wp_current_template_content;

		$this->create_template( 'shell', self::paragraph( 'Shell' ) . self::SLOT );
		$this->create_template( 'blog', self::paragraph( 'Blog' ) . self::SLOT, 'shell' );
		$single = $this->create_template( 'single', self::paragraph( 'Single' ), 'blog' );

		$_wp_current_template_id      = $single->id;
		$_wp_current_template_content = $single->content;

		$this->assertSame( 'template.php', gutenberg_template_inheritance_compose( 'template.php' ) );

		$html = do_blocks( $_wp_current_template_content );

		$this->assertMatchesRegularExpression(
			'#<p>Shell</p>\s*<p>Blog</p>\s*<p>Single</p>#',
			$html,
			'Each child template should render in place of its parent\'s Content block, with no wrapper.'
		);
		$this->assertStringNotContainsString( 'gutenberg-template-slot', $html );
		$this->assertSame( array(), $GLOBALS['gutenberg_template_inheritance_slots'] );
	}

	public function test_compose_leaves_a_template_without_a_parent_alone() {
		global $_wp_current_template_id, $_wp_current_template_content;

		$single = $this->create_template( 'single', self::paragraph( 'Single' ) );

		$_wp_current_template_id      = $single->id;
		$_wp_current_template_content = $single->content;

		gutenberg_template_inheritance_compose( 'template.php' );

		$this->assertSame( $single->content, $_wp_current_template_content );
		$this->assertSame( array(), $GLOBALS['gutenberg_template_inheritance_slots'] );
	}

	public function test_update_saves_and_removes_the_parent() {
		$this->create_template( 'shell', self::SLOT );
		$single = $this->create_template( 'single', self::paragraph( 'Single' ) );

		$this->assertTrue( gutenberg_update_template_parent( 'shell', $single ) );
		$this->assertSame( 'shell', gutenberg_get_template_parent( $single ) );

		$this->assertTrue( gutenberg_update_template_parent( '', $single ) );
		$this->assertSame( '', gutenberg_get_template_parent( $single ) );
	}

	public function test_update_rejects_invalid_parents() {
		$single = $this->create_template( 'single', self::SLOT );
		$this->create_template( 'blog', self::SLOT, 'single' );

		$this->assertWPError( gutenberg_update_template_parent( 'single', $single ), 'A template should not be its own parent.' );
		$this->assertWPError( gutenberg_update_template_parent( 'missing', $single ), 'A parent should exist.' );
		$this->assertWPError( gutenberg_update_template_parent( 'blog', $single ), 'A parent should not already render inside the template.' );
	}
}
