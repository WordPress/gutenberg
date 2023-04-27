<?php

/**
 * Extend WordPress core navigation block to use the Interactivity API.
 *
 * @package gutenberg
 */

$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( $gutenberg_experiments && array_key_exists( 'gutenberg-interactivity-api-navigation-block', $gutenberg_experiments ) ) {
	function add_directives_to_navigation_block( $block_content ) {
		$w = new WP_HTML_Tag_Processor( $block_content );
		// Add directives to the `<nav>` element
		$w->next_tag( 'nav' );
		$w->set_attribute( 'data-wp-island', '' );
		$w->set_attribute( 'data-wp-context', '{ "isMenuOpen": false, "overlay": true, "roleAttribute": "" }' );

		// Add directives to the open menu button
		$w->next_tag(
			array(
				'tag_name'   => 'BUTTON',
				'class_name' => 'wp-block-navigation__responsive-container-open',
			)
		);
		$w->set_attribute( 'data-wp-on.click', 'actions.core.navigation.openMenu' );
		$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );

		// Add directives to the menu container
		$w->next_tag(
			array(
				'tag_name'   => 'DIV',
				'class_name' => 'wp-block-navigation__responsive-container',
			)
		);
		$w->set_attribute( 'data-wp-class.has-modal-open', 'context.isMenuOpen' );
		$w->set_attribute( 'data-wp-class.is-menu-open', 'context.isMenuOpen' );
		$w->set_attribute( 'data-wp-bind.aria-hidden', '!context.isMenuOpen' );
		$w->set_attribute( 'data-wp-effect', 'effects.core.navigation.initModal' );
		$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );
		$w->set_attribute( 'data-wp-on.focusout', 'actions.core.navigation.handleMenuFocusout' );
		$w->set_attribute( 'tabindex', '-1' );

		// Add directives to the dialog container
		$w->next_tag(
			array(
				'tag_name'   => 'DIV',
				'class_name' => 'wp-block-navigation__responsive-dialog',
			)
		);
		$w->set_attribute( 'data-wp-bind.aria-modal', 'context.isMenuOpen' );
		$w->set_attribute( 'data-wp-bind.role', 'context.roleAttribute' );
		$w->set_attribute( 'data-wp-effect', 'effects.core.navigation.focusFirstElement' );

		// Add directives to the close button
		$w->next_tag(
			array(
				'tag_name'   => 'BUTTON',
				'class_name' => 'wp-block-navigation__responsive-container-close',
			)
		);
		$w->set_attribute( 'data-wp-on.click', 'actions.core.navigation.closeMenu' );

		// Submenus
		handle_submenu( $w );

		return (string) $w;
	};

	function handle_submenu( $w ) {
		while ( $w->next_tag(
			array(
				'tag_name'   => 'LI',
				'class_name' => 'has-child',
			)
		) ) {
			// Add directives to the parent `<li>`
			$w->set_attribute( 'data-wp-context', '{ "isMenuOpen": false, "overlay": false }' );

			// Add directives to the toggle submenu button
			$w->next_tag(
				array(
					'tag_name'   => 'BUTTON',
					'class_name' => 'wp-block-navigation-submenu__toggle',
				)
			);
			$w->set_attribute( 'data-wp-on.click', 'actions.core.navigation.openMenu' );
			$w->set_attribute( 'data-wp-bind.aria-expanded', 'context.isMenuOpen' );
			$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );
			$w->set_attribute( 'data-wp-on.focusout', 'actions.core.navigation.handleMenuFocusout' );

			// Add directives to the `<ul>` containing the subitems
			$w->next_tag(
				array(
					'tag_name'   => 'UL',
					'class_name' => 'wp-block-navigation__submenu-container',
				)
			);
			$w->set_attribute( 'data-wp-effect', 'effects.core.navigation.initModal' );
			$w->set_attribute( 'data-wp-on.focusout', 'actions.core.navigation.handleMenuFocusout' );
			$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );

			// Iterate through subitems if exist
			handle_submenu( $w );
		}
	};

	add_filter( 'render_block_core/navigation', 'add_directives_to_navigation_block', 10, 1 );
}
