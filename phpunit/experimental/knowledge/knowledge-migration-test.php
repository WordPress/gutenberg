<?php
/**
 * Tests for the one-time migration that renames the Guidelines storage to
 * Knowledge (`_gutenberg_migrate_guidelines_to_knowledge()` in lib/upgrade.php).
 *
 * @package gutenberg
 *
 * @group knowledge
 */
class Knowledge_Migration_Test extends WP_UnitTestCase {

	/**
	 * Legacy `wp_guideline` rows move to `wp_knowledge`, their
	 * `wp_guideline_type` terms move to `wp_knowledge_type` with the
	 * built-in slugs renamed (`content` becomes `instruction`), and the
	 * term relationships survive.
	 */
	public function test_migrates_legacy_guideline_rows() {
		// The legacy taxonomy is no longer registered by the plugin; register
		// it ad hoc so the fixture term can be created through the same APIs
		// a pre-rename site would have used.
		register_taxonomy( 'wp_guideline_type', array() );

		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_guideline',
				'post_status' => 'private',
				'post_title'  => 'Legacy guideline row',
			)
		);

		$term = wp_insert_term( 'content', 'wp_guideline_type' );
		$this->assertIsArray( $term, 'Pre-condition: legacy term must insert cleanly.' );
		wp_set_object_terms( $post_id, (int) $term['term_id'], 'wp_guideline_type' );

		_gutenberg_migrate_guidelines_to_knowledge();

		$post = get_post( $post_id );
		$this->assertSame( 'wp_knowledge', $post->post_type );

		$migrated_term = get_term( $term['term_id'] );
		$this->assertInstanceOf( WP_Term::class, $migrated_term );
		$this->assertSame( 'wp_knowledge_type', $migrated_term->taxonomy );
		$this->assertSame( 'instruction', $migrated_term->slug );
		$this->assertSame( 'Instruction', $migrated_term->name );

		$slugs = wp_get_object_terms( $post_id, 'wp_knowledge_type', array( 'fields' => 'slugs' ) );
		$this->assertSame( array( 'instruction' ), $slugs );
	}

	/**
	 * Built-in type terms already living in `wp_knowledge_type` are
	 * re-slugged too, and a user-customized term name is preserved while
	 * the slug still moves.
	 */
	public function test_reslugs_existing_knowledge_type_terms() {
		$term = wp_insert_term(
			'My Working Files',
			'wp_knowledge_type',
			array( 'slug' => 'artifact' )
		);
		$this->assertIsArray( $term, 'Pre-condition: term must insert cleanly.' );

		_gutenberg_migrate_guidelines_to_knowledge();

		$migrated_term = get_term( $term['term_id'] );
		$this->assertSame( 'note', $migrated_term->slug );
		$this->assertSame( 'My Working Files', $migrated_term->name );
	}

	/**
	 * Rows already using the new identifiers pass through untouched, so the
	 * migration is safe to re-run.
	 */
	public function test_migration_is_noop_without_legacy_rows() {
		$post_id = self::factory()->post->create(
			array(
				'post_type'   => 'wp_knowledge',
				'post_status' => 'private',
				'post_title'  => 'Already migrated row',
			)
		);
		wp_set_object_terms( $post_id, 'memory', 'wp_knowledge_type' );

		_gutenberg_migrate_guidelines_to_knowledge();

		$this->assertSame( 'wp_knowledge', get_post( $post_id )->post_type );

		$slugs = wp_get_object_terms( $post_id, 'wp_knowledge_type', array( 'fields' => 'slugs' ) );
		$this->assertSame( array( 'memory' ), $slugs );
	}
}
