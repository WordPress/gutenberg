<?php
/**
 * Tests for the public knowledge functions defined in
 * lib/experimental/knowledge/knowledge.php.
 *
 * Covers the wp_knowledge_types() registry and its filter, plus the
 * wp_knowledge_maybe_map_term_label() label-mapping filter (both as a
 * direct unit and end-to-end through wp_set_object_terms()).
 *
 * @package gutenberg
 *
 * @group knowledge
 */
class Knowledge_Test extends WP_UnitTestCase {

	/**
	 * The function should expose the built-in knowledge types keyed by slug,
	 * sorted alphabetically, with their human-readable titles.
	 */
	public function test_returns_default_knowledge_types() {
		$this->assertSame(
			array(
				'guideline' => array( 'title' => 'Guideline' ),
				'memory'    => array( 'title' => 'Memory' ),
				'note'      => array( 'title' => 'Note' ),
			),
			wp_knowledge_types()
		);
	}

	/**
	 * The wp_knowledge_types filter should be able to add new entries.
	 */
	public function test_types_filter_can_register_additional_types() {
		add_filter(
			'wp_knowledge_types',
			static function ( $types ) {
				$types['custom'] = array( 'title' => 'Custom' );
				return $types;
			}
		);

		$types = wp_knowledge_types();

		$this->assertArrayHasKey( 'custom', $types );
		$this->assertSame( 'Custom', $types['custom']['title'] );
	}

	/**
	 * The wp_knowledge_types filter should be able to remove built-in entries.
	 */
	public function test_types_filter_can_remove_default_types() {
		add_filter(
			'wp_knowledge_types',
			static function ( $types ) {
				unset( $types['guideline'] );
				return $types;
			}
		);

		$types = wp_knowledge_types();

		$this->assertArrayNotHasKey( 'guideline', $types );
	}

	/**
	 * Other taxonomies must pass through untouched.
	 */
	public function test_label_filter_ignores_other_taxonomies() {
		$input  = array(
			'name' => 'note',
			'slug' => 'note',
		);
		$output = wp_knowledge_maybe_map_term_label( $input, 'category' );

		$this->assertSame( $input, $output );
	}

	/**
	 * A user-provided name (different from the slug) must not be overwritten.
	 */
	public function test_label_filter_preserves_user_provided_name() {
		$input  = array(
			'name' => 'My Custom Note',
			'slug' => 'note',
		);
		$output = wp_knowledge_maybe_map_term_label( $input, 'wp_knowledge_type' );

		$this->assertSame( $input, $output );
	}

	/**
	 * Slugs that aren't registered knowledge types must pass through untouched.
	 */
	public function test_label_filter_ignores_unknown_slugs() {
		$input  = array(
			'name' => 'unknown',
			'slug' => 'unknown',
		);
		$output = wp_knowledge_maybe_map_term_label( $input, 'wp_knowledge_type' );

		$this->assertSame( $input, $output );
	}

	/**
	 * End-to-end: when wp_set_object_terms() lazily creates the 'note'
	 * term, the resulting term name should be the human-readable title rather
	 * than the raw slug.
	 */
	public function test_label_filter_runs_through_wp_set_object_terms() {
		$post_id = self::factory()->post->create();
		register_taxonomy( 'wp_knowledge_type', 'post' );

		wp_set_object_terms( $post_id, 'note', 'wp_knowledge_type' );

		$term = get_term_by( 'slug', 'note', 'wp_knowledge_type' );
		$this->assertInstanceOf( WP_Term::class, $term );
		$this->assertSame( 'Note', $term->name );
	}
}
