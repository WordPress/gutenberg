<?php

/**
 *
 *
 * @package Gutenberg
 */

class WP_Classic_To_Block_Menu_Converter_Test extends WP_UnitTestCase {

	public function test_class_exists() {
		$this->assertTrue( class_exists( 'WP_Classic_To_Block_Menu_Converter' ) );
	}

	// test can convert classic menu to blocks using the converter
	public function test_can_convert_classic_menu_to_blocks() {

		$menu_id = wp_create_nav_menu( 'Classic Menu' );

		$first_menu_item_id = wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Menu Item 1',
				'menu-item-url'    => '/classic-menu-item-1',
				'menu-item-status' => 'publish',
			)
		);

		$second_menu_item_id = wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Classic Menu Item 2',
				'menu-item-url'    => '/classic-menu-item-2',
				'menu-item-status' => 'publish',
			)
		);

		wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'     => 'Nested Menu Item 1',
				'menu-item-url'       => '/nested-menu-item-1',
				'menu-item-status'    => 'publish',
				'menu-item-parent-id' => $second_menu_item_id,
			)
		);

		// create a menu item with a status of `draft`
		wp_update_nav_menu_item(
			$menu_id,
			0,
			array(
				'menu-item-title'  => 'Draft Menu Item',
				'menu-item-url'    => '/draft-menu-item',
				'menu-item-status' => 'draft',
			)
		);

		$classic_nav_menu = wp_get_nav_menu_object( $menu_id );

		$blocks = WP_Classic_To_Block_Menu_Converter::convert( $classic_nav_menu );

		$this->assertNotEmpty( $blocks );

		$parsed_blocks = parse_blocks( $blocks );

		$first_block  = $parsed_blocks[0];
		$second_block = $parsed_blocks[1];
		$nested_block = $parsed_blocks[1]['innerBlocks'][0];

		$this->assertEquals( 'core/navigation-link', $first_block['blockName'], 'First block name should be "core/navigation-link"' );

		$this->assertEquals( 'Classic Menu Item 1', $first_block['attrs']['label'], 'First block label should match.' );

		$this->assertEquals( '/classic-menu-item-1', $first_block['attrs']['url'], 'First block URL should match.' );

		// echo "<pre>";
		// var_dump($parsed_blocks);
		// echo "</pre>";

		// Assert parent of nested menu item is a submenu block.
		$this->assertEquals( 'core/navigation-submenu', $second_block['blockName'], 'Second block name should be "core/navigation-submenu"' );

		$this->assertEquals( 'Classic Menu Item 2', $second_block['attrs']['label'], 'Second block label should match.' );

		$this->assertEquals( '/classic-menu-item-2', $second_block['attrs']['url'], 'Second block URL should match.' );

		$this->assertEquals( 'core/navigation-link', $nested_block['blockName'], 'Nested block name should be "core/navigation-link"' );

		$this->assertEquals( 'Nested Menu Item 1', $nested_block['attrs']['label'], 'Nested block label should match.' );

		$this->assertEquals( '/nested-menu-item-1', $nested_block['attrs']['url'], 'Nested block URL should match.' );

		$this->assertArrayNotHasKey( 2, $parsed_blocks, 'Draft menu item should not be included in blocks.' );

	}
}
