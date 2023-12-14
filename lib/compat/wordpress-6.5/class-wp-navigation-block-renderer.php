<?php
/**
 * WP_Navigation_Block_Renderer class
 *
 * @package gutenberg
 * @since 6.5.0
 */

if ( class_exists( 'WP_Navigation_Block_Renderer' ) ) {
	return;
}

/**
 * Helper functions used to render the navigation block.
 */
class WP_Navigation_Block_Renderer {
	/**
	 * Used to determine which blocks are wrapped in an <li>.
	 *
	 * @var array
	 */
	private static $nav_blocks_wrapped_in_list_item = array(
		'core/navigation-link',
		'core/home-link',
		'core/site-title',
		'core/site-logo',
		'core/navigation-submenu',
	);

	/**
	 * Used to determine which blocks need an <li> wrapper.
	 *
	 * @var array
	 */
	private static $needs_list_item_wrapper = array(
		'core/site-title',
		'core/site-logo',
	);

	/**
	 * Keeps track of all the navigation names that have been seen.
	 *
	 * @var array
	 */
	private static $seen_menu_names = array();

	/**
	 * Returns whether or not this is responsive navigation.
	 *
	 * @param array $attributes The block attributes.
	 * @return bool Returns whether or not this is responsive navigation.
	 */
	private static function is_responsive( $attributes ) {
		/**
		 * This is for backwards compatibility after the `isResponsive` attribute was been removed.
		 */

		$has_old_responsive_attribute = ! empty( $attributes['isResponsive'] ) && $attributes['isResponsive'];
		return isset( $attributes['overlayMenu'] ) && 'never' !== $attributes['overlayMenu'] || $has_old_responsive_attribute;
	}

