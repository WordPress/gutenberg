<?php
/**
 * Tests for the Guidelines Post Type registration and type-term behavior.
 *
 * @package gutenberg
 */
class Gutenberg_Guidelines_Post_Type_Test extends WP_UnitTestCase {

	/**
	 * @var int Administrator user ID.
	 */
	protected static $admin_id;

	/**
	 * Set up class fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Clean up class fixtures.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	/**
	 * Clean up guidelines posts and taxonomy terms after each test.
	 */
	public function tear_down() {
		$posts = get_posts(
			array(
				'post_type'      => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status'    => array( 'publish', 'draft' ),
				'posts_per_page' => -1,
			)
		);
		foreach ( $posts as $post ) {
			wp_delete_post( $post->ID, true );
		}

		$terms = get_terms(
			array(
				'taxonomy'   => Gutenberg_Guidelines_Post_Type::TAXONOMY,
				'hide_empty' => false,
			)
		);
		if ( ! is_wp_error( $terms ) ) {
			foreach ( $terms as $term ) {
				wp_delete_term( $term->term_id, Gutenberg_Guidelines_Post_Type::TAXONOMY );
			}
		}

		parent::tear_down();
	}

	/**
	 * The taxonomy is registered for the guidelines post type.
	 */
	public function test_taxonomy_is_registered() {
		$this->assertTrue( taxonomy_exists( Gutenberg_Guidelines_Post_Type::TAXONOMY ) );
	}

	/**
	 * The taxonomy is intentionally registered without `default_term`.
	 * Fallback is assigned in save_post. See
	 * https://github.com/WordPress/gutenberg/pull/77592.
	 */
	public function test_taxonomy_registered_without_default_term() {
		$taxonomy = get_taxonomy( Gutenberg_Guidelines_Post_Type::TAXONOMY );

		$this->assertNotFalse( $taxonomy );
		$this->assertEmpty( $taxonomy->default_term );
	}

	/**
	 * The post type maps generated guideline primitive caps back to the core
	 * post caps used by built-in roles.
	 */
	public function test_post_type_uses_core_primitive_capabilities() {
		$post_type = get_post_type_object( Gutenberg_Guidelines_Post_Type::POST_TYPE );

		$this->assertNotFalse( $post_type );
		$this->assertSame( 'edit_posts', $post_type->cap->read );
		$this->assertSame( 'publish_posts', $post_type->cap->create_posts );
		$this->assertSame( 'edit_posts', $post_type->cap->edit_posts );
		$this->assertSame( 'publish_posts', $post_type->cap->publish_posts );
		$this->assertSame( 'read_private_posts', $post_type->cap->read_private_posts );
		$this->assertSame( 'edit_private_posts', $post_type->cap->edit_private_posts );
		$this->assertSame( 'edit_published_posts', $post_type->cap->edit_published_posts );
		$this->assertSame( 'delete_private_posts', $post_type->cap->delete_private_posts );
		$this->assertSame( 'delete_published_posts', $post_type->cap->delete_published_posts );
		$this->assertSame( 'delete_posts', $post_type->cap->delete_posts );
		$this->assertSame( 'edit_others_posts', $post_type->cap->edit_others_posts );
		$this->assertSame( 'delete_others_posts', $post_type->cap->delete_others_posts );
	}

	/**
	 * A guideline saved without a type term should get 'artifact' assigned by
	 * the save_post hook (replacement for default_term).
	 */
	public function test_save_post_assigns_artifact_fallback() {
		$post_id = wp_insert_post(
			array(
				'post_type'   => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'No-type guideline',
			)
		);

		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );

		$terms = wp_get_object_terms( $post_id, Gutenberg_Guidelines_Post_Type::TAXONOMY );
		$this->assertCount( 1, $terms );
		$this->assertSame( 'artifact', $terms[0]->slug );
		// The wp_insert_term_data filter should have mapped the raw slug to
		// the localized label when the term was created on first use.
		$this->assertSame( 'Artifact', $terms[0]->name );
	}

	/**
	 * A post inserted with an explicit type keeps that type.
	 */
	public function test_explicit_term_is_preserved() {
		wp_set_current_user( self::$admin_id );

		$content_term_id = Gutenberg_Guidelines_Post_Type::get_or_create_term_id(
			Gutenberg_Guidelines_Post_Type::TERM_CONTENT,
			'Content'
		);
		$this->assertIsInt( $content_term_id );

		$post_id = wp_insert_post(
			array(
				'post_type'   => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Content guideline',
				'tax_input'   => array(
					Gutenberg_Guidelines_Post_Type::TAXONOMY => array( $content_term_id ),
				),
			),
			true
		);

		$this->assertIsInt( $post_id );
		$this->assertNotWPError( $post_id );

		$terms = wp_get_object_terms( $post_id, Gutenberg_Guidelines_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( Gutenberg_Guidelines_Post_Type::TERM_CONTENT ), $terms );
	}

	/**
	 * Updates to an existing post do not overwrite an already-assigned term.
	 */
	public function test_term_is_not_overwritten_on_update() {
		wp_set_current_user( self::$admin_id );

		$content_term_id = Gutenberg_Guidelines_Post_Type::get_or_create_term_id(
			Gutenberg_Guidelines_Post_Type::TERM_CONTENT,
			'Content'
		);

		$post_id = wp_insert_post(
			array(
				'post_type'   => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Content guideline',
				'tax_input'   => array(
					Gutenberg_Guidelines_Post_Type::TAXONOMY => array( $content_term_id ),
				),
			),
			true
		);

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Updated title',
			)
		);

		$terms = wp_get_object_terms( $post_id, Gutenberg_Guidelines_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( Gutenberg_Guidelines_Post_Type::TERM_CONTENT ), $terms );
	}

	/**
	 * The fallback is skipped for revisions (including autosaves, which are
	 * stored as revisions).
	 */
	public function test_revision_is_ignored() {
		wp_set_current_user( self::$admin_id );

		$post_id = wp_insert_post(
			array(
				'post_type'   => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'Guideline with revision',
			)
		);

		$revision_id = wp_save_post_revision( $post_id );
		$this->assertIsInt( $revision_id );
		$this->assertGreaterThan( 0, $revision_id );

		_wp_guidelines_ensure_default_type_term( $revision_id );

		$terms = wp_get_object_terms( $revision_id, Gutenberg_Guidelines_Post_Type::TAXONOMY );
		$this->assertSame( array(), $terms );
	}
}
