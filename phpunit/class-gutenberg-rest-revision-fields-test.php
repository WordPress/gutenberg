<?php
/**
 * Unit tests covering the revision fields plugins register through the
 * `_wp_post_revision_fields` filter.
 *
 * @package gutenberg
 *
 * @group rest-api
 */
class Gutenberg_REST_Revision_Fields_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	public function set_up() {
		parent::set_up();

		register_post_meta(
			'post',
			'gutenberg_test_event_date',
			array(
				'type'              => 'string',
				'single'            => true,
				'revisions_enabled' => true,
			)
		);

		add_filter( '_wp_post_revision_fields', array( $this, 'filter_revision_fields' ) );

		wp_set_current_user( self::$admin_id );

		self::$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$admin_id,
				'post_content' => 'Content',
			)
		);
		update_post_meta( self::$post_id, 'gutenberg_test_event_date', 'Saturday' );
		wp_save_post_revision( self::$post_id );
	}

	public function tear_down() {
		remove_filter( '_wp_post_revision_fields', array( $this, 'filter_revision_fields' ) );
		unregister_post_meta( 'post', 'gutenberg_test_event_date' );
		wp_delete_post( self::$post_id, true );

		parent::tear_down();
	}

	/**
	 * Adds a field the way a plugin does for the classic revisions screen.
	 *
	 * @param string[] $fields List of fields to revision.
	 * @return string[] The filtered list.
	 */
	public function filter_revision_fields( $fields ) {
		$fields['gutenberg_test_event_date'] = 'Event date';
		$fields['gutenberg_test_missing']      = 'Never set';
		return $fields;
	}

	/**
	 * Returns the revision fields of the latest revision.
	 *
	 * @param string $context Request context.
	 * @return array|null The revision fields, or null when the response has none.
	 */
	private function get_revision_fields( $context = 'edit' ) {
		$revisions = wp_get_post_revisions( self::$post_id );
		$revision  = reset( $revisions );

		$request = new WP_REST_Request( 'GET', '/wp/v2/posts/' . self::$post_id . '/revisions/' . $revision->ID );
		$request->set_param( 'context', $context );

		$data = rest_get_server()->dispatch( $request )->get_data();

		return array_key_exists( 'revision_fields', $data ) ? $data['revision_fields'] : null;
	}

	public function test_it_returns_the_field_with_its_label_and_value() {
		$fields = $this->get_revision_fields();

		$this->assertArrayHasKey( 'gutenberg_test_event_date', $fields );
		$this->assertSame(
			array(
				'label' => 'Event date',
				'value' => 'Saturday',
			),
			$fields['gutenberg_test_event_date']
		);
	}

	public function test_it_leaves_out_fields_without_a_value() {
		$this->assertArrayNotHasKey( 'gutenberg_test_missing', $this->get_revision_fields() );
	}

	public function test_it_leaves_out_the_fields_already_in_the_response() {
		$fields = $this->get_revision_fields();

		$this->assertArrayNotHasKey( 'post_title', $fields );
		$this->assertArrayNotHasKey( 'post_content', $fields );
		$this->assertArrayNotHasKey( 'post_excerpt', $fields );
	}

	public function test_it_applies_the_field_filter_of_the_plugin() {
		$filter = function ( $value ) {
			return strtoupper( $value );
		};
		add_filter( '_wp_post_revision_field_gutenberg_test_event_date', $filter );

		$fields = $this->get_revision_fields();

		remove_filter( '_wp_post_revision_field_gutenberg_test_event_date', $filter );

		$this->assertSame( 'SATURDAY', $fields['gutenberg_test_event_date']['value'] );
	}

	public function test_it_is_absent_in_the_view_context() {
		$this->assertNull( $this->get_revision_fields( 'view' ) );
	}
}
