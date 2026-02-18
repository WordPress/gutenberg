<?php
/**
 * Tests for block_core_shared_get_submenu_visibility function.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for block_core_shared_get_submenu_visibility.
 *
 * @group blocks
 * @covers block_core_shared_get_submenu_visibility
 */
class Block_Core_Shared_Get_Submenu_Visibility_Test extends WP_UnitTestCase {

	public static function set_up_before_class() {
		parent::set_up_before_class();

		$shared_file = dirname( __DIR__, 2 ) . '/packages/block-library/src/navigation/shared/get-submenu-visibility.php';
		if ( ! function_exists( 'block_core_shared_get_submenu_visibility' ) && file_exists( $shared_file ) ) {
			require_once $shared_file;
		}
	}

	/**
	 * Test that deprecated openSubmenusOnClick true returns 'click'.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_deprecated_open_submenus_on_click_true() {
		$data   = array( 'openSubmenusOnClick' => true );
		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'click', $result );
	}

	/**
	 * Test that deprecated openSubmenusOnClick false returns 'hover'.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_deprecated_open_submenus_on_click_false() {
		$data   = array( 'openSubmenusOnClick' => false );
		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'hover', $result );
	}

	/**
	 * Test that deprecated openSubmenusOnClick takes priority over submenuVisibility.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_deprecated_attribute_takes_priority() {
		$data = array(
			'openSubmenusOnClick' => true,
			'submenuVisibility'   => 'hover',
		);

		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'click', $result, 'Legacy openSubmenusOnClick should take priority over submenuVisibility' );
	}

	/**
	 * Test that submenuVisibility 'click' is returned when no deprecated attribute.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_submenu_visibility_click() {
		$data   = array( 'submenuVisibility' => 'click' );
		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'click', $result );
	}

	/**
	 * Test that submenuVisibility 'hover' is returned when no deprecated attribute.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_submenu_visibility_hover() {
		$data   = array( 'submenuVisibility' => 'hover' );
		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'hover', $result );
	}

	/**
	 * Test that submenuVisibility 'always' is returned when no deprecated attribute.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_submenu_visibility_always() {
		$data   = array( 'submenuVisibility' => 'always' );
		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'always', $result );
	}

	/**
	 * Test default return value when no attributes provided.
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_default_fallback() {
		$data   = array();
		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'hover', $result, 'Should default to hover when no attributes are set' );
	}

	/**
	 * Test that null openSubmenusOnClick is ignored (not prioritized).
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_null_deprecated_attribute_not_prioritized() {
		$data = array(
			'openSubmenusOnClick' => null,
			'submenuVisibility'   => 'always',
		);

		$result = block_core_shared_get_submenu_visibility( $data );

		$this->assertSame( 'always', $result, 'Null openSubmenusOnClick should not take priority' );
	}

	/**
	 * Test that the function works with context data (as used by navigation-submenu and page-list).
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_works_with_context_data() {
		$context = array( 'submenuVisibility' => 'click' );
		$result  = block_core_shared_get_submenu_visibility( $context );

		$this->assertSame( 'click', $result );
	}

	/**
	 * Test that the function works with attributes data (as used by navigation block).
	 *
	 * @covers block_core_shared_get_submenu_visibility
	 */
	public function test_works_with_attributes_data() {
		$attributes = array( 'submenuVisibility' => 'always' );
		$result     = block_core_shared_get_submenu_visibility( $attributes );

		$this->assertSame( 'always', $result );
	}
}
