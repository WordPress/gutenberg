<?php
/**
 * Unit tests for the dynamic default post type field collections.
 *
 * @package gutenberg
 */

// Load the registrar from source. If the built copy has already been required
// on `init`, the `function_exists` guards make this a no-op.
require_once dirname( __DIR__ ) . '/packages/field-collections/src/collections/postType-default/fields.php';

/**
 * Tests for `gutenberg_get_default_post_type_fields()` and
 * `gutenberg_register_default_post_type_field_collections()`.
 */
class Field_Collections_Default_Post_Types_Test extends WP_UnitTestCase {

	/**
	 * Field collections registered before the test ran.
	 *
	 * @var array
	 */
	private $original_field_collections;

	/**
	 * Theme support state for the features the tests toggle.
	 *
	 * @var array
	 */
	private $original_theme_supports;

	/**
	 * Post types registered by the test.
	 *
	 * @var string[]
	 */
	private $registered_post_types = array();

	public function set_up() {
		parent::set_up();

		global $gutenberg_field_collections;
		$this->original_field_collections = $gutenberg_field_collections;

		$this->original_theme_supports = array(
			'post-thumbnails' => get_theme_support( 'post-thumbnails' ),
			'post-formats'    => get_theme_support( 'post-formats' ),
		);
	}

	public function tear_down() {
		global $gutenberg_field_collections;
		$gutenberg_field_collections = $this->original_field_collections;

		foreach ( $this->original_theme_supports as $feature => $support ) {
			remove_theme_support( $feature );
			if ( false !== $support ) {
				if ( is_array( $support ) ) {
					add_theme_support( $feature, ...$support );
				} else {
					add_theme_support( $feature );
				}
			}
		}

		foreach ( $this->registered_post_types as $post_type ) {
			unregister_post_type( $post_type );
		}
		$this->registered_post_types = array();

		parent::tear_down();
	}

	/**
	 * Registers a post type and queues it for cleanup.
	 *
	 * @param string $post_type Post type slug.
	 * @param array  $args      Registration args.
	 */
	private function register_test_post_type( $post_type, $args = array() ) {
		register_post_type(
			$post_type,
			array_merge(
				array(
					'show_in_rest' => true,
				),
				$args
			)
		);
		$this->registered_post_types[] = $post_type;
	}

	/**
	 * Extracts the ordered field ids from a field list.
	 *
	 * @param array $fields Field definitions.
	 * @return string[] Field ids.
	 */
	private function get_field_ids( $fields ) {
		return array_column( $fields, 'id' );
	}

	public function test_minimal_post_type_gets_unconditional_fields_only() {
		$this->register_test_post_type(
			'test_minimal',
			array(
				'supports' => array( 'title', 'editor' ),
			)
		);

		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_minimal' ) );

		$this->assertSame(
			array(
				'status',
				'date',
				'scheduled_date',
				'slug',
				'template',
				'post-content-info',
				'password',
				'title',
			),
			$ids
		);
	}

	public function test_full_supports_post_type_gets_corresponding_fields_in_order() {
		add_theme_support( 'post-thumbnails' );
		$this->register_test_post_type(
			'test_full',
			array(
				'supports' => array(
					'title',
					'editor',
					'author',
					'thumbnail',
					'excerpt',
					'comments',
					'trackbacks',
					'page-attributes',
				),
			)
		);

		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_full' ) );

		$this->assertSame(
			array(
				'featured_media',
				'author',
				'status',
				'date',
				'scheduled_date',
				'slug',
				'excerpt',
				'parent',
				'comment_status',
				'ping_status',
				'discussion',
				'template',
				'post-content-info',
				'password',
				'title',
			),
			$ids
		);
	}

	public function test_featured_media_requires_theme_support() {
		$this->register_test_post_type(
			'test_thumb',
			array(
				'supports' => array( 'title', 'thumbnail' ),
			)
		);

		remove_theme_support( 'post-thumbnails' );
		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_thumb' ) );
		$this->assertNotContains( 'featured_media', $ids );

		add_theme_support( 'post-thumbnails' );
		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_thumb' ) );
		$this->assertContains( 'featured_media', $ids );
	}

