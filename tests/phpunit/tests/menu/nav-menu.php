<?php

/**
 * @group navmenus
 */
class Tests_Nav_Menu_Theme_Change extends WP_UnitTestCase {

	/**
	 * Set up.
	 */
	function setUp() {
		parent::setUp();

		// Unregister all nav menu locations.
		foreach ( array_keys( get_registered_nav_menus() ) as $location ) {
			unregister_nav_menu( $location );
		}
	}

	/**
	 * Register nav menu locations.
	 *
	 * @param array $locations Location slugs.
	 */
	function register_nav_menu_locations( $locations ) {
		foreach ( $locations as $location ) {
			register_nav_menu( $location, ucfirst( $location ) );
		}
	}

	/**
	 * Two themes with one location each should just map, switching to a theme not previously-active.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_one_location_each() {
		$this->register_nav_menu_locations( array( 'primary' ) );
		$prev_theme_nav_menu_locations = array(
			'unique-slug' => 1,
		);
		$old_next_theme_nav_menu_locations = array(); // It was not active before.
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = array(
			'primary' => 1,
		);
		$this->assertEquals( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * Only registered locations should be mapped and returned.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_filter_registered_locations() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		$old_next_theme_nav_menu_locations = $prev_theme_nav_menu_locations = array(
			'primary' => 1,
			'secondary' => 2,
			'social' => 3,
		);
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = array(
			'primary' => 1,
			'secondary' => 2,
		);
		$this->assertEquals( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * Locations with the same name should map, switching to a theme not previously-active.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_locations_with_same_slug() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		$prev_theme_nav_menu_locations = array(
			'primary' => 1,
			'secondary' => 2,
		);

		$old_next_theme_nav_menu_locations = array(); // It was not active before.
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = $prev_theme_nav_menu_locations;
		$this->assertEquals( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * If the new theme was previously active, we should honor any changes to nav menu mapping done when the other theme was active.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_new_theme_previously_active() {
		$this->register_nav_menu_locations( array( 'primary' ) );

		$prev_theme_nav_menu_locations = array(
			'primary' => 1,
			'secondary' => 2,
		);

		// Nav menu location assignments that were set on the next theme when it was previously active.
		$old_next_theme_nav_menu_locations = array(
			'primary' => 3,
		);

		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = wp_array_slice_assoc( $prev_theme_nav_menu_locations, array_keys( get_registered_nav_menus() ) );
		$this->assertEquals( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * Make educated guesses on theme locations.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_location_guessing() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );

		$prev_theme_nav_menu_locations = array(
			'header' => 1,
			'footer' => 2,
		);

		$old_next_theme_nav_menu_locations = array();
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = array(
			'primary' => 1,
			'secondary' => 2,
		);
		$this->assertEquals( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * Make sure two locations that fall in the same group don't get the same menu assigned.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_location_guessing_one_menu_per_group() {
		$this->register_nav_menu_locations( array( 'primary' ) );
		$prev_theme_nav_menu_locations = array(
			'top-menu' => 1,
			'secondary' => 2,
		);

		$old_next_theme_nav_menu_locations = array();
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = array(
			'main' => 1,
		);
		$this->assertEqualSets( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * Make sure two locations that fall in the same group get menus assigned from the same group.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_location_guessing_one_menu_per_location() {
		$this->register_nav_menu_locations( array( 'primary', 'main' ) );

		$prev_theme_nav_menu_locations = array(
			'navigation-menu' => 1,
			'top-menu' => 2,
		);

		$old_next_theme_nav_menu_locations = array();
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = array(
			'primary' => 1,
			'main' => 2,
		);
		$this->assertEquals( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}

	/**
	 * Technically possible to register menu locations numerically.
	 *
	 * @covers wp_map_nav_menu_locations()
	 */
	function test_numerical_locations() {
		$this->register_nav_menu_locations( array( 'primary', 1 ) );

		$prev_theme_nav_menu_locations = array(
			'main' => 1,
			'secondary' => 2,
			'tertiary' => 3,
		);

		$old_next_theme_nav_menu_locations = array();
		$new_next_theme_nav_menu_locations = wp_map_nav_menu_locations( $old_next_theme_nav_menu_locations, $prev_theme_nav_menu_locations );

		$expected_nav_menu_locations = array(
			'primary' => 1,
		);
		$this->assertEqualSets( $expected_nav_menu_locations, $new_next_theme_nav_menu_locations );
	}
}
