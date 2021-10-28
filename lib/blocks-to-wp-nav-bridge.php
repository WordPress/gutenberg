<?php

function render_block_menu_as_wp_menu( $nav_block ) {
	$blocks_disguised_as_posts = transform_navigation_block_into_wp_posts( $nav_block );
	// An arg like "navigationPostId" could work better here
	return wp_nav_menu_with_override_menu_items_arg(
		array(
			'menu'                => 0,
			'override_menu_items' => $blocks_disguised_as_posts,
		)
	);
}

/**
 * This takes a navigation block and returns a list of fake wp_post-like objects
 */
function transform_navigation_block_into_wp_posts( $nav_block ) {
	$all_posts = array();
	$stack     = array();
	$order     = 0;
	foreach ( $nav_block as $block ) {
		$stack[] = array(
			'block'  => $block,
			'parent' => 0,
		);
	}

	while ( ! empty( $stack ) ) {
		$item = array_pop( $stack );
		$post = block_to_post( $item['block'], ++$order, $item['parent'] );
		if ( $post ) {
			$all_posts[] = $post;
		}
		$inner_blocks = ! empty( $item['block']['innerBlocks'] ) ? $item['block']['innerBlocks'] : array();
		foreach ( $inner_blocks as $inner_block ) {
			array_unshift(
				$stack,
				array(
					'block'  => $inner_block,
					'parent' => $post ? $post->ID : 0,
				)
			);
		}
	}

	return $all_posts;
}

function block_to_post( $block, $order, $parent ) {
	static $id = 1;
	$type      = ! empty( $block['attrs']['type'] ) ? str_replace( '-', '_', $block['attrs']['type'] ) : '';
	// unset($block['innerBlocks']);
	// (print_r($block));
	if ( $block['blockName'] === 'core/navigation' ) {
		return null;
	}

	$my_id = ++$id;
	return (object) array(
		'ID'                    => $my_id,
		'post_author'           => 1,
		'post_date'             => '2021-09-21 12:10:51',
		'post_date_gmt'         => '2021-09-20 13:28:18',
		'post_content'          => ! empty( $block['attrs']['content'] ) ? $block['attrs']['content'] : '',
		'post_title'            => ! empty( $block['attrs']['label'] ) ? $block['attrs']['label'] : '',
		'post_excerpt'          => null,
		'post_status'           => 'publish',
		'comment_status'        => 'closed',
		'ping_status'           => 'closed',
		'post_password'         => null,
		'post_name'             => 'menu-item-' . $order,
		'to_ping'               => null,
		'pinged'                => null,
		'post_modified'         => '2021-09-21 12:10:51',
		'post_modified_gmt'     => '2021-09-21 12:10:51',
		'post_content_filtered' => null,
		'post_parent'           => 0,
		'guid'                  => 'http://localhost:8888/?p=785',
		'menu_order'            => $order,
		'post_type'             => 'nav_menu_item',
		'post_mime_type'        => null,
		'comment_count'         => null,
		'filter'                => 'raw',
		'db_id'                 => $my_id, // ! empty( $block['attrs']['id']) ? $block['attrs']['id'] : "",
		'menu_item_parent'      => $parent,
		'object_id'             => $my_id, // $type !== 'custom' && $block['attrs']['id'] ? $block['attrs']['id'] : '',
		'object'                => 'page', // ! empty( $block['attrs']['type'] ) ? $block['attrs']['type'] : '',
		'type'                  => 'post_type', // $type,
		'current'               => '',
		// 'type_label'            => 'Page',
		'url'                   => $block['attrs']['url'],
		'title'                 => $block['attrs']['label'],
		'target'                => ! empty( $block['attrs']['opensInNewTab'] ) && $block['attrs']['opensInNewTab'] ? '_blank' : '',
		'attr_title'            => ! empty( $block['attrs']['title'] ) ? $block['attrs']['title'] : '',
		'description'           => null,
		'classes'               => array(),
		'xfn'                   => ! empty( $block['attrs']['rel'] ) ? $block['attrs']['rel'] : '',
	);
}


/**
 * this is just wp_nav_menu with these lines added:
 * if ( count( $args->override_menu_items ) ) {
 *     $menu_items = $args->override_menu_items;
 * }
 */