	public function test_format_requires_post_type_and_theme_support() {
		$this->register_test_post_type(
			'test_format',
			array(
				'supports' => array( 'title', 'post-formats' ),
			)
		);
		$this->register_test_post_type(
			'test_no_format',
			array(
				'supports' => array( 'title' ),
			)
		);

		remove_theme_support( 'post-formats' );
		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_format' ) );
		$this->assertNotContains( 'format', $ids );

		add_theme_support( 'post-formats', array( 'aside', 'gallery' ) );
		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_format' ) );
		$this->assertContains( 'format', $ids );

		// Theme support alone is not enough: the post type must support formats.
		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_no_format' ) );
		$this->assertNotContains( 'format', $ids );
	}

	public function test_notes_count_requires_editor_notes_support() {
		$this->register_test_post_type(
			'test_no_notes',
			array(
				'supports' => array( 'title', 'editor' ),
			)
		);
		$this->register_test_post_type(
			'test_notes',
			array(
				'supports' => array(
					'title',
					'editor' => array( 'notes' => true ),
				),
			)
		);

		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_no_notes' ) );
		$this->assertNotContains( 'notesCount', $ids );

		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_notes' ) );
		$this->assertContains( 'notesCount', $ids );
	}

	public function test_sticky_only_for_post() {
		$this->register_test_post_type(
			'test_sticky',
			array(
				'supports' => array( 'title', 'editor' ),
			)
		);

		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'post' ) );
		$this->assertContains( 'sticky', $ids );

		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_sticky' ) );
		$this->assertNotContains( 'sticky', $ids );
	}

	public function test_design_post_types_omit_content_fields() {
		// `wp_template` supports excerpt and editor, but design post types
		// never get the date, scheduled date, excerpt, or content info fields.
		$ids = $this->get_field_ids( gutenberg_get_default_post_type_fields( 'wp_template' ) );

		$this->assertNotContains( 'date', $ids );
		$this->assertNotContains( 'scheduled_date', $ids );
		$this->assertNotContains( 'excerpt', $ids );
		$this->assertNotContains( 'post-content-info', $ids );

		$this->assertContains( 'status', $ids );
		$this->assertContains( 'slug', $ids );
		$this->assertContains( 'template', $ids );
		$this->assertContains( 'password', $ids );
	}

	public function test_registrar_skips_post_types_with_existing_collections() {
		global $gutenberg_field_collections;
		$gutenberg_field_collections = array();

		$this->register_test_post_type(
			'test_claimed',
			array(
				'supports' => array( 'title' ),
			)
		);

		gutenberg_register_field_collection(
			'test/claimed-fields',
			'postType',
			'test_claimed',
			array(
				array(
					'id'   => 'title',
					'type' => 'text',
				),
			)
		);

		gutenberg_register_default_post_type_field_collections();

		$collections = gutenberg_get_field_collections( 'postType', 'test_claimed' );

		$this->assertCount( 1, $collections );
		$this->assertSame( 'test/claimed-fields', $collections[0]['id'] );
	}

	public function test_registrar_registers_default_collection_for_unclaimed_post_types() {
		global $gutenberg_field_collections;
		$gutenberg_field_collections = array();

		$this->register_test_post_type(
			'test_generic',
			array(
				'supports' => array( 'title', 'editor' ),
			)
		);

		gutenberg_register_default_post_type_field_collections();

		$collections = gutenberg_get_field_collections( 'postType', 'test_generic' );

		$this->assertCount( 1, $collections );
		$this->assertSame( 'core/test_generic-fields', $collections[0]['id'] );
		$this->assertSame( array( '@wordpress/field-collections/postType-default' ), $collections[0]['fields_modules'] );
		$this->assertSame(
			$this->get_field_ids( gutenberg_get_default_post_type_fields( 'test_generic' ) ),
			$this->get_field_ids( $collections[0]['fields'] )
		);
	}

	public function test_registrar_skips_post_types_not_shown_in_rest() {
		global $gutenberg_field_collections;
		$gutenberg_field_collections = array();

		$this->register_test_post_type(
			'test_no_rest',
			array(
				'show_in_rest' => false,
				'supports'     => array( 'title' ),
			)
		);

		gutenberg_register_default_post_type_field_collections();

		$this->assertSame( array(), gutenberg_get_field_collections( 'postType', 'test_no_rest' ) );
	}
}
