<?php
/**
 * Tests for block UI icon resolution through the Icon Registry.
 *
 * @package    gutenberg
 * @subpackage block-library
 */

/**
 * Tests that Core blocks resolve their internal UI icons through the
 * WordPress Icon Registry via wp_get_icon(), so themes can override them.
 *
 * @group blocks
 * @group icons
 */
class Tests_Blocks_Render_Icons extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();

		/*
		 * Other suites reset the WP_Icons_Registry singleton, wiping the core
		 * icons that init only registers once. Re-register them when empty so
		 * order-dependent tests pass.
		 */
		if ( ! WP_Icon_Collections_Registry::get_instance()->is_registered( 'core' ) ) {
			gutenberg_register_default_icon_collections();
		}
		if ( empty( WP_Icons_Registry::get_instance()->get_registered_icons() ) ) {
			gutenberg_register_default_icons();
		}

		// Ensure the specific icons used by these tests are registered.
		$registry = WP_Icons_Registry::get_instance();
		foreach ( array( 'core/search', 'core/close', 'core/menu', 'core/navigation-menu-toggle', 'core/navigation-submenu', 'core/chevron-left', 'core/chevron-right' ) as $icon_name ) {
			if ( ! $registry->is_registered( $icon_name ) ) {
				$this->register_default_icon( $icon_name );
			}
		}
	}

	/**
	 * Tests that the Search block submit button resolves its icon through
	 * the Icon Registry.
	 */
	public function test_search_block_icon_button_resolves_icon_from_registry() {
		if ( ! function_exists( 'gutenberg_render_block_core_search' ) ) {
			$this->markTestSkipped( 'The search block render function is not available.' );
		}

		$attributes = array(
			'buttonUseIcon'  => true,
			'buttonPosition' => 'button-outside',
			'buttonText'     => 'Search',
			'label'          => 'Search',
			'placeholder'    => '',
			'showLabel'      => true,
		);

		$rendered = gutenberg_render_block_core_search( $attributes );

		// The rendered button should contain an SVG (from the registry).
		$this->assertStringContainsString( '<svg', $rendered );
		$this->assertStringContainsString( '</svg>', $rendered );
		// The search-icon class should be preserved.
		$this->assertStringContainsString( 'search-icon', $rendered );
		// The has-icon class should be present on the button.
		$this->assertStringContainsString( 'has-icon', $rendered );
	}

	/**
	 * Tests that a theme can override the Search block icon by registering
	 * a replacement for the core/search icon.
	 */
	public function test_search_block_icon_can_be_overridden_by_theme() {
		if ( ! function_exists( 'gutenberg_render_block_core_search' ) ) {
			$this->markTestSkipped( 'The search block render function is not available.' );
		}

		// Unregister the default, then register a custom override.
		$this->unregister_icon_safe( 'core/search' );
		wp_register_icon(
			'core/search',
			array(
				'label'   => 'Search',
				'content' => '<svg viewBox="0 0 24 24" data-custom-search-icon="true"><path d="M0 0"></path></svg>',
			)
		);

		$attributes = array(
			'buttonUseIcon'  => true,
			'buttonPosition' => 'button-outside',
			'buttonText'     => 'Search',
			'label'          => 'Search',
			'placeholder'    => '',
			'showLabel'      => true,
		);

		$rendered = gutenberg_render_block_core_search( $attributes );

		// The custom override should appear in the rendered output.
		$this->assertStringContainsString( 'data-custom-search-icon', $rendered );

		// Restore the default icon.
		$this->restore_default_icon( 'core/search' );
	}

	/**
	 * Tests that the Navigation submenu disclosure icon resolves through
	 * the Icon Registry.
	 */
	public function test_navigation_submenu_icon_resolves_from_registry() {
		if ( ! function_exists( 'gutenberg_block_core_shared_navigation_render_submenu_icon' ) ) {
			$this->markTestSkipped( 'The shared navigation submenu icon helper is not available.' );
		}

		$icon = gutenberg_block_core_shared_navigation_render_submenu_icon();

		// Should return an SVG element.
		$this->assertStringContainsString( '<svg', $icon );
		$this->assertStringContainsString( '</svg>', $icon );
	}

	/**
	 * Tests that a theme can override the Navigation submenu disclosure icon
	 * by registering a replacement for the core/navigation-submenu icon.
	 */
	public function test_navigation_submenu_icon_can_be_overridden_by_theme() {
		if ( ! function_exists( 'gutenberg_block_core_shared_navigation_render_submenu_icon' ) ) {
			$this->markTestSkipped( 'The shared navigation submenu icon helper is not available.' );
		}

		$this->unregister_icon_safe( 'core/navigation-submenu' );
		wp_register_icon(
			'core/navigation-submenu',
			array(
				'label'   => 'Navigation Submenu',
				'content' => '<svg viewBox="0 0 24 24" data-custom-chevron="true"><path d="M0 0"></path></svg>',
			)
		);

		$icon = gutenberg_block_core_shared_navigation_render_submenu_icon();

		$this->assertStringContainsString( 'data-custom-chevron', $icon );

		// Restore the default icon.
		$this->restore_default_icon( 'core/navigation-submenu' );
	}

	/**
	 * Tests that the Image lightbox overlay resolves its close, previous,
	 * and next icons through the Icon Registry.
	 */
	public function test_image_lightbox_icons_resolve_from_registry() {
		if ( ! function_exists( 'gutenberg_block_core_image_print_lightbox_overlay' ) ) {
			$this->markTestSkipped( 'The image lightbox overlay function is not available.' );
		}

		// The lightbox overlay is printed via a hook on wp_footer.
		// Capture the output of block_core_image_print_lightbox_overlay().
		ob_start();
		gutenberg_block_core_image_print_lightbox_overlay();
		$output = ob_get_clean();

		// Should contain three SVGs (close, prev, next).
		$this->assertStringContainsString( '<svg', $output );
		$this->assertStringContainsString( 'wp-lightbox-close-icon', $output );
		$this->assertStringContainsString( 'wp-lightbox-navigation-icon', $output );
	}

	/**
	 * Tests that a theme can override the Image lightbox close icon
	 * by registering a replacement for the core/close icon.
	 */
	public function test_image_lightbox_close_icon_can_be_overridden_by_theme() {
		if ( ! function_exists( 'gutenberg_block_core_image_print_lightbox_overlay' ) ) {
			$this->markTestSkipped( 'The image lightbox overlay function is not available.' );
		}

		$this->unregister_icon_safe( 'core/close' );
		wp_register_icon(
			'core/close',
			array(
				'label'   => 'Close',
				'content' => '<svg viewBox="0 0 24 24" data-custom-close="true"><path d="M0 0"></path></svg>',
			)
		);

		ob_start();
		gutenberg_block_core_image_print_lightbox_overlay();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'data-custom-close', $output );

		// Restore the default icon.
		$this->restore_default_icon( 'core/close' );
	}

	/**
	 * Tests that the Navigation responsive menu toggle icons resolve through
	 * the Icon Registry.
	 */
	public function test_navigation_responsive_toggle_icons_resolve_from_registry() {
		// Render a navigation block with responsive menu enabled.
		$attributes = array(
			'hasIcon'     => true,
			'icon'        => 'handle',
			'overlayMenu' => 'mobile',
		);

		// The navigation block requires inner blocks; use an empty list.
		$block = new WP_Block(
			array(
				'blockName'    => 'core/navigation',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerContent' => array(),
			)
		);

		$rendered = $block->render();

		// The rendered output should contain SVG elements for the toggle buttons.
		$this->assertStringContainsString( '<svg', $rendered );
	}

	/**
	 * Tests that a theme can override the Navigation menu toggle icon
	 * by registering a replacement for the core/navigation-menu-toggle icon.
	 */
	public function test_navigation_menu_toggle_icon_can_be_overridden_by_theme() {
		$this->unregister_icon_safe( 'core/navigation-menu-toggle' );
		wp_register_icon(
			'core/navigation-menu-toggle',
			array(
				'label'   => 'Navigation Menu Toggle',
				'content' => '<svg viewBox="0 0 24 24" data-custom-toggle="true"><path d="M0 0"></path></svg>',
			)
		);

		$attributes = array(
			'hasIcon'     => true,
			'icon'        => 'handle',
			'overlayMenu' => 'mobile',
		);

		$block = new WP_Block(
			array(
				'blockName'    => 'core/navigation',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerContent' => array(),
			)
		);

		$rendered = $block->render();

		$this->assertStringContainsString( 'data-custom-toggle', $rendered );

		// Restore the default icon.
		$this->restore_default_icon( 'core/navigation-menu-toggle' );
	}

	/**
	 * Helper: unregister an icon without triggering a notice if it is not registered.
	 *
	 * @param string $icon_name The namespaced icon name (e.g. 'core/search').
	 */
	private function unregister_icon_safe( $icon_name ) {
		$registry = WP_Icons_Registry::get_instance();
		if ( $registry->is_registered( $icon_name ) ) {
			$registry->unregister( $icon_name );
		}
	}

	/**
	 * Helper: register a default core icon from the manifest.
	 *
	 * @param string $icon_name The namespaced icon name (e.g. 'core/search').
	 */
	private function register_default_icon( $icon_name ) {
		$icons_directory = gutenberg_dir_path() . 'packages/icons/src';
		$manifest_path   = trailingslashit( $icons_directory ) . 'manifest.php';

		if ( ! is_readable( $manifest_path ) ) {
			return;
		}

		$collection = include $manifest_path;
		$slug       = substr( $icon_name, 5 ); // Strip 'core/'.

		if ( isset( $collection[ $slug ] ) ) {
			wp_register_icon(
				$icon_name,
				array(
					'label'     => $collection[ $slug ]['label'],
					'file_path' => trailingslashit( $icons_directory ) . $collection[ $slug ]['filePath'],
				)
			);
		} elseif ( 'navigation-submenu' === $slug ) {
			wp_register_icon(
				$icon_name,
				array(
					'label'   => 'Navigation Submenu',
					'content' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none"><path d="M1.50002 4L6.00002 8L10.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>',
				)
			);
		} elseif ( 'navigation-menu-toggle' === $slug ) {
			wp_register_icon(
				$icon_name,
				array(
					'label'   => 'Navigation Menu Toggle',
					'content' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 7.5h16v1.5H4z" /><path d="M4 15h16v1.5H4z" /></svg>',
				)
			);
		}
	}

	/**
	 * Helper: restore a default core icon from the manifest.
	 *
	 * @param string $icon_name The namespaced icon name (e.g. 'core/search').
	 */
	private function restore_default_icon( $icon_name ) {
		$registry = WP_Icons_Registry::get_instance();

		// Unregister the override if it is still registered.
		if ( $registry->is_registered( $icon_name ) ) {
			$registry->unregister( $icon_name );
		}

		// Re-register the default from the manifest.
		$this->register_default_icon( $icon_name );
	}
}
