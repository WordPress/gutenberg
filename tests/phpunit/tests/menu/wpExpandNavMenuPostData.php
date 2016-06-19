<?php

/**
 * @group menu
 * @ticket 36590
 */
class Tests_Menu_WpExpandNavMenuPostData extends WP_UnitTestCase {
	public function test_unnested_data_should_expand() {
		include_once( ABSPATH . 'wp-admin/includes/nav-menu.php' );

		if ( empty( $_POST ) ) {
			$_POST = array();
		}

		$data = array();
		$data[0] = new StdClass;
		$data[0]->name = 'yesorno';
		$data[0]->value = 'yes';
		$_POST['nav-menu-data'] = addslashes( json_encode( $data ) );

		_wp_expand_nav_menu_post_data();

		$expected = array(
			'nav-menu-data' => $_POST['nav-menu-data'],
			'yesorno' => 'yes'
		);

		$this->assertEquals( $expected, $_POST );
	}

	public function test_multidimensional_nested_array_should_expand() {
		include_once( ABSPATH . 'wp-admin/includes/nav-menu.php' );

		if ( empty( $_POST ) ) {
			$_POST = array();
		}

		$data = array();
		$data[0] = new StdClass;
		$data[0]->name = 'would[1][do][the][trick]';
		$data[0]->value = 'yes';
		$_POST['nav-menu-data'] = addslashes( json_encode( $data ) );

		_wp_expand_nav_menu_post_data();

		$expected = array(
			'nav-menu-data' => $_POST['nav-menu-data'],
			'would' => array(
				1 => array(
					'do' => array(
						'the' => array(
							'trick' => 'yes',
						),
					),
				),
			),
		);
		$this->assertEquals( $expected, $_POST );
	}

	public function test_multidimensional_nested_array_should_expand_and_merge() {
		include_once( ABSPATH . 'wp-admin/includes/nav-menu.php' );

		if ( empty( $_POST ) ) {
			$_POST = array();
		}

		$data = array();
		$data[0] = new StdClass;
		$data[0]->name = 'would[1][do][the][trick]';
		$data[0]->value = 'yes';
		$data[1] = new StdClass;
		$data[1]->name = 'would[2][do][the][trick]';
		$data[1]->value = 'yes';
		$data[2] = new StdClass;
		$data[2]->name = 'would[2][do][the][job]';
		$data[2]->value = 'yes';
		$_POST['nav-menu-data'] = addslashes( json_encode( $data ) );

		_wp_expand_nav_menu_post_data();

		$expected = array(
			'nav-menu-data' => $_POST['nav-menu-data'],
			'would' => array(
				1 => array(
					'do' => array(
						'the' => array(
							'trick' => 'yes',
						),
					),
				),
				2 => array(
					'do' => array(
						'the' => array(
							'trick' => 'yes',
							'job'   => 'yes',
						),
					),
				),
			),
		);

		$this->assertEquals( $expected, $_POST );
	}
}
