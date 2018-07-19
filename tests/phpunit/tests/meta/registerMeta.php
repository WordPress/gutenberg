<?php
/**
 * @group meta
 */
class Tests_Meta_Register_Meta extends WP_UnitTestCase {

	protected static $post_id;
	protected static $term_id;
	protected static $comment_id;
	protected static $user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$post_id    = $factory->post->create( array( 'post_type' => 'page' ) );
		self::$term_id    = $factory->term->create( array( 'taxonomy' => 'category' ) );
		self::$comment_id = $factory->comment->create();
		self::$user_id    = $factory->user->create();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post_id, true );
		wp_delete_term( self::$term_id, 'category' );
		wp_delete_comment( self::$comment_id, true );
		self::delete_user( self::$user_id );
	}

	public function _old_sanitize_meta_cb( $meta_value, $meta_key, $meta_type ) {
		return $meta_key . ' old sanitized';
	}

	public function _new_sanitize_meta_cb( $meta_value, $meta_key, $object_type ) {
		return $meta_key . ' new sanitized';
	}

	public function _old_auth_meta_cb( $allowed, $meta_key, $post_id, $user_id, $cap, $caps ) {
		return $allowed;
	}

	public function _new_auth_meta_cb( $allowed, $meta_key, $post_id, $user_id, $cap, $caps ) {
		return $allowed;
	}

	public function test_register_meta_back_compat_with_auth_callback_and_no_sanitize_callback_has_old_style_auth_filter() {
		register_meta( 'post', 'flight_number', null, array( $this, '_old_auth_meta_cb' ) );
		$has_filter = has_filter( 'auth_post_meta_flight_number', array( $this, '_old_auth_meta_cb' ) );
		remove_filter( 'auth_post_meta_flight_number', array( $this, '_old_auth_meta_cb' ) );

		// The filter should have been added with a priority of 10.
		$this->assertEquals( 10, $has_filter );
	}

	public function test_register_meta_back_compat_with_sanitize_callback_and_no_auth_callback_has_old_style_sanitize_filter() {
		register_meta( 'post', 'flight_number', array( $this, '_old_sanitize_meta_cb' ) );
		$has_filter = has_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb' ) );
		remove_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb' ) );

		$this->assertEquals( 10, $has_filter );
	}

	public function test_register_meta_back_compat_with_auth_and_sanitize_callback_has_old_style_filters() {
		register_meta( 'post', 'flight_number', array( $this, '_old_sanitize_meta_cb' ), array( $this, '_old_auth_meta_cb' ) );
		$has_filters = array();
		$has_filters['auth'] = has_filter( 'auth_post_meta_flight_number', array( $this, '_old_auth_meta_cb' ) );
		$has_filters['sanitize'] = has_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb' ) );
		remove_filter( 'auth_post_meta_flight_number', array( $this, '_old_auth_meta_cb' ) );
		remove_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb' ) );

		$this->assertEquals( array( 'auth' => 10, 'sanitize' => 10 ), $has_filters );
	}

	public function test_register_meta_with_post_object_type_returns_true() {
		$result = register_meta( 'post', 'flight_number', array() );
		unregister_meta_key( 'post', 'flight_number' );

		$this->assertTrue( $result );
	}

	public function test_register_meta_with_post_object_type_populates_wp_meta_keys() {
		global $wp_meta_keys;

		register_meta( 'post', 'flight_number', array() );
		$actual = $wp_meta_keys;
		unregister_meta_key( 'post', 'flight_number' );

		$expected = array(
			'post' => array(
				'' => array(
					'flight_number' => array(
						'type'              => 'string',
						'description'       => '',
						'single'            => false,
						'sanitize_callback' => null,
						'auth_callback'     => '__return_true',
						'show_in_rest'      => false,
					),
				),
			),
		);

		$this->assertEquals( $expected, $actual );
	}

	public function test_register_meta_with_term_object_type_populates_wp_meta_keys() {
		global $wp_meta_keys;
		register_meta( 'term', 'category_icon', array() );
		$actual = $wp_meta_keys;
		unregister_meta_key( 'term', 'category_icon' );

		$expected = array(
			'term' => array(
				'' => array(
					'category_icon' => array(
						'type'              => 'string',
						'description'       => '',
						'single'            => false,
						'sanitize_callback' => null,
						'auth_callback'     => '__return_true',
						'show_in_rest'      => false,
					),
				),
			),
		);

		$this->assertEquals( $expected, $actual );
	}

	public function test_register_meta_with_deprecated_sanitize_callback_does_not_populate_wp_meta_keys() {
		global $wp_meta_keys;

		register_meta( 'post', 'flight_number', array( $this, '_old_sanitize_meta_cb' ) );
		$actual = $wp_meta_keys;
		remove_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb') );
		remove_filter( 'auth_post_meta_flight_number', '__return_true');

		$this->assertEquals( array(), $actual );
	}

	public function test_register_meta_with_deprecated_sanitize_callback_param_returns_false() {
		$actual = register_meta( 'post', 'flight_number', array( $this, '_old_sanitize_meta_cb' ) );

		remove_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb') );
		remove_filter( 'auth_post_meta_flight_number', '__return_true');

		$this->assertFalse( $actual );
	}

	public function test_register_meta_with_deprecated_sanitize_callback_parameter_passes_through_filter() {
		register_meta( 'post', 'old_sanitized_key', array( $this, '_old_sanitize_meta_cb' ) );
		$meta = sanitize_meta( 'old_sanitized_key', 'unsanitized', 'post', 'post' );

		remove_filter( 'sanitize_post_meta_flight_number', array( $this, '_old_sanitize_meta_cb') );
		remove_filter( 'auth_post_meta_flight_number', '__return_true');

		$this->assertEquals( 'old_sanitized_key old sanitized', $meta );
	}

	public function test_register_meta_with_current_sanitize_callback_populates_wp_meta_keys() {
		global $wp_meta_keys;
		register_meta( 'post', 'flight_number', array( 'sanitize_callback' => array( $this, '_new_sanitize_meta_cb' ) ) );
		$actual = $wp_meta_keys;
		unregister_meta_key( 'post', 'flight_number' );

		$expected = array(
			'post' => array(
				'' => array(
					'flight_number' => array(
						'type'              => 'string',
						'description'       => '',
						'single'            => false,
						'sanitize_callback' => array( $this, '_new_sanitize_meta_cb' ),
						'auth_callback'     => '__return_true',
						'show_in_rest'      => false,
					),
				),
			),
		);
		$this->assertEquals( $actual, $expected );
	}

	public function test_register_meta_with_current_sanitize_callback_returns_true() {
		$result = register_meta( 'post', 'flight_number', array( 'sanitize_callback' => array( $this, '_new_sanitize_meta_cb' ) ) );
		unregister_meta_key( 'post', 'flight_number' );

		$this->assertTrue( $result );
	}

	public function test_register_meta_with_new_sanitize_callback_parameter() {
		register_meta( 'post', 'new_sanitized_key', array( 'sanitize_callback' => array( $this, '_new_sanitize_meta_cb' ) ) );
		$meta = sanitize_meta( 'new_sanitized_key', 'unsanitized', 'post' );

		unregister_meta_key( 'post', 'new_sanitized_key' );

		$this->assertEquals( 'new_sanitized_key new sanitized', $meta );
	}

	public function test_register_meta_unregistered_meta_key_removes_sanitize_filter() {
		register_meta( 'post', 'new_sanitized_key', array( 'sanitize_callback' => array( $this, '_new_sanitize_meta_cb' ) ) );
		unregister_meta_key( 'post', 'new_sanitized_key' );

		$has_filter = has_filter( 'sanitize_post_meta_new_sanitized_key', array( $this, '_new_sanitize_meta_cb' ) );

		$this->assertFalse( $has_filter );
	}

	public function test_register_meta_unregistered_meta_key_removes_auth_filter() {
		register_meta( 'post', 'new_auth_key', array( 'auth_callback' => array( $this, '_new_auth_meta_cb' ) ) );
		unregister_meta_key( 'post', 'new_auth_key' );

		$has_filter = has_filter( 'auth_post_meta_new_auth_key', array( $this, '_new_auth_meta_cb' ) );

		$this->assertFalse( $has_filter );
	}

	public function test_unregister_meta_key_clears_key_from_wp_meta_keys() {
		global $wp_meta_keys;
		register_meta( 'post', 'registered_key', array() );
		unregister_meta_key( 'post', 'registered_key' );

		$this->assertEquals( array(), $wp_meta_keys );
	}

	public function test_unregister_meta_key_with_invalid_key_returns_false() {
		$this->assertFalse( unregister_meta_key( 'post', 'not_a_registered_key' ) );
	}

	public function test_get_registered_meta_keys() {
		register_meta( 'post', 'registered_key1', array() );
		register_meta( 'post', 'registered_key2', array() );

		$meta_keys = get_registered_meta_keys( 'post' );

		unregister_meta_key( 'post', 'registered_key1' );
		unregister_meta_key( 'post', 'registered_key2' );

		$this->assertArrayHasKey( 'registered_key1', $meta_keys );
		$this->assertArrayHasKey( 'registered_key2', $meta_keys );
	}

	public function test_get_registered_meta_keys_with_invalid_type_is_empty() {
		register_meta( 'post', 'registered_key1', array() );
		register_meta( 'post', 'registered_key2', array() );

		$meta_keys = get_registered_meta_keys( 'invalid-type' );

		unregister_meta_key( 'post', 'registered_key1' );
		unregister_meta_key( 'post', 'registered_key2' );

		$this->assertEmpty( $meta_keys );
	}

	public function test_get_registered_meta_keys_description_arg() {
		register_meta( 'post', 'registered_key1', array( 'description' => 'I\'m just a field, take a good look at me' ) );

		$meta_keys = get_registered_meta_keys( 'post' );

		unregister_meta_key( 'post', 'registered_key1' );

		$this->assertEquals( 'I\'m just a field, take a good look at me', $meta_keys['registered_key1']['description'] );
	}

	public function test_get_registered_meta_keys_invalid_arg() {
		register_meta( 'post', 'registered_key1', array( 'invalid_arg' => 'invalid' ) );

		$meta_keys = get_registered_meta_keys( 'post' );

		unregister_meta_key( 'post', 'registered_key1' );

		$this->assertArrayNotHasKey( 'invalid_arg', $meta_keys['registered_key1'] );
	}

	public function test_get_registered_metadata() {
		register_meta( 'post', 'flight_number', array() );
		add_post_meta( self::$post_id, 'flight_number', 'Oceanic 815' );

		$meta = get_registered_metadata( 'post', self::$post_id );

		unregister_meta_key( 'post', 'flight_number' );

		$this->assertEquals( 'Oceanic 815', $meta['flight_number'][0] );
	}

	public function test_get_registered_metadata_by_key() {
		register_meta( 'post', 'flight_number', array() );
		add_post_meta( self::$post_id, 'flight_number', 'Oceanic 815' );

		$meta = get_registered_metadata( 'post', self::$post_id, 'flight_number' );

		unregister_meta_key( 'post', 'flight_number' );

		$this->assertEquals( 'Oceanic 815', $meta[0] );
	}

	public function test_get_registered_metadata_by_key_single() {
		register_meta( 'post', 'flight_number', array( 'single' => true ) );
		add_post_meta( self::$post_id, 'flight_number', 'Oceanic 815' );

		$meta = get_registered_metadata( 'post', self::$post_id, 'flight_number' );

		unregister_meta_key( 'post', 'flight_number' );

		$this->assertEquals( 'Oceanic 815', $meta );
	}

	public function test_get_registered_metadata_by_invalid_key() {
		register_meta( 'post', 'flight_number', array() );
		add_post_meta( self::$post_id, 'flight_number', 'Oceanic 815' );

		$meta = get_registered_metadata( 'post', self::$post_id, 'flight_pilot' );

		unregister_meta_key( 'post', 'flight_number' );

		$this->assertFalse( $meta );
	}

	public function test_get_registered_metadata_invalid_object_type_returns_empty_array() {
		$meta = get_registered_metadata( 'invalid-type', self::$post_id );

		$this->assertEmpty( $meta );
	}

	/**
	 * @ticket 38323
	 * @dataProvider data_get_types_and_subtypes
	 */
	public function test_register_meta_with_subtype_populates_wp_meta_keys( $type, $subtype ) {
		global $wp_meta_keys;

		register_meta( $type, 'flight_number', array( 'object_subtype' => $subtype ) );

		$expected = array(
			$type => array(
				$subtype => array(
					'flight_number' => array(
						'type'              => 'string',
						'description'       => '',
						'single'            => false,
						'sanitize_callback' => null,
						'auth_callback'     => '__return_true',
						'show_in_rest'      => false,
					),
				),
			),
		);

		$actual = $wp_meta_keys;

		// Reset global so subsequent data tests do not get polluted.
		$wp_meta_keys = array();

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * @ticket 38323
	 * @dataProvider data_get_types_and_subtypes
	 */
	public function test_unregister_meta_with_subtype_unpopulates_wp_meta_keys( $type, $subtype ) {
		global $wp_meta_keys;

		register_meta( $type, 'flight_number', array( 'object_subtype' => $subtype ) );
		unregister_meta_key( $type, 'flight_number', $subtype );

		$actual = $wp_meta_keys;

		// Reset global so subsequent data tests do not get polluted.
		$wp_meta_keys = array();

		$this->assertEmpty( $actual );
	}

	/**
	 * @ticket 38323
	 * @dataProvider data_get_types_and_subtypes
	 */
	public function test_unregister_meta_without_subtype_keeps_subtype_meta_key( $type, $subtype ) {
		global $wp_meta_keys;

		register_meta( $type, 'flight_number', array( 'object_subtype' => $subtype ) );

		// Unregister meta key without subtype.
		unregister_meta_key( $type, 'flight_number' );

		$expected = array(
			$type => array(
				$subtype => array(
					'flight_number' => array(
						'type'              => 'string',
						'description'       => '',
						'single'            => false,
						'sanitize_callback' => null,
						'auth_callback'     => '__return_true',
						'show_in_rest'      => false,
					),
				),
			),
		);

		$actual = $wp_meta_keys;

		// Reset global so subsequent data tests do not get polluted.
		$wp_meta_keys = array();

		$this->assertEquals( $expected, $actual );
	}

	/**
	 * @ticket 38323
	 * @dataProvider data_get_types_and_subtypes
	 */
	public function test_get_registered_meta_keys_with_subtype( $type, $subtype ) {
		register_meta( $type, 'registered_key1', array( 'object_subtype' => $subtype ) );
		register_meta( $type, 'registered_key2', array( 'object_subtype' => $subtype ) );

		$meta_keys = get_registered_meta_keys( $type, $subtype );

		$this->assertArrayHasKey( 'registered_key1', $meta_keys );
		$this->assertArrayHasKey( 'registered_key2', $meta_keys );
		$this->assertEmpty( get_registered_meta_keys( $type ) );
	}

	/**
	 * @ticket 38323
	 * @dataProvider data_get_types_and_subtypes
	 */
	public function test_get_registered_metadata_with_subtype( $type, $subtype ) {
		register_meta( $type, 'registered_key1', array() );

		// This will override the above registration for objects of $subtype.
		register_meta( $type, 'registered_key1', array(
			'object_subtype' => $subtype,
			'single'         => true,
		) );

		// For testing with $single => false.
		register_meta( $type, 'registered_key2', array(
			'object_subtype' => $subtype,
		) );

		// Register another meta key for a different subtype.
		register_meta( $type, 'registered_key3', array(
			'object_subtype' => 'other_subtype',
		) );

		$object_property_name = $type . '_id';
		$object_id = self::$$object_property_name;

		add_metadata( $type, $object_id, 'registered_key1', 'value1' );
		add_metadata( $type, $object_id, 'registered_key2', 'value2' );
		add_metadata( $type, $object_id, 'registered_key3', 'value3' );

		$meta = get_registered_metadata( $type, $object_id );

		$key1 = get_registered_metadata( $type, $object_id, 'registered_key1' );
		$key2 = get_registered_metadata( $type, $object_id, 'registered_key2' );
		$key3 = get_registered_metadata( $type, $object_id, 'registered_key3' );

		$this->assertSame( array( 'registered_key1', 'registered_key2' ), array_keys( $meta ) );
		$this->assertSame( 'value1', $meta['registered_key1'][0] );
		$this->assertSame( 'value2', $meta['registered_key2'][0] );

		$this->assertSame( 'value1', $key1 );
		$this->assertSame( array( 'value2' ), $key2 );
		$this->assertFalse( $key3 );
	}

	/**
	 * @ticket 38323
	 * @dataProvider data_get_types_and_subtypes
	 */
	public function test_get_object_subtype( $type, $expected_subtype ) {
		$object_property_name = $type . '_id';
		$object_id = self::$$object_property_name;

		$this->assertSame( $expected_subtype, get_object_subtype( $type, $object_id ) );
	}

	/**
	 * @ticket 38323
	 */
	public function test_get_object_subtype_custom() {
		add_filter( 'get_object_subtype_customtype', array( $this, 'filter_get_object_subtype_for_customtype' ), 10, 2 );

		$subtype_for_3 = get_object_subtype( 'customtype', 3 );
		$subtype_for_4 = get_object_subtype( 'customtype', 4 );

		$this->assertSame( 'odd', $subtype_for_3 );
		$this->assertSame( 'even', $subtype_for_4 );
	}

	public function filter_get_object_subtype_for_customtype( $subtype, $object_id ) {
		if ( $object_id % 2 === 1 ) {
			return 'odd';
		}

		return 'even';
	}

	public function data_get_types_and_subtypes() {
		return array(
			array( 'post', 'page' ),
			array( 'term', 'category' ),
			array( 'comment', 'comment' ),
			array( 'user', 'user' ),
		);
	}
}