function wp_nav_menu_with_override_menu_items_arg( $args = array() ) {
	static $menu_id_slugs = array();

	$defaults = array(
		'menu'                 => '',
		'container'            => 'div',
		'container_class'      => '',
		'container_id'         => '',
		'container_aria_label' => '',
		'menu_class'           => 'menu',
		'menu_id'              => '',
		'echo'                 => true,
		'fallback_cb'          => 'wp_page_menu',
		'before'               => '',
		'after'                => '',
		'link_before'          => '',
		'link_after'           => '',
		'items_wrap'           => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		'item_spacing'         => 'preserve',
		'depth'                => 0,
		'walker'               => '',
		'theme_location'       => '',
		'override_items'       => array(),
	);

	$args = wp_parse_args( $args, $defaults );

	if ( ! in_array( $args['item_spacing'], array( 'preserve', 'discard' ), true ) ) {
		// Invalid value, fall back to default.
		$args['item_spacing'] = $defaults['item_spacing'];
	}

	/**
	 * Filters the arguments used to display a navigation menu.
	 *
	 * @since 3.0.0
	 *
	 * @see wp_nav_menu()
	 *
	 * @param array $args Array of wp_nav_menu() arguments.
	 */
	$args = apply_filters( 'wp_nav_menu_args', $args );
	$args = (object) $args;

	/**
	 * Filters whether to short-circuit the wp_nav_menu() output.
	 *
	 * Returning a non-null value from the filter will short-circuit wp_nav_menu(),
	 * echoing that value if $args->echo is true, returning that value otherwise.
	 *
	 * @since 3.9.0
	 *
	 * @see wp_nav_menu()
	 *
	 * @param string|null $output Nav menu output to short-circuit with. Default null.
	 * @param stdClass    $args   An object containing wp_nav_menu() arguments.
	 */
	$nav_menu = apply_filters( 'pre_wp_nav_menu', null, $args );

	if ( null !== $nav_menu ) {
		if ( $args->echo ) {
			echo $nav_menu;
			return;
		}

		return $nav_menu;
	}

	// Get the nav menu based on the requested menu.
	$menu = wp_get_nav_menu_object( $args->menu );

	// Get the nav menu based on the theme_location.
	$locations = get_nav_menu_locations();
	if ( ! $menu && $args->theme_location && $locations && isset( $locations[ $args->theme_location ] ) ) {
		$menu = wp_get_nav_menu_object( $locations[ $args->theme_location ] );
	}

	// Get the first menu that has items if we still can't find a menu.
	if ( ! $menu && ! $args->theme_location ) {
		$menus = wp_get_nav_menus();
		foreach ( $menus as $menu_maybe ) {
			$menu_items = wp_get_nav_menu_items( $menu_maybe->term_id, array( 'update_post_term_cache' => false ) );
			if ( $menu_items ) {
				$menu = $menu_maybe;
				break;
			}
		}
	}

	if ( empty( $args->menu ) ) {
		$args->menu = $menu;
	}

	// If the menu exists, get its items.
	if ( $menu && ! is_wp_error( $menu ) && ! isset( $menu_items ) ) {
		$menu_items = wp_get_nav_menu_items( $menu->term_id, array( 'update_post_term_cache' => false ) );
	}

	/*
	 * If no menu was found:
	 *  - Fall back (if one was specified), or bail.
	 *
	 * If no menu items were found:
	 *  - Fall back, but only if no theme location was specified.
	 *  - Otherwise, bail.
	 */
	if ( ( ! $menu || is_wp_error( $menu ) || ( isset( $menu_items ) && empty( $menu_items ) && ! $args->theme_location ) )
		 && isset( $args->fallback_cb ) && $args->fallback_cb && is_callable( $args->fallback_cb ) ) {
		return call_user_func( $args->fallback_cb, (array) $args );
	}

	if ( ! $menu || is_wp_error( $menu ) ) {
		return false;
	}

	$nav_menu = '';
	$items    = '';

	$show_container = false;
	if ( $args->container ) {
		/**
		 * Filters the list of HTML tags that are valid for use as menu containers.
		 *
		 * @since 3.0.0
		 *
		 * @param string[] $tags The acceptable HTML tags for use as menu containers.
		 *                       Default is array containing 'div' and 'nav'.
		 */
		$allowed_tags = apply_filters( 'wp_nav_menu_container_allowedtags', array( 'div', 'nav' ) );

		if ( is_string( $args->container ) && in_array( $args->container, $allowed_tags, true ) ) {
			$show_container = true;
			$class          = $args->container_class ? ' class="' . esc_attr( $args->container_class ) . '"' : ' class="menu-' . $menu->slug . '-container"';
			$id             = $args->container_id ? ' id="' . esc_attr( $args->container_id ) . '"' : '';
			$aria_label     = ( 'nav' === $args->container && $args->container_aria_label ) ? ' aria-label="' . esc_attr( $args->container_aria_label ) . '"' : '';
			$nav_menu      .= '<' . $args->container . $id . $class . $aria_label . '>';
		}
	}

	if ( count( $args->override_menu_items ) ) {
		$menu_items = $args->override_menu_items;
	}

	// Set up the $menu_item variables.
	_wp_menu_item_classes_by_context( $menu_items );

	$sorted_menu_items        = array();
	$menu_items_with_children = array();
	foreach ( (array) $menu_items as $menu_item ) {
		$sorted_menu_items[ $menu_item->menu_order ] = $menu_item;
		if ( $menu_item->menu_item_parent ) {
			$menu_items_with_children[ $menu_item->menu_item_parent ] = true;
		}
	}

	// Add the menu-item-has-children class where applicable.
	if ( $menu_items_with_children ) {
		foreach ( $sorted_menu_items as &$menu_item ) {
			if ( isset( $menu_items_with_children[ $menu_item->ID ] ) ) {
				$menu_item->classes[] = 'menu-item-has-children';
			}
		}
	}

	unset( $menu_items, $menu_item );

	/**
	 * Filters the sorted list of menu item objects before generating the menu's HTML.
	 *
	 * @since 3.1.0
	 *
	 * @param array    $sorted_menu_items The menu items, sorted by each menu item's menu order.
	 * @param stdClass $args              An object containing wp_nav_menu() arguments.
	 */
	$sorted_menu_items = apply_filters( 'wp_nav_menu_objects', $sorted_menu_items, $args );

	$items .= walk_nav_menu_tree( $sorted_menu_items, $args->depth, $args );
	unset( $sorted_menu_items );

	// Attributes.
	if ( ! empty( $args->menu_id ) ) {
		$wrap_id = $args->menu_id;
	} else {
		$wrap_id = 'menu-' . $menu->slug;

		while ( in_array( $wrap_id, $menu_id_slugs, true ) ) {
			if ( preg_match( '#-(\d+)$#', $wrap_id, $matches ) ) {
				$wrap_id = preg_replace( '#-(\d+)$#', '-' . ++$matches[1], $wrap_id );
			} else {
				$wrap_id = $wrap_id . '-1';
			}
		}
	}
	$menu_id_slugs[] = $wrap_id;

	$wrap_class = $args->menu_class ? $args->menu_class : '';

	/**
	 * Filters the HTML list content for navigation menus.
	 *
	 * @since 3.0.0
	 *
	 * @see wp_nav_menu()
	 *
	 * @param string   $items The HTML list content for the menu items.
	 * @param stdClass $args  An object containing wp_nav_menu() arguments.
	 */
	$items = apply_filters( 'wp_nav_menu_items', $items, $args );
	/**
	 * Filters the HTML list content for a specific navigation menu.
	 *
	 * @since 3.0.0
	 *
	 * @see wp_nav_menu()
	 *
	 * @param string   $items The HTML list content for the menu items.
	 * @param stdClass $args  An object containing wp_nav_menu() arguments.
	 */
	$items = apply_filters( "wp_nav_menu_{$menu->slug}_items", $items, $args );

	// Don't print any markup if there are no items at this point.
	if ( empty( $items ) ) {
		return false;
	}

	$nav_menu .= sprintf( $args->items_wrap, esc_attr( $wrap_id ), esc_attr( $wrap_class ), $items );
	unset( $items );

	if ( $show_container ) {
		$nav_menu .= '</' . $args->container . '>';
	}

	/**
	 * Filters the HTML content for navigation menus.
	 *
	 * @since 3.0.0
	 *
	 * @see wp_nav_menu()
	 *
	 * @param string   $nav_menu The HTML content for the navigation menu.
	 * @param stdClass $args     An object containing wp_nav_menu() arguments.
	 */
	$nav_menu = apply_filters( 'wp_nav_menu', $nav_menu, $args );

	if ( $args->echo ) {
		echo $nav_menu;
	} else {
		return $nav_menu;
	}
}

