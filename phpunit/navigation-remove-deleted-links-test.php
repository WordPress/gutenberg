<?php
/**
 * Tests for removing bound links to deleted posts and terms from Navigation Menus.
 *
 * @package gutenberg
 */

/**
 * @covers ::gutenberg_navigation_remove_links_to_deleted_post
 * @covers ::gutenberg_navigation_remove_links_to_deleted_term
 */
class Gutenberg_Navigation_Remove_Deleted_Links_Test extends WP_UnitTestCase {

	public function tear_down() {
		foreach ( array( 'wp_navigation', 'page', 'post' ) as $post_type ) {
			$posts = get_posts(
				array(
					'post_type'      => $post_type,
					'post_status'    => 'any',
					'posts_per_page' => -1,
					'fields'         => 'ids',
				)
			);
			foreach ( $posts as $post_id ) {
				wp_delete_post( $post_id, true );
			}
		}
		parent::tear_down();
	}

	private function create_menu( $content ) {
		return self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_title'   => 'Menu',
				'post_content' => $content,
			)
		);
	}

	private function link( $attrs ) {
		return '<!-- wp:navigation-link ' . wp_json_encode( $attrs ) . ' /-->';
	}

	private function submenu( $attrs, $inner ) {
		return '<!-- wp:navigation-submenu ' . wp_json_encode( $attrs ) . ' -->' . $inner . '<!-- /wp:navigation-submenu -->';
	}

	/**
	 * The URL binding the editor adds to a link picked from the link UI.
	 */
	private function binding( $source ) {
		return array(
			'bindings' => array(
				'url' => array(
					'source' => $source,
					'args'   => array( 'field' => 'link' ),
				),
			),
		);
	}

	private function page_attrs( $page_id, $label = 'Page', $bound = true ) {
		$attrs = array(
			'label' => $label,
			'type'  => 'page',
			'id'    => $page_id,
			'url'   => get_permalink( $page_id ),
			'kind'  => 'post-type',
		);
		if ( $bound ) {
			$attrs['metadata'] = $this->binding( 'core/post-data' );
		}
		return $attrs;
	}

	private function page_link( $page_id, $label = 'Page', $bound = true ) {
		return $this->link( $this->page_attrs( $page_id, $label, $bound ) );
	}

	private function term_link( $term_id, $type, $label, $bound = true ) {
		$attrs = array(
			'label' => $label,
			'type'  => $type,
			'id'    => $term_id,
			'url'   => home_url( '/' . $type . '/' ),
			'kind'  => 'taxonomy',
		);
		if ( $bound ) {
			$attrs['metadata'] = $this->binding( 'core/term-data' );
		}
		return $this->link( $attrs );
	}

	private function custom_link( $label = 'Home' ) {
		return $this->link(
			array(
				'label' => $label,
				'url'   => home_url( '/' ),
				'kind'  => 'custom',
			)
		);
	}

	/**
	 * Returns the named blocks in a menu, without the whitespace between them.
	 */
	private function get_menu_blocks( $menu_id ) {
		return $this->named_blocks( parse_blocks( get_post( $menu_id )->post_content ) );
	}

	private function named_blocks( $blocks ) {
		$named = array();
		foreach ( $blocks as $block ) {
			if ( null === $block['blockName'] ) {
				continue;
			}
			$block['innerBlocks'] = $this->named_blocks( $block['innerBlocks'] );
			$named[]              = $block;
		}
		return $named;
	}

	private function count_menu_saves() {
		$mock = new MockAction();
		add_action( 'save_post_wp_navigation', array( $mock, 'action' ) );
		return $mock;
	}

	/*
	 * Posts.
	 */

	public function test_deleting_a_page_removes_its_bound_link_from_the_menu() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$menu_id = $this->create_menu( $this->custom_link() . $this->page_link( $page_id ) . $this->custom_link( 'About' ) );

		wp_delete_post( $page_id, true );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 2, $blocks );
		$this->assertSame( array( 'Home', 'About' ), array_column( array_column( $blocks, 'attrs' ), 'label' ) );
	}

	public function test_deleting_a_post_of_another_post_type_removes_its_bound_link() {
		$post_id = self::factory()->post->create();
		$menu_id = $this->create_menu(
			$this->link(
				array(
					'label'    => 'Post',
					'type'     => 'post',
					'id'       => $post_id,
					'url'      => get_permalink( $post_id ),
					'kind'     => 'post-type',
					'metadata' => $this->binding( 'core/post-data' ),
				)
			)
		);

		wp_delete_post( $post_id, true );

		$this->assertSame( array(), $this->get_menu_blocks( $menu_id ) );
	}

	public function test_links_without_a_url_binding_are_kept() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$menu_id = $this->create_menu(
			$this->page_link( $page_id, 'Unbound', false ) .
			$this->submenu( $this->page_attrs( $page_id, 'Unbound submenu', false ), $this->custom_link( 'Child' ) )
		);
		$before  = get_post( $menu_id )->post_content;
		$saves   = $this->count_menu_saves();

		wp_delete_post( $page_id, true );

		$this->assertSame( 0, $saves->get_call_count() );
		$this->assertSame( $before, get_post( $menu_id )->post_content );
	}

	public function test_a_link_nested_in_a_submenu_is_removed_and_the_submenu_is_kept() {
		$parent_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$child_id  = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$menu_id   = $this->create_menu(
			$this->submenu(
				$this->page_attrs( $parent_id, 'Parent' ),
				$this->page_link( $child_id, 'Child' ) . $this->custom_link( 'Sibling' )
			)
		);

		wp_delete_post( $child_id, true );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/navigation-submenu', $blocks[0]['blockName'] );
		$this->assertSame( $parent_id, $blocks[0]['attrs']['id'] );
		$this->assertCount( 1, $blocks[0]['innerBlocks'] );
		$this->assertSame( 'Sibling', $blocks[0]['innerBlocks'][0]['attrs']['label'] );
	}

	public function test_a_submenu_bound_to_the_deleted_page_keeps_its_label_and_children() {
		$parent_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$child_id  = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$attrs     = $this->page_attrs( $parent_id, 'Parent' );

		$attrs['opensInNewTab'] = true;
		$menu_id                = $this->create_menu( $this->submenu( $attrs, $this->page_link( $child_id, 'Child' ) ) );

		wp_delete_post( $parent_id, true );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/navigation-submenu', $blocks[0]['blockName'] );
		$this->assertSame(
			array(
				'label'         => 'Parent',
				'opensInNewTab' => true,
			),
			$blocks[0]['attrs']
		);
		$this->assertCount( 1, $blocks[0]['innerBlocks'] );
		$this->assertSame( $child_id, $blocks[0]['innerBlocks'][0]['attrs']['id'] );
	}

	public function test_every_menu_with_a_bound_link_to_the_deleted_page_is_updated() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$first   = $this->create_menu( $this->page_link( $page_id ) );
		$second  = $this->create_menu( $this->custom_link() . $this->page_link( $page_id ) );
		$draft   = $this->create_menu( $this->page_link( $page_id ) );
		wp_update_post(
			array(
				'ID'          => $draft,
				'post_status' => 'draft',
			)
		);

		wp_delete_post( $page_id, true );

		$this->assertSame( array(), $this->get_menu_blocks( $first ) );
		$this->assertCount( 1, $this->get_menu_blocks( $second ) );
		$this->assertSame( array(), $this->get_menu_blocks( $draft ) );
	}

	public function test_a_menu_that_does_not_link_to_the_deleted_page_is_not_saved() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$other   = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$menu_id = $this->create_menu( $this->custom_link() . $this->page_link( $other ) );
		$before  = get_post( $menu_id )->post_content;
		$saves   = $this->count_menu_saves();

		wp_delete_post( $page_id, true );

		$this->assertSame( 0, $saves->get_call_count() );
		$this->assertSame( $before, get_post( $menu_id )->post_content );
	}

	public function test_trashing_a_page_leaves_the_menu_alone() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$menu_id = $this->create_menu( $this->page_link( $page_id ) );
		$before  = get_post( $menu_id )->post_content;
		$saves   = $this->count_menu_saves();

		wp_trash_post( $page_id );

		$this->assertSame( 0, $saves->get_call_count() );
		$this->assertSame( $before, get_post( $menu_id )->post_content );
	}

	public function test_a_term_link_with_the_deleted_page_id_is_kept() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );
		$menu_id = $this->create_menu( $this->term_link( $page_id, 'category', 'Category' ) );

		wp_delete_post( $page_id, true );

		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ) );
	}

	/*
	 * Terms.
	 */

	public function test_deleting_a_term_removes_its_bound_link_from_the_menu() {
		$term_id = self::factory()->category->create();
		$tag_id  = self::factory()->tag->create();
		$menu_id = $this->create_menu(
			$this->term_link( $term_id, 'category', 'Category' ) . $this->term_link( $tag_id, 'tag', 'Tag' )
		);

		wp_delete_term( $term_id, 'category' );

		$blocks = $this->get_menu_blocks( $menu_id );
		$this->assertCount( 1, $blocks );
		$this->assertSame( 'Tag', $blocks[0]['attrs']['label'] );

		wp_delete_term( $tag_id, 'post_tag' );

		$this->assertSame( array(), $this->get_menu_blocks( $menu_id ) );
	}

	public function test_an_unbound_term_link_is_kept() {
		$term_id = self::factory()->category->create();
		$menu_id = $this->create_menu( $this->term_link( $term_id, 'category', 'Category', false ) );

		wp_delete_term( $term_id, 'category' );

		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ) );
	}

	public function test_a_post_link_with_the_deleted_term_id_is_kept() {
		$term_id = self::factory()->category->create();
		$menu_id = $this->create_menu( $this->page_link( $term_id ) );

		wp_delete_term( $term_id, 'category' );

		$this->assertCount( 1, $this->get_menu_blocks( $menu_id ) );
	}
}
