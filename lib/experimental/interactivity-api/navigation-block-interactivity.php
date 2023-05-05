<?php

/**
 * Extend WordPress core navigation block to use the Interactivity API.
 *
 * @package gutenberg
 */

$gutenberg_experiments = get_option( 'gutenberg-experiments' );
if ( gutenberg_is_experiment_enabled( 'gutenberg-interactivity-api-navigation-block' ) ) {
	function gutenberg_block_core_navigation_add_directives_to_markup( $block_content ) {
		/**
		 * Interactivity API directives are added using the Tag Processor while it is experimental.
		 * The final HTML of the navigation block will look similar to this:
		 * 
		 * <nav
		 *   data-wp-island
		 *   data-wp-context='{ "core": { "navigation": { "isMenuOpen": false, "overlay": true, "roleAttribute": "" } } }'
		 * >
		 *   <button
		 *     class="wp-block-navigation__responsive-container-open"
		 *     data-wp-on.click="actions.core.navigation.openMenu"
		 *     data-wp-on.keydown="actions.core.navigation.handleMenuKeydown"
		 *   >
		 *   <div
		 *     class="wp-block-navigation__responsive-container"
		 *     data-wp-class.has-modal-open="context.core.navigation.isMenuOpen"
		 *     data-wp-class.is-menu-open="context.core.navigation.isMenuOpen"
		 *     data-wp-bind.aria-hidden="!context.core.navigation.isMenuOpen"
		 *     data-wp-effect="effects.core.navigation.initModal"
		 *     data-wp-on.keydow="actions.core.navigation.handleMenuKeydown"
		 *     data-wp-on.focusout="actions.core.navigation.handleMenuFocusout"
		 *     tabindex="-1"
		 *   >
		 *     <div class="wp-block-navigation__responsive-close">
		 *       <div
		 *         class="wp-block-navigation__responsive-dialog"
		 *         data-wp-bind.aria-modal="context.core.navigation.isMenuOpen"
		 *         data-wp-bind.role="selectors.core.navigation.roleAttribute"
		 *         data-wp-effect="effects.core.navigation.focusFirstElement"   
		 *       >
		 *         <button
		 *           class="wp-block-navigation__responsive-container-close"
		 *           data-wp-on.click="actions.core.navigation.closeMenu"
		 *         >
		 *           <svg>
		 *         <button>
		 *         MENU ITEMS
		 *       </div>
		 *     </div>
		 *   </div>
		 * </nav>
		 */

		$w = new WP_HTML_Tag_Processor( $block_content );
		// Add directives to the `<nav>` element.
		if ( $w->next_tag( 'nav' ) ) {
			$w->set_attribute( 'data-wp-island', '' );
			$w->set_attribute( 'data-wp-context', '{ "core": { "navigation": { "isMenuOpen": false, "overlay": true, "roleAttribute": "" } } }' );
		};

		// Add directives to the open menu button.
		if ( $w->next_tag(
			array(
				'tag_name'   => 'BUTTON',
				'class_name' => 'wp-block-navigation__responsive-container-open',
			)
		) ) {
			$w->set_attribute( 'data-wp-on.click', 'actions.core.navigation.openMenu' );
			$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );
		}

		// Add directives to the menu container.
		if ( $w->next_tag(
			array(
				'tag_name'   => 'DIV',
				'class_name' => 'wp-block-navigation__responsive-container',
			)
		) ) {
			$w->set_attribute( 'data-wp-class.has-modal-open', 'context.core.navigation.isMenuOpen' );
			$w->set_attribute( 'data-wp-class.is-menu-open', 'context.core.navigation.isMenuOpen' );
			$w->set_attribute( 'data-wp-bind.aria-hidden', '!context.core.navigation.isMenuOpen' );
			$w->set_attribute( 'data-wp-effect', 'effects.core.navigation.initModal' );
			$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );
			$w->set_attribute( 'data-wp-on.focusout', 'actions.core.navigation.handleMenuFocusout' );
			$w->set_attribute( 'tabindex', '-1' );
		};

		// Add directives to the dialog container.
		if ( $w->next_tag(
			array(
				'tag_name'   => 'DIV',
				'class_name' => 'wp-block-navigation__responsive-dialog',
			)
		) ) {
			$w->set_attribute( 'data-wp-bind.aria-modal', 'context.core.navigation.isMenuOpen' );
			$w->set_attribute( 'data-wp-bind.role', 'selectors.core.navigation.roleAttribute' );
			$w->set_attribute( 'data-wp-effect', 'effects.core.navigation.focusFirstElement' );
		};

		// Add directives to the close button.
		if ( $w->next_tag(
			array(
				'tag_name'   => 'BUTTON',
				'class_name' => 'wp-block-navigation__responsive-container-close',
			)
		) ) {
			$w->set_attribute( 'data-wp-on.click', 'actions.core.navigation.closeMenu' );
		};

		// Submenus.
		gutenberg_block_core_navigation_add_directives_to_submenu( $w );

		return (string) $w;
	};

	function gutenberg_block_core_navigation_add_directives_to_submenu( $w ) {
		/**
		 * Interactivity API directives are added using the Tag Processor while it is experimental.
		 * The final HTML of the navigation-submenu and the page-list blocks will look similar to this:
		 * 
		 * <li
		 *   class="has-child"
		 *   data-wp-context='{ "core": { "navigation": { "isMenuOpen": false, "overlay": false } } }'
		 * >
		 *   <button
		 *     class="wp-block-navigation-submenu__toggle"
		 *     data-wp-on.click="actions.core.navigation.openMenu"
		 *     data-wp-bind.aria-expanded="context.core.navigation.isMenuOpen"
		 *     data-wp-on.keydown="actions.core.navigation.handleMenuKeydown"
		 *     data-wp-on.focusout="actions.core.navigation.handleMenuFocusout"
		 *   >
		 *   </button>
		 *   <span>Title</span>
		 *   <ul
		 *     class="wp-block-navigation__submenu-container"
		 *     data-wp-effect="effects.core.navigation.initModal"
		 *     data-wp-on.focusout="actions.core.navigation.handleMenuFocusout"
		 *     data-wp-on.keydown="actions.core.navigation.handleMenuKeydown"
		 *   >
		 *     SUBMENU ITEMS
		 *   </ul>
		 * </li>
		 */

		while ( $w->next_tag(
			array(
				'tag_name'   => 'LI',
				'class_name' => 'has-child',
			)
		) ) {
			// Add directives to the parent `<li>`.
			$w->set_attribute( 'data-wp-context', '{ "core": { "navigation": { "isMenuOpen": false, "overlay": false } } }' );

			// Add directives to the toggle submenu button.
			if ( $w->next_tag(
				array(
					'tag_name'   => 'BUTTON',
					'class_name' => 'wp-block-navigation-submenu__toggle',
				)
			) ) {
				$w->set_attribute( 'data-wp-on.click', 'actions.core.navigation.openMenu' );
				$w->set_attribute( 'data-wp-bind.aria-expanded', 'context.core.navigation.isMenuOpen' );
				$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );
				$w->set_attribute( 'data-wp-on.focusout', 'actions.core.navigation.handleMenuFocusout' );
			};

			// Add directives to the `<ul>` containing the subitems.
			if ( $w->next_tag(
				array(
					'tag_name'   => 'UL',
					'class_name' => 'wp-block-navigation__submenu-container',
				)
			) ) {
				$w->set_attribute( 'data-wp-effect', 'effects.core.navigation.initModal' );
				$w->set_attribute( 'data-wp-on.focusout', 'actions.core.navigation.handleMenuFocusout' );
				$w->set_attribute( 'data-wp-on.keydown', 'actions.core.navigation.handleMenuKeydown' );
			};
			// Iterate through subitems if exist.
			gutenberg_block_core_navigation_add_directives_to_submenu( $w );
		}
	};

	add_filter( 'render_block_core/navigation', 'gutenberg_block_core_navigation_add_directives_to_markup', 10, 1 );

	// Enqueue the `interactivity.js` file with the store.
	add_filter(
		'block_type_metadata',
		function ( $metadata ) {
			if ( 'core/navigation' === $metadata['name'] ) {
				wp_enqueue_script(
					'wp-block-navigation-view',
					gutenberg_url( 'build/block-library/interactive-blocks/navigation.min.js' ),
					array( 'wp-interactivity-runtime' ),
				);
			}
			return $metadata;
		},
		10,
		1
	);
}