	/**
	 * Returns whether or not a navigation has a submenu.
	 *
	 * @param WP_Block_List $inner_blocks The list of inner blocks.
	 * @return bool Returns whether or not a navigation has a submenu.
	 */
	private static function has_submenus( $inner_blocks ) {
		foreach ( $inner_blocks as $inner_block ) {
			$inner_block_content = $inner_block->render();
			$p                   = new WP_HTML_Tag_Processor( $inner_block_content );
			if ( $p->next_tag(
				array(
					'name'       => 'LI',
					'class_name' => 'has-child',
				)
			) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Determine whether to load the view script.
	 *
	 * @param array         $attributes   The block attributes.
	 * @param WP_Block_List $inner_blocks The list of inner blocks.
	 * @return bool Returns whether or not to load the view script.
	 */
	private static function should_load_view_script( $attributes, $inner_blocks ) {
		$has_submenus       = static::has_submenus( $inner_blocks );
		$is_responsive_menu = static::is_responsive( $attributes );
		return ( $has_submenus && ( $attributes['openSubmenusOnClick'] || $attributes['showSubmenuIcon'] ) ) || $is_responsive_menu;
	}

	/**
	 * Returns whether or not a block needs a list item wrapper.
	 *
	 * @param WP_Block $block The block.
	 * @return bool Returns whether or not a block needs a list item wrapper.
	 */
	private static function does_block_need_a_list_item_wrapper( $block ) {
		return in_array( $block->name, static::$needs_list_item_wrapper, true );
	}

	/**
	 * Returns the markup for a single inner block.
	 *
	 * @param WP_Block $inner_block The inner block.
	 * @return string Returns the markup for a single inner block.
	 */
	private static function get_markup_for_inner_block( $inner_block ) {
		$inner_block_content = $inner_block->render();
		if ( ! empty( $inner_block_content ) ) {
			if ( static::does_block_need_a_list_item_wrapper( $inner_block ) ) {
				return '<li class="wp-block-navigation-item">' . $inner_block_content . '</li>';
			}

			return $inner_block_content;
		}
	}

	/**
	 * Returns the html for the inner blocks of the navigation block.
	 *
	 * @param array         $attributes   The block attributes.
	 * @param WP_Block_List $inner_blocks The list of inner blocks.
	 * @return string Returns the html for the inner blocks of the navigation block.
	 */
	private static function get_inner_blocks_html( $attributes, $inner_blocks ) {
		$has_submenus            = static::has_submenus( $inner_blocks );
		$should_load_view_script = static::should_load_view_script( $attributes, $inner_blocks );

		$style                = static::get_styles( $attributes );
		$class                = static::get_classes( $attributes );
		$container_attributes = get_block_wrapper_attributes(
			array(
				'class' => 'wp-block-navigation__container ' . $class,
				'style' => $style,
			)
		);

		$inner_blocks_html = '';
		$is_list_open      = false;

		foreach ( $inner_blocks as $inner_block ) {
			$is_list_item = in_array( $inner_block->name, static::$nav_blocks_wrapped_in_list_item, true );

			if ( $is_list_item && ! $is_list_open ) {
				$is_list_open       = true;
				$inner_blocks_html .= sprintf(
					'<ul %1$s>',
					$container_attributes
				);
			}

			if ( ! $is_list_item && $is_list_open ) {
				$is_list_open       = false;
				$inner_blocks_html .= '</ul>';
			}

			$inner_blocks_html .= static::get_markup_for_inner_block( $inner_block );
		}

		if ( $is_list_open ) {
			$inner_blocks_html .= '</ul>';
		}

		// Add directives to the submenu if needed.
		if ( $has_submenus && $should_load_view_script ) {
			$tags              = new WP_HTML_Tag_Processor( $inner_blocks_html );
			$inner_blocks_html = gutenberg_block_core_navigation_add_directives_to_submenu( $tags, $attributes );
		}

		return $inner_blocks_html;
	}

	/**
	 * Gets the inner blocks for the navigation block from the navigation post.
	 *
	 * @param array $attributes The block attributes.
	 * @return WP_Block_List Returns the inner blocks for the navigation block.
	 */
	private static function get_inner_blocks_from_navigation_post( $attributes ) {
		$navigation_post = get_post( $attributes['ref'] );
		if ( ! isset( $navigation_post ) ) {
			return new WP_Block_List( array(), $attributes );
		}

		// Only published posts are valid. If this is changed then a corresponding change
		// must also be implemented in `use-navigation-menu.js`.
		if ( 'publish' === $navigation_post->post_status ) {
			$parsed_blocks = parse_blocks( $navigation_post->post_content );

			// 'parse_blocks' includes a null block with '\n\n' as the content when
			// it encounters whitespace. This code strips it.
			$compacted_blocks = gutenberg_block_core_navigation_filter_out_empty_blocks( $parsed_blocks );

			// TODO - this uses the full navigation block attributes for the
			// context which could be refined.
			return new WP_Block_List( $compacted_blocks, $attributes );
		}
	}

	/**
	 * Gets the inner blocks for the navigation block from the fallback.
	 *
	 * @param array $attributes The block attributes.
	 * @return WP_Block_List Returns the inner blocks for the navigation block.
	 */
	private static function get_inner_blocks_from_fallback( $attributes ) {
		$fallback_blocks = gutenberg_block_core_navigation_get_fallback_blocks();

		// Fallback my have been filtered so do basic test for validity.
		if ( empty( $fallback_blocks ) || ! is_array( $fallback_blocks ) ) {
			return new WP_Block_List( array(), $attributes );
		}

		return new WP_Block_List( $fallback_blocks, $attributes );
	}

	/**
	 * Gets the inner blocks for the navigation block.
	 *
	 * @param array    $attributes The block attributes.
	 * @param WP_Block $block The parsed block.
	 * @return WP_Block_List Returns the inner blocks for the navigation block.
	 */
	private static function get_inner_blocks( $attributes, $block ) {
		$inner_blocks = $block->inner_blocks;

		// Ensure that blocks saved with the legacy ref attribute name (navigationMenuId) continue to render.
		if ( array_key_exists( 'navigationMenuId', $attributes ) ) {
			$attributes['ref'] = $attributes['navigationMenuId'];
		}

		// If:
		// - the gutenberg plugin is active
		// - `__unstableLocation` is defined
		// - we have menu items at the defined location
		// - we don't have a relationship to a `wp_navigation` Post (via `ref`).
		// ...then create inner blocks from the classic menu assigned to that location.
		if (
			defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN &&
			array_key_exists( '__unstableLocation', $attributes ) &&
			! array_key_exists( 'ref', $attributes ) &&
			! empty( gutenberg_block_core_navigation_get_menu_items_at_location( $attributes['__unstableLocation'] ) )
		) {
			$inner_blocks = gutenberg_block_core_navigation_get_inner_blocks_from_unstable_location( $attributes );
		}

		// Load inner blocks from the navigation post.
		if ( array_key_exists( 'ref', $attributes ) ) {
			$inner_blocks = static::get_inner_blocks_from_navigation_post( $attributes );
		}

		// If there are no inner blocks then fallback to rendering an appropriate fallback.
		if ( empty( $inner_blocks ) ) {
			$inner_blocks = static::get_inner_blocks_from_fallback( $attributes );
		}

		/**
		 * Filter navigation block $inner_blocks.
		 * Allows modification of a navigation block menu items.
		 *
		 * @since 6.1.0
		 *
		 * @param \WP_Block_List $inner_blocks
		 */
		$inner_blocks = apply_filters( 'block_core_navigation_render_inner_blocks', $inner_blocks );

		$post_ids = gutenberg_block_core_navigation_get_post_ids( $inner_blocks );
		if ( $post_ids ) {
			_prime_post_caches( $post_ids, false, false );
		}

		return $inner_blocks;
	}

	/**
	 * Gets the name of the current navigation, if it has one.
	 *
	 * @param array $attributes The block attributes.
	 * @return string Returns the name of the navigation.
	 */
	private static function get_navigation_name( $attributes ) {

		$navigation_name = $attributes['ariaLabel'] ?? '';

		// Load the navigation post.
		if ( array_key_exists( 'ref', $attributes ) ) {
			$navigation_post = get_post( $attributes['ref'] );
			if ( ! isset( $navigation_post ) ) {
				return $navigation_name;
			}

			// Only published posts are valid. If this is changed then a corresponding change
			// must also be implemented in `use-navigation-menu.js`.
			if ( 'publish' === $navigation_post->post_status ) {
				$navigation_name = $navigation_post->post_title;

				// This is used to count the number of times a navigation name has been seen,
				// so that we can ensure every navigation has a unique id.
				if ( isset( static::$seen_menu_names[ $navigation_name ] ) ) {
					++static::$seen_menu_names[ $navigation_name ];
				} else {
					static::$seen_menu_names[ $navigation_name ] = 1;
				}
			}
		}

		return $navigation_name;
	}

	/**
	 * Returns the layout class for the navigation block.
	 *
	 * @param array $attributes The block attributes.
	 * @return string Returns the layout class for the navigation block.
	 */
	private static function get_layout_class( $attributes ) {
		$layout_justification = array(
			'left'          => 'items-justified-left',
			'right'         => 'items-justified-right',
			'center'        => 'items-justified-center',
			'space-between' => 'items-justified-space-between',
		);

		$layout_class = '';
		if (
			isset( $attributes['layout']['justifyContent'] ) &&
			isset( $layout_justification[ $attributes['layout']['justifyContent'] ] )
		) {
			$layout_class .= $layout_justification[ $attributes['layout']['justifyContent'] ];
		}
		if ( isset( $attributes['layout']['orientation'] ) && 'vertical' === $attributes['layout']['orientation'] ) {
			$layout_class .= ' is-vertical';
		}

		if ( isset( $attributes['layout']['flexWrap'] ) && 'nowrap' === $attributes['layout']['flexWrap'] ) {
			$layout_class .= ' no-wrap';
		}
		return $layout_class;
	}

	/**
	 * Return classes for the navigation block.
	 *
	 * @param array $attributes The block attributes.
	 * @return string Returns the classes for the navigation block.
	 */
	private static function get_classes( $attributes ) {
		// Restore legacy classnames for submenu positioning.
		$layout_class       = static::get_layout_class( $attributes );
		$colors             = gutenberg_block_core_navigation_build_css_colors( $attributes );
		$font_sizes         = gutenberg_block_core_navigation_build_css_font_sizes( $attributes );
		$is_responsive_menu = static::is_responsive( $attributes );

		// Manually add block support text decoration as CSS class.
		$text_decoration       = $attributes['style']['typography']['textDecoration'] ?? null;
		$text_decoration_class = sprintf( 'has-text-decoration-%s', $text_decoration );

		$classes = array_merge(
			$colors['css_classes'],
			$font_sizes['css_classes'],
			$is_responsive_menu ? array( 'is-responsive' ) : array(),
			$layout_class ? array( $layout_class ) : array(),
			$text_decoration ? array( $text_decoration_class ) : array()
		);
		return implode( ' ', $classes );
	}

	/**
	 * Get styles for the navigation block.
	 *
	 * @param array $attributes The block attributes.
	 * @return string Returns the styles for the navigation block.
	 */
	private static function get_styles( $attributes ) {
		$colors       = gutenberg_block_core_navigation_build_css_colors( $attributes );
		$font_sizes   = gutenberg_block_core_navigation_build_css_font_sizes( $attributes );
		$block_styles = isset( $attributes['styles'] ) ? $attributes['styles'] : '';
		return $block_styles . $colors['inline_styles'] . $font_sizes['inline_styles'];
	}

	/**
	 * Get the responsive container markup
	 *
	 * @param array         $attributes The block attributes.
	 * @param WP_Block_List $inner_blocks The list of inner blocks.
	 * @param string        $inner_blocks_html The markup for the inner blocks.
	 * @return string Returns the container markup.
	 */
	private static function get_responsive_container_markup( $attributes, $inner_blocks, $inner_blocks_html ) {
		$should_load_view_script = static::should_load_view_script( $attributes, $inner_blocks );
		$colors                  = gutenberg_block_core_navigation_build_css_colors( $attributes );
		$modal_unique_id         = wp_unique_id( 'modal-' );

		$is_hidden_by_default = isset( $attributes['overlayMenu'] ) && 'always' === $attributes['overlayMenu'];

		$responsive_container_classes = array(
			'wp-block-navigation__responsive-container',
			$is_hidden_by_default ? 'hidden-by-default' : '',
			implode( ' ', $colors['overlay_css_classes'] ),
		);
		$open_button_classes          = array(
			'wp-block-navigation__responsive-container-open',
			$is_hidden_by_default ? 'always-shown' : '',
		);

		$should_display_icon_label = isset( $attributes['hasIcon'] ) && true === $attributes['hasIcon'];
		$toggle_button_icon        = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="7.5" width="16" height="1.5" /><rect x="4" y="15" width="16" height="1.5" /></svg>';
		if ( isset( $attributes['icon'] ) ) {
			if ( 'menu' === $attributes['icon'] ) {
				$toggle_button_icon = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 5v1.5h14V5H5zm0 7.8h14v-1.5H5v1.5zM5 19h14v-1.5H5V19z" /></svg>';
			}
		}
		$toggle_button_content       = $should_display_icon_label ? $toggle_button_icon : __( 'Menu' );
		$toggle_close_button_icon    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>';
		$toggle_close_button_content = $should_display_icon_label ? $toggle_close_button_icon : __( 'Close' );
		$toggle_aria_label_open      = $should_display_icon_label ? 'aria-label="' . __( 'Open menu' ) . '"' : ''; // Open button label.
		$toggle_aria_label_close     = $should_display_icon_label ? 'aria-label="' . __( 'Close menu' ) . '"' : ''; // Close button label.

		// Add Interactivity API directives to the markup if needed.
		$open_button_directives          = '';
		$responsive_container_directives = '';
		$responsive_dialog_directives    = '';
		$close_button_directives         = '';
		if ( $should_load_view_script ) {
			$open_button_directives          = '
				data-wp-on--click="actions.openMenuOnClick"
				data-wp-on--keydown="actions.handleMenuKeydown"
			';
			$responsive_container_directives = '
				data-wp-class--has-modal-open="state.isMenuOpen"
				data-wp-class--is-menu-open="state.isMenuOpen"
				data-wp-watch="callbacks.initMenu"
				data-wp-on--keydown="actions.handleMenuKeydown"
				data-wp-on--focusout="actions.handleMenuFocusout"
				tabindex="-1"
			';
			$responsive_dialog_directives    = '
				data-wp-bind--aria-modal="state.ariaModal"
				data-wp-bind--aria-label="state.ariaLabel"
				data-wp-bind--role="state.roleAttribute"
				data-wp-watch="callbacks.focusFirstElement"
			';
			$close_button_directives         = '
				data-wp-on--click="actions.closeMenuOnClick"
			';
		}

		return sprintf(
			'<button aria-haspopup="dialog" %3$s class="%6$s" %10$s>%8$s</button>
				<div class="%5$s" style="%7$s" id="%1$s" %11$s>
					<div class="wp-block-navigation__responsive-close" tabindex="-1">
						<div class="wp-block-navigation__responsive-dialog" %12$s>
							<button %4$s class="wp-block-navigation__responsive-container-close" %13$s>%9$s</button>
							<div class="wp-block-navigation__responsive-container-content" id="%1$s-content">
								%2$s
							</div>
						</div>
					</div>
				</div>',
			esc_attr( $modal_unique_id ),
			$inner_blocks_html,
			$toggle_aria_label_open,
			$toggle_aria_label_close,
			esc_attr( implode( ' ', $responsive_container_classes ) ),
			esc_attr( implode( ' ', $open_button_classes ) ),
			esc_attr( safecss_filter_attr( $colors['overlay_inline_styles'] ) ),
			$toggle_button_content,
			$toggle_close_button_content,
			$open_button_directives,
			$responsive_container_directives,
			$responsive_dialog_directives,
			$close_button_directives
		);
	}

	/**
	 * Get the wrapper attributes
	 *
	 * @param array         $attributes    The block attributes.
	 * @param WP_Block_List $inner_blocks  A list of inner blocks.
	 * @return string Returns the navigation block markup.
	 */
	private static function get_nav_wrapper_attributes( $attributes, $inner_blocks ) {
		$nav_menu_name           = static::get_unique_navigation_name( $attributes );
		$should_load_view_script = static::should_load_view_script( $attributes, $inner_blocks );
		$is_responsive_menu      = static::is_responsive( $attributes );
		$style                   = static::get_styles( $attributes );
		$class                   = static::get_classes( $attributes );
		$wrapper_attributes      = get_block_wrapper_attributes(
			array(
				'class'      => $class,
				'style'      => $style,
				'aria-label' => $nav_menu_name,
			)
		);

		if ( $is_responsive_menu ) {
			$nav_element_directives = static::get_nav_element_directives( $should_load_view_script );
			$wrapper_attributes    .= ' ' . $nav_element_directives;
		}

		return $wrapper_attributes;
	}

	/**
	 * Get the nav element directives
	 *
	 * @param bool $should_load_view_script Whether or not the view script should be loaded.
	 * @return string the directives for the navigation element.
	 */
	private static function get_nav_element_directives( $should_load_view_script ) {
		if ( ! $should_load_view_script ) {
			return '';
		}
		// When adding to this array be mindful of security concerns.
		$nav_element_context = wp_json_encode(
			array(
				'overlayOpenedBy' => array(),
				'type'            => 'overlay',
				'roleAttribute'   => '',
				'ariaLabel'       => __( 'Menu' ),
			),
			JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP
		);
		return '
			data-wp-interactive=\'{"namespace":"core/navigation"}\'
			data-wp-context=\'' . $nav_element_context . '\'
		';
	}

	/**
	 * Handle view script loading.
	 *
	 * @param array         $attributes   The block attributes.
	 * @param WP_Block      $block        The parsed block.
	 * @param WP_Block_List $inner_blocks The list of inner blocks.
	 */
	private static function handle_view_script_loading( $attributes, $block, $inner_blocks ) {
		$should_load_view_script = static::should_load_view_script( $attributes, $inner_blocks );
		$is_gutenberg_plugin     = defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN;
		$view_js_file            = 'wp-block-navigation-view';
		$script_handles          = $block->block_type->view_script_handles;

		if ( $is_gutenberg_plugin ) {
			if ( $should_load_view_script ) {
				gutenberg_enqueue_module( '@wordpress/block-library/navigation-block' );
			}
			// Remove the view script because we are using the module.
			$block->block_type->view_script_handles = array_diff( $script_handles, array( $view_js_file ) );
		} else {
			// If the script already exists, there is no point in removing it from viewScript.
			if ( ! wp_script_is( $view_js_file ) ) {

				// If the script is not needed, and it is still in the `view_script_handles`, remove it.
				if ( ! $should_load_view_script && in_array( $view_js_file, $script_handles, true ) ) {
					$block->block_type->view_script_handles = array_diff( $script_handles, array( $view_js_file ) );
				}
				// If the script is needed, but it was previously removed, add it again.
				if ( $should_load_view_script && ! in_array( $view_js_file, $script_handles, true ) ) {
					$block->block_type->view_script_handles = array_merge( $script_handles, array( $view_js_file ) );
				}
			}
		}
	}

	/**
	 * Returns the markup for the navigation block.
	 *
	 * @param array         $attributes The block attributes.
	 * @param WP_Block_List $inner_blocks The list of inner blocks.
	 * @return string Returns the navigation wrapper markup.
	 */
	private static function get_wrapper_markup( $attributes, $inner_blocks ) {
		$inner_blocks_html = static::get_inner_blocks_html( $attributes, $inner_blocks );
		if ( static::is_responsive( $attributes ) ) {
			return static::get_responsive_container_markup( $attributes, $inner_blocks, $inner_blocks_html );
		}
		return $inner_blocks_html;
	}

	/**
	 * Returns a unique name for the navigation.
	 *
	 * @param array $attributes The block attributes.
	 * @return string Returns a unique name for the navigation.
	 */
	private static function get_unique_navigation_name( $attributes ) {
		$nav_menu_name = static::get_navigation_name( $attributes );

		// If the menu name has been used previously then append an ID
		// to the name to ensure uniqueness across a given post.
		if ( isset( static::$seen_menu_names[ $nav_menu_name ] ) && static::$seen_menu_names[ $nav_menu_name ] > 1 ) {
			$count         = static::$seen_menu_names[ $nav_menu_name ];
			$nav_menu_name = $nav_menu_name . ' ' . ( $count );
		}

		return $nav_menu_name;
	}

	/**
	 * Renders the navigation block.
	 *
	 * @param array    $attributes The block attributes.
	 * @param string   $content    The saved content.
	 * @param WP_Block $block      The parsed block.
	 * @return string Returns the navigation block markup.
	 */
	public static function render( $attributes, $content, $block ) {
		/**
		 * Deprecated:
		 * The rgbTextColor and rgbBackgroundColor attributes
		 * have been deprecated in favor of
		 * customTextColor and customBackgroundColor ones.
		 * Move the values from old attrs to the new ones.
		 */
		if ( isset( $attributes['rgbTextColor'] ) && empty( $attributes['textColor'] ) ) {
			$attributes['customTextColor'] = $attributes['rgbTextColor'];
		}

		if ( isset( $attributes['rgbBackgroundColor'] ) && empty( $attributes['backgroundColor'] ) ) {
			$attributes['customBackgroundColor'] = $attributes['rgbBackgroundColor'];
		}

		unset( $attributes['rgbTextColor'], $attributes['rgbBackgroundColor'] );

		$inner_blocks = static::get_inner_blocks( $attributes, $block );
		// Prevent navigation blocks referencing themselves from rendering.
		if ( gutenberg_block_core_navigation_block_contains_core_navigation( $inner_blocks ) ) {
			return '';
		}

		static::handle_view_script_loading( $attributes, $block, $inner_blocks );

		return sprintf(
			'<nav %1$s>%2$s</nav>',
			static::get_nav_wrapper_attributes( $attributes, $inner_blocks ),
			static::get_wrapper_markup( $attributes, $inner_blocks )
		);
	}
}
