<?php
/**
 * Tests for the Knowledge Post Type registration and type-term behavior.
 *
 * @package gutenberg
 *
 * @group knowledge
 */
class Gutenberg_Knowledge_Post_Type_Test extends WP_UnitTestCase {

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	/**
	 * @var int Contributor user ID.
	 */
	protected static $contributor_id;

	/**
	 * Set up class fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$contributor_id );
	}

	/**
	 * The taxonomy is registered for the knowledge post type.
	 */
	public function test_taxonomy_is_registered() {
		$this->assertTrue( taxonomy_exists( Gutenberg_Knowledge_Post_Type::TAXONOMY ) );
	}

	/**
	 * The taxonomy is intentionally registered without `default_term`.
	 * Fallback is assigned in save_post. See
	 * https://github.com/WordPress/gutenberg/pull/77592.
	 */
	public function test_taxonomy_registered_without_default_term() {
		$taxonomy = get_taxonomy( Gutenberg_Knowledge_Post_Type::TAXONOMY );

		$this->assertNotFalse( $taxonomy );
		$this->assertEmpty( $taxonomy->default_term );
	}

	/**
	 * The post type exposes a self-contained, knowledge-prefixed capability
	 * namespace. The CPT-level `read` is remapped to keep Subscribers blocked
	 * at the post-type door; every other primitive is auto-derived from the
	 * plural base of `capability_type = array( 'knowledge_item', 'knowledge_items' )`
	 * and granted at runtime via the `user_has_cap` synthesis filter.
	 */
	public function test_post_type_uses_knowledge_prefixed_capabilities() {
		$post_type = get_post_type_object( Gutenberg_Knowledge_Post_Type::POST_TYPE );

		$this->assertNotFalse( $post_type );
		$this->assertSame( 'read_knowledge_items', $post_type->cap->read );
		$this->assertSame( 'edit_knowledge_items', $post_type->cap->create_posts );
		$this->assertSame( 'edit_knowledge_items', $post_type->cap->edit_posts );
		$this->assertSame( 'publish_knowledge_items', $post_type->cap->publish_posts );
		$this->assertSame( 'read_private_knowledge_items', $post_type->cap->read_private_posts );
		$this->assertSame( 'edit_private_knowledge_items', $post_type->cap->edit_private_posts );
		$this->assertSame( 'edit_published_knowledge_items', $post_type->cap->edit_published_posts );
		$this->assertSame( 'delete_private_knowledge_items', $post_type->cap->delete_private_posts );
		$this->assertSame( 'delete_published_knowledge_items', $post_type->cap->delete_published_posts );
		$this->assertSame( 'delete_knowledge_items', $post_type->cap->delete_posts );
		$this->assertSame( 'edit_others_knowledge_items', $post_type->cap->edit_others_posts );
		$this->assertSame( 'delete_others_knowledge_items', $post_type->cap->delete_others_posts );
	}

	/**
	 * The per-post meta capabilities (derived from the singular `knowledge_item`
	 * base) must not collide with the primitive capabilities (derived from the
	 * plural `knowledge_items` base). A collision would make `map_meta_cap()`
	 * treat primitive-intent checks like `current_user_can( 'edit_knowledge_items' )`
	 * as per-post checks missing a post ID.
	 */
	public function test_post_type_meta_caps_do_not_collide_with_primitives() {
		$post_type = get_post_type_object( Gutenberg_Knowledge_Post_Type::POST_TYPE );

		$this->assertNotFalse( $post_type );
		$this->assertSame( 'edit_knowledge_item', $post_type->cap->edit_post );
		$this->assertSame( 'read_knowledge_item', $post_type->cap->read_post );
		$this->assertSame( 'delete_knowledge_item', $post_type->cap->delete_post );
	}