/**
 * Showtime! We can parse a navigation block and render it using the navigation walker.
 */
function links_demo() {
	$blocks_html = '
<!-- wp:navigation -->
<!-- wp:navigation-link {"label":"Lorem Ipsum","type":"post","id":89,"url":"https://wordpress.org","kind":"post-type","isTopLevelLink":true} /-->

<!-- wp:navigation-submenu {"label":"Lorem Ipsum","type":"post","id":89,"url":"https://wordpress.org","kind":"post-type","isTopLevelItem":true} -->
<!-- wp:navigation-link {"label":"Lorem Ipsum","type":"post","id":89,"url":"https://wordpress.org","kind":"post-type","isTopLevelLink":false} /-->

<!-- wp:navigation-submenu {"label":"Lorem Ipsum","type":"post","id":77,"url":"https://wordpress.org/","kind":"post-type","isTopLevelItem":false} -->
<!-- wp:navigation-link {"label":"Lorem Ipsum","type":"post","id":89,"url":"https://wordpress.org","kind":"post-type","isTopLevelLink":false} /-->
<!-- /wp:navigation-submenu -->
<!-- /wp:navigation-submenu -->
<!-- /wp:navigation -->';

	$blocks = array_filter(
		parse_blocks( $blocks_html ),
		function ( $block ) {
			return isset( $block['blockName'] );
		}
	);

	echo render_block_menu_as_wp_menu( $blocks );
	die();
}

add_action( 'init', 'links_demo' );
