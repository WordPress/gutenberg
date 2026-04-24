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
	 * Regression test: the taxonomy must not be registered with `default_term`.
	 *
	 * Using `default_term` triggers cross-site `clean_term_cache` work on
	 * multisite installs and is the root cause this fix addresses.
	 */
	public function test_taxonomy_does_not_use_default_term() {
		$taxonomy = get_taxonomy( Gutenberg_Guidelines_Post_Type::TAXONOMY );

		$this->assertNotFalse( $taxonomy );
		$this->assertEmpty( $taxonomy->default_term );
	}

	/**
	 * A post inserted without an explicit type gets the artifact fallback.
	 */
	public function test_artifact_assigned_when_no_term_set() {
		$post_id = wp_insert_post(
			array(
				'post_type'   => Gutenberg_Guidelines_Post_Type::POST_TYPE,
				'post_status' => 'draft',
				'post_title'  => 'No-type guideline',
			)
		);

		$this->assertIsInt( $post_id );
		$this->assertGreaterThan( 0, $post_id );

		$terms = wp_get_object_terms( $post_id, Gutenberg_Guidelines_Post_Type::TAXONOMY, array( 'fields' => 'slugs' ) );

		$this->assertSame( array( Gutenberg_Guidelines_Post_Type::TERM_ARTIFACT ), $terms );
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

		Gutenberg_Guidelines_Post_Type::ensure_default_type_term( $revision_id );

		$terms = wp_get_object_terms( $revision_id, Gutenberg_Guidelines_Post_Type::TAXONOMY );
		$this->assertSame( array(), $terms );
	}
}
