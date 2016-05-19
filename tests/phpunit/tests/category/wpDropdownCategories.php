<?php
/**
 * @group taxonomy
 * @group category.php
 */
class Tests_Category_WpDropdownCategories extends WP_UnitTestCase {
	/**
	 * @ticket 30306
	 */
	public function test_wp_dropdown_categories_value_field_should_default_to_term_id() {
		// Create a test category.
		$cat_id	= self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		// Get the default functionality of wp_dropdown_categories().
		$dropdown_default = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
		) );

		// Test to see if it returns the default with the category ID.
		$this->assertContains( 'value="' . $cat_id . '"', $dropdown_default );
	}

	/**
	 * @ticket 30306
	 */
	public function test_wp_dropdown_categories_value_field_term_id() {
		// Create a test category.
		$cat_id	= self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		// Get the default functionality of wp_dropdown_categories().
		$found = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
			'value_field' => 'term_id',
		) );

		// Test to see if it returns the default with the category ID.
		$this->assertContains( 'value="' . $cat_id . '"', $found );
	}

	/**
	 * @ticket 30306
	 */
	public function test_wp_dropdown_categories_value_field_slug() {
		// Create a test category.
		$cat_id	= self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		// Get the default functionality of wp_dropdown_categories().
		$found = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
			'value_field' => 'slug',
		) );

		// Test to see if it returns the default with the category slug.
		$this->assertContains( 'value="test_category"', $found );
	}

	/**
	 * @ticket 30306
	 */
	public function test_wp_dropdown_categories_value_field_should_fall_back_on_term_id_when_an_invalid_value_is_provided() {
		// Create a test category.
		$cat_id	= self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		// Get the default functionality of wp_dropdown_categories().
		$found = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
			'value_field' => 'foo',
		) );

		// Test to see if it returns the default with the category slug.
		$this->assertContains( 'value="' . $cat_id . '"', $found );
	}

	/**
	 * @ticket 32330
	 */
	public function test_wp_dropdown_categories_selected_should_respect_custom_value_field() {
		$c1 = self::factory()->category->create( array(
			'name' => 'Test Category 1',
			'slug' => 'test_category_1',
		) );

		$c2 = self::factory()->category->create( array(
			'name' => 'Test Category 2',
			'slug' => 'test_category_2',
		) );

		$found = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
			'value_field' => 'slug',
			'selected' => 'test_category_2',
		) );

		$this->assertContains( "value=\"test_category_2\" selected=\"selected\"", $found );
	}

	/**
	 * @ticket 33452
	 */
	public function test_wp_dropdown_categories_show_option_all_should_be_selected_if_no_selected_value_is_explicitly_passed_and_value_field_does_not_have_string_values() {
		$cats = self::factory()->category->create_many( 3 );

		$found = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
			'show_option_all' => 'Foo',
			'value_field' => 'slug',
		) );

		$this->assertContains( "value='0' selected='selected'", $found );

		foreach ( $cats as $cat ) {
			$_cat = get_term( $cat, 'category' );
			$this->assertNotContains( 'value="' . $_cat->slug . '" selected="selected"', $found );
		}
	}

	/**
	 * @ticket 33452
	 */
	public function test_wp_dropdown_categories_show_option_all_should_be_selected_if_selected_value_of_0_string_is_explicitly_passed_and_value_field_does_not_have_string_values() {
		$cats = self::factory()->category->create_many( 3 );

		$found = wp_dropdown_categories( array(
			'echo' => 0,
			'hide_empty' => 0,
			'show_option_all' => 'Foo',
			'value_field' => 'slug',
			'selected' => '0',
		) );

		$this->assertContains( "value='0' selected='selected'", $found );

		foreach ( $cats as $cat ) {
			$_cat = get_term( $cat, 'category' );
			$this->assertNotContains( 'value="' . $_cat->slug . '" selected="selected"', $found );
		}
	}

	/**
	 * @ticket 31909
	 */
	public function test_required_true_should_add_required_attribute() {
		// Create a test category.
		$cat_id = self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		$args = array(
			'show_option_none'  => __( 'Select one', 'text-domain' ),
			'option_none_value' => "",
			'required'          => true,
			'hide_empty'        => 0,
			'echo'              => 0,
		);
		$dropdown_categories = wp_dropdown_categories( $args );

		// Test to see if it contains the "required" attribute.
		$this->assertRegExp( '/<select[^>]+required/', $dropdown_categories );
	}

	/**
	 * @ticket 31909
	 */
	public function test_required_false_should_omit_required_attribute() {
		// Create a test category.
		$cat_id = self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		$args = array(
			'show_option_none'  => __( 'Select one', 'text-domain' ),
			'option_none_value' => "",
			'required'          => false,
			'hide_empty'        => 0,
			'echo'              => 0,
		);
		$dropdown_categories = wp_dropdown_categories( $args );

		// Test to see if it contains the "required" attribute.
		$this->assertNotRegExp( '/<select[^>]+required/', $dropdown_categories );
	}

	/**
	 * @ticket 31909
	 */
	public function test_required_should_default_to_false() {
		// Create a test category.
		$cat_id = self::factory()->category->create( array(
			'name' => 'Test Category',
			'slug' => 'test_category',
		) );

		$args = array(
			'show_option_none'  => __( 'Select one', 'text-domain' ),
			'option_none_value' => "",
			'hide_empty'        => 0,
			'echo'              => 0,
		);
		$dropdown_categories = wp_dropdown_categories( $args );

		// Test to see if it contains the "required" attribute.
		$this->assertNotRegExp( '/<select[^>]+required/', $dropdown_categories );
	}
}