	/**
	 * A knowledge post saved without a type term should get 'note'
	 * assigned by the save_post hook (replacement for default_term).
	 */
	public function test_save_post_assigns_note_fallback() {
		$post_id = self::factory()->post->create(
			array(
				'post_type'   => Gutenberg_Knowledge_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'No-type knowledge post',
			)
		);

		$terms = wp_get_object_terms( $post_id, Gutenberg_Knowledge_Post_Type::TAXONOMY );
		$this->assertCount( 1, $terms );
		$this->assertSame( 'note', $terms[0]->slug );
		// The wp_insert_term_data filter should have mapped the raw slug to
		// the localized label when the term was created on first use.
		$this->assertSame( 'Note', $terms[0]->name );
	}

	/**
	 * A post inserted with an explicit type keeps that type.
	 */
	public function test_save_post_preserves_explicit_term() {
		wp_set_current_user( self::$admin_id );

		$guideline_term_id = self::factory()->term->create(
			array(
				'taxonomy' => Gutenberg_Knowledge_Post_Type::TAXONOMY,
				'name'     => 'Guideline',
				'slug'     => Gutenberg_Knowledge_Post_Type::TERM_GUIDELINE,
			)
		);

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => Gutenberg_Knowledge_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Typed knowledge post',
				'tax_input'   => array(
					Gutenberg_Knowledge_Post_Type::TAXONOMY => array( $guideline_term_id ),
				),
			)
		);

		$terms = wp_get_object_terms( $post_id, Gutenberg_Knowledge_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( Gutenberg_Knowledge_Post_Type::TERM_GUIDELINE ), $terms );
	}

	/**
	 * End-to-end check for the agent flow the cap relaxation enables: a
	 * Contributor creates a new `wp_knowledge_type` term and attaches a
	 * private knowledge post to it in the same session. The post must end up
	 * tagged with the new term instead of the `note` fallback.
	 */
	public function test_save_post_preserves_new_term_for_contributor() {
		wp_set_current_user( self::$contributor_id );

		$memory_term_id = self::factory()->term->create(
			array(
				'taxonomy' => Gutenberg_Knowledge_Post_Type::TAXONOMY,
				'name'     => 'Memory',
				'slug'     => 'memory',
			)
		);

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => Gutenberg_Knowledge_Post_Type::POST_TYPE,
				'post_status' => 'private',
				'post_title'  => 'Contributor memory',
				'post_author' => self::$contributor_id,
				'tax_input'   => array(
					Gutenberg_Knowledge_Post_Type::TAXONOMY => array( $memory_term_id ),
				),
			)
		);

		$terms = wp_get_object_terms(
			$post_id,
			Gutenberg_Knowledge_Post_Type::TAXONOMY,
			array( 'fields' => 'slugs' )
		);
		$this->assertSame( array( 'memory' ), $terms );
	}

	/**
	 * Updates to an existing post do not overwrite an already-assigned term.
	 */
	public function test_save_post_preserves_term_on_update() {
		wp_set_current_user( self::$admin_id );

		$guideline_term_id = self::factory()->term->create(
			array(
				'taxonomy' => Gutenberg_Knowledge_Post_Type::TAXONOMY,
				'name'     => 'Guideline',
				'slug'     => Gutenberg_Knowledge_Post_Type::TERM_GUIDELINE,
			)
		);

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => Gutenberg_Knowledge_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Typed knowledge post',
				'tax_input'   => array(
					Gutenberg_Knowledge_Post_Type::TAXONOMY => array( $guideline_term_id ),
				),
			)
		);

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Updated title',
			)
		);

		$terms = wp_get_object_terms( $post_id, Gutenberg_Knowledge_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( Gutenberg_Knowledge_Post_Type::TERM_GUIDELINE ), $terms );
	}

	/**
	 * The fallback is skipped for revisions (including autosaves, which are
	 * stored as revisions).
	 */
	public function test_save_post_skips_revisions() {
		wp_set_current_user( self::$admin_id );

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => Gutenberg_Knowledge_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Guideline with revision',
			)
		);

		$revision_id = wp_save_post_revision( $post_id );
		$this->assertIsInt( $revision_id );
		$this->assertGreaterThan( 0, $revision_id );

		wp_knowledge_ensure_default_type_term( $revision_id );

		$terms = wp_get_object_terms( $revision_id, Gutenberg_Knowledge_Post_Type::TAXONOMY );
		$this->assertSame( array(), $terms );
	}
}
