<?php
/**
 * Template parts as registered patterns.
 *
 * Theme template part files (and plugin-registered parts) become synced
 * registered patterns named `<theme>/part/<slug>`, existing
 * `wp_template_part` posts become customizations of those patterns (or user
 * patterns, for custom parts), and `core/template-part` blocks are rendered
 * as `core/block` instances.
 *
 * @package gutenberg
 */

/**
 * The meta on a pattern copy holding the template part area a migrated part
 * had, so custom parts without a theme file keep their area.
 */
define( 'GUTENBERG_PATTERN_AREA_META_KEY', 'wp_pattern_area' );

/**
 * Registers the `wp_pattern_area` meta on `wp_block` posts.
 */
function gutenberg_register_pattern_area_meta() {
	register_post_meta(
		'wp_block',
		GUTENBERG_PATTERN_AREA_META_KEY,
		array(
			'type'         => 'string',
			'single'       => true,
			'show_in_rest' => true,
			'label'        => __( 'Template part area', 'gutenberg' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_pattern_area_meta' );

/**
 * Returns the registered pattern name of a template part.
 *
 * @param string $theme Theme stylesheet (or plugin id) the part belongs to.
 * @param string $slug  Template part slug.
 * @return string Pattern name.
 */
function gutenberg_get_template_part_pattern_name( $theme, $slug ) {
	return $theme . '/part/' . $slug;
}

/**
 * Whether a registered pattern name is one of a template part.
 *
 * @param string $name Pattern name.
 * @return bool
 */
function gutenberg_is_template_part_pattern_name( $name ) {
	return is_string( $name ) && str_contains( $name, '/part/' );
}

/**
 * Builds the registration properties shared by every template part pattern.
 *
 * @param string $title Pattern title.
 * @param string $area  Template part area.
 * @return array Pattern properties.
 */
function gutenberg_get_template_part_pattern_properties( $title, $area ) {
	$area       = $area ? _filter_block_template_part_area( $area ) : WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
	$properties = array(
		'title'      => $title,
		'synced'     => true,
		'area'       => $area,
		'source'     => 'theme',
		// Existing area-scoped suggestions look for this block type.
		'blockTypes' => array( 'core/template-part/' . $area ),
		'inserter'   => 'navigation-overlay' !== $area,
	);
	// Navigation overlays belong to the Navigation block, not to a pattern
	// category.
	if ( WP_TEMPLATE_PART_AREA_UNCATEGORIZED !== $area && 'navigation-overlay' !== $area ) {
		$properties['categories'] = array( $area );
	}
	return $properties;
}

/**
 * Registers the active theme's template part files and plugin-registered
 * template parts as synced patterns.
 *
 * Runs after the theme's own patterns are registered, so a theme cannot be
 * shadowed by its parts and parts get the `Synced`/`Area` treatment last.
 */
function gutenberg_register_template_parts_as_patterns() {
	if ( empty( wp_get_active_and_valid_themes() ) || ! wp_is_block_theme() ) {
		return;
	}
	$registry = WP_Block_Patterns_Registry::get_instance();

	// Theme files: the child theme's and the parent's it does not override,
	// all named after the active stylesheet, the way core resolved parts
	// through both directories. The list is child theme first.
	$stylesheet = get_stylesheet();
	foreach ( _get_block_templates_files( 'wp_template_part' ) as $file ) {
		$name = gutenberg_get_template_part_pattern_name( $stylesheet, $file['slug'] );
		if ( $registry->is_registered( $name ) ) {
			continue;
		}
		$title                  = ! empty( $file['title'] ) ? $file['title'] : ucwords( str_replace( array( '-', '_' ), ' ', $file['slug'] ) );
		$properties             = gutenberg_get_template_part_pattern_properties( $title, $file['area'] ?? '' );
		$properties['filePath'] = $file['path'];
		register_block_pattern( $name, $properties );
	}

	// Plugin-registered parts.
	if ( class_exists( 'WP_Block_Templates_Registry' ) ) {
		foreach ( WP_Block_Templates_Registry::get_instance()->get_all_registered() as $template ) {
			if ( 'wp_template_part' !== $template->type ) {
				continue;
			}
			$name = gutenberg_get_template_part_pattern_name( $template->theme, $template->slug );
			if ( $registry->is_registered( $name ) ) {
				continue;
			}
			$properties            = gutenberg_get_template_part_pattern_properties( $template->title, $template->area ?? '' );
			$properties['content'] = $template->content;
			$properties['source']  = 'plugin';
			register_block_pattern( $name, $properties );
		}
	}
}
add_action( 'init', 'gutenberg_register_template_parts_as_patterns', 12 );

/**
 * Whether a template part has a registered original for the migration to
 * customize: a theme file (child or parent theme) or a plugin registration.
 * Parts of an inactive theme cannot be checked and are treated as having one.
 *
 * @param string $theme Theme stylesheet the part belongs to.
 * @param string $slug  Template part slug.
 * @return bool
 */
function gutenberg_template_part_has_registered_original( $theme, $slug ) {
	if ( get_stylesheet() !== $theme && get_template() !== $theme ) {
		return true;
	}
	if ( null !== _get_block_template_file( 'wp_template_part', $slug ) ) {
		return true;
	}
	if ( class_exists( 'WP_Block_Templates_Registry' ) ) {
		foreach ( WP_Block_Templates_Registry::get_instance()->get_all_registered() as $template ) {
			if ( 'wp_template_part' === $template->type && $template->slug === $slug ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Files a user pattern under the pattern category of its template part area,
 * so the Patterns pages list it with the theme's parts of that area.
 *
 * @param int    $post_id The `wp_block` post id.
 * @param string $area    Template part area.
 */
function gutenberg_assign_template_part_area_category( $post_id, $area ) {
	if ( ! $area || WP_TEMPLATE_PART_AREA_UNCATEGORIZED === $area || 'navigation-overlay' === $area ) {
		return;
	}
	$term = term_exists( $area, 'wp_pattern_category' );
	if ( ! $term ) {
		$label = $area;
		foreach ( get_allowed_block_template_part_areas() as $definition ) {
			if ( $definition['area'] === $area ) {
				$label = $definition['label'];
			}
		}
		$term = wp_insert_term( $label, 'wp_pattern_category', array( 'slug' => $area ) );
	}
	if ( ! is_wp_error( $term ) ) {
		wp_set_object_terms( $post_id, (int) $term['term_id'], 'wp_pattern_category', true );
	}
}

/**
 * Migrates one `wp_template_part` post and moves the original to the trash,
 * so the migration can be undone by hand.
 *
 * A part customizing a theme file or a plugin registration becomes the
 * customization of that part's pattern: a `wp_block` post carrying the
 * `wp_pattern_slug` meta (`<theme>/part/<slug>`). A custom part that only
 * ever existed in the database becomes a regular user pattern, keeping its
 * slug and its area (`wp_pattern_area` meta).
 *
 * @param WP_Post $part The template part post.
 * @return int|WP_Error The `wp_block` post id, or an error.
 */
function gutenberg_migrate_template_part_post( $part ) {
	$theme_terms = get_the_terms( $part->ID, 'wp_theme' );
	$theme       = ( is_array( $theme_terms ) && ! empty( $theme_terms ) ) ? $theme_terms[0]->name : get_stylesheet();
	if ( get_template() === $theme ) {
		// Parts are named after the active stylesheet, parent theme included.
		$theme = get_stylesheet();
	}
	$area_terms = get_the_terms( $part->ID, 'wp_template_part_area' );
	$area       = ( is_array( $area_terms ) && ! empty( $area_terms ) ) ? $area_terms[0]->name : WP_TEMPLATE_PART_AREA_UNCATEGORIZED;

	$postarr   = array(
		'post_type'    => 'wp_block',
		'post_status'  => 'publish' === $part->post_status ? 'publish' : 'draft',
		'post_title'   => $part->post_title,
		'post_content' => $part->post_content,
		'post_excerpt' => $part->post_excerpt,
		'post_author'  => $part->post_author,
		'meta_input'   => array(
			GUTENBERG_PATTERN_AREA_META_KEY => $area,
		),
	);
	$is_custom = ! gutenberg_template_part_has_registered_original( $theme, $part->post_name );
	if ( $is_custom ) {
		$postarr['post_name'] = $part->post_name;
	} else {
		$postarr['meta_input']['wp_pattern_slug'] = gutenberg_get_template_part_pattern_name( $theme, $part->post_name );
	}

	$copy_id = wp_insert_post( $postarr, true );
	if ( is_wp_error( $copy_id ) ) {
		return $copy_id;
	}
	if ( $is_custom ) {
		gutenberg_assign_template_part_area_category( $copy_id, $area );
	}
	wp_trash_post( $part->ID );
	return $copy_id;
}

/**
 * Turns a customization whose registered original does not exist (an
 * earlier migration of a custom part) into a regular user pattern.
 *
 * @param WP_Post $copy The `wp_block` post.
 */
function gutenberg_migrate_orphan_part_customization( $copy ) {
	$name   = get_post_meta( $copy->ID, 'wp_pattern_slug', true );
	$prefix = gutenberg_get_template_part_pattern_name( get_stylesheet(), '' );
	if ( ! is_string( $name ) || ! str_starts_with( $name, $prefix ) ) {
		return;
	}
	$slug = substr( $name, strlen( $prefix ) );
	if ( WP_Block_Patterns_Registry::get_instance()->is_registered( $name ) || gutenberg_template_part_has_registered_original( get_stylesheet(), $slug ) ) {
		return;
	}
	delete_post_meta( $copy->ID, 'wp_pattern_slug' );
	wp_update_post(
		array(
			'ID'        => $copy->ID,
			'post_name' => $slug,
		)
	);
	gutenberg_assign_template_part_area_category( $copy->ID, get_post_meta( $copy->ID, GUTENBERG_PATTERN_AREA_META_KEY, true ) );
}

/**
 * The version of the template part migration this code performs.
 */
define( 'GUTENBERG_TEMPLATE_PARTS_MIGRATION_VERSION', 2 );

/**
 * Migrates `wp_template_part` posts to `wp_block` posts: customizations of
 * the parts' patterns, or user patterns for custom parts.
 *
 * Runs once per migration version; parts that appear later are migrated when
 * saved.
 */
function gutenberg_migrate_template_parts_to_patterns() {
	if ( (int) get_option( 'gutenberg_template_parts_migrated' ) >= GUTENBERG_TEMPLATE_PARTS_MIGRATION_VERSION ) {
		return;
	}
	$parts = get_posts(
		array(
			'post_type'      => 'wp_template_part',
			'post_status'    => array( 'publish', 'draft', 'future', 'pending', 'private' ),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		)
	);
	foreach ( $parts as $part ) {
		gutenberg_migrate_template_part_post( $part );
	}

	// Version 1 migrated custom parts to customizations of a pattern that
	// does not exist; they are user patterns.
	$copies = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => array( 'publish', 'draft' ),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => 'wp_pattern_slug',
					'value'   => '/part/',
					'compare' => 'LIKE',
				),
			),
		)
	);
	foreach ( $copies as $copy ) {
		gutenberg_migrate_orphan_part_customization( $copy );
	}
	update_option( 'gutenberg_template_parts_migrated', GUTENBERG_TEMPLATE_PARTS_MIGRATION_VERSION );
}
add_action( 'init', 'gutenberg_migrate_template_parts_to_patterns', 13 );

/**
 * Returns the user pattern standing in for a custom template part: the
 * published `wp_block` post with the part's slug and an area, that is not the
 * customization of a registered pattern.
 *
 * @param string $slug Template part slug.
 * @return WP_Post|null The user pattern, or null.
 */
function gutenberg_get_user_template_part( $slug ) {
	$posts = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'name'           => $slug,
			'posts_per_page' => 1,
			'no_found_rows'  => true,
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => GUTENBERG_PATTERN_AREA_META_KEY,
					'compare' => 'EXISTS',
				),
				array(
					'key'     => 'wp_pattern_slug',
					'compare' => 'NOT EXISTS',
				),
			),
		)
	);
	return $posts ? $posts[0] : null;
}

/**
 * Returns the custom template parts (user patterns with an area) whose slug
 * no registered part pattern takes, keyed by slug, for the block parser.
 *
 * @return array[] `{ id, area }` keyed by slug.
 */
function gutenberg_get_user_template_parts() {
	$registry = WP_Block_Patterns_Registry::get_instance();
	$parts    = array();
	$posts    = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => GUTENBERG_PATTERN_AREA_META_KEY,
					'compare' => 'EXISTS',
				),
				array(
					'key'     => 'wp_pattern_slug',
					'compare' => 'NOT EXISTS',
				),
			),
		)
	);
	foreach ( $posts as $post ) {
		if ( $registry->is_registered( gutenberg_get_template_part_pattern_name( get_stylesheet(), $post->post_name ) ) ) {
			continue;
		}
		$parts[ $post->post_name ] = array(
			'id'   => $post->ID,
			'area' => get_post_meta( $post->ID, GUTENBERG_PATTERN_AREA_META_KEY, true ),
		);
	}
	return $parts;
}

/**
 * Renders `core/template-part` blocks as `core/block` instances, so theme
 * files and unconverted content keep working without the template part
 * block: a registered part is referenced by its pattern name, a custom part
 * by its user pattern's id.
 *
 * @param array $parsed_block The parsed block.
 * @return array The parsed block, remapped when it is a template part.
 */
function gutenberg_map_template_part_block_to_pattern( $parsed_block ) {
	if ( 'core/template-part' !== ( $parsed_block['blockName'] ?? '' ) ) {
		return $parsed_block;
	}
	$attrs = $parsed_block['attrs'] ?? array();
	if ( empty( $attrs['slug'] ) ) {
		return $parsed_block;
	}
	// Parts are named after the active stylesheet, parent theme included.
	$theme = ( ! empty( $attrs['theme'] ) && get_template() !== $attrs['theme'] ) ? $attrs['theme'] : get_stylesheet();
	$name  = gutenberg_get_template_part_pattern_name( $theme, $attrs['slug'] );
	unset( $attrs['theme'] );
	$attrs['hasWrapper'] = true;

	$user_part = WP_Block_Patterns_Registry::get_instance()->is_registered( $name ) ? null : gutenberg_get_user_template_part( $attrs['slug'] );
	if ( $user_part ) {
		unset( $attrs['slug'] );
		$attrs['ref'] = $user_part->ID;
		$area         = get_post_meta( $user_part->ID, GUTENBERG_PATTERN_AREA_META_KEY, true );
		if ( $area && empty( $attrs['area'] ) ) {
			$attrs['area'] = $area;
		}
	} else {
		$attrs['slug'] = $name;
	}

	$parsed_block['blockName'] = 'core/block';
	$parsed_block['attrs']     = $attrs;
	return $parsed_block;
}
add_filter( 'render_block_data', 'gutenberg_map_template_part_block_to_pattern' );

/**
 * Lets blocks hooked to `core/template-part` hook to pattern instances that
 * stand in for a template part.
 *
 * @param string[] $hooked_block_types Hooked block types.
 * @param string   $relative_position  Relative position.
 * @param string   $anchor_block_type  Anchor block type.
 * @return string[] Hooked block types.
 */
function gutenberg_map_template_part_hooked_block_types( $hooked_block_types, $relative_position, $anchor_block_type ) {
	if ( 'core/block' !== $anchor_block_type ) {
		return $hooked_block_types;
	}
	$all                = get_hooked_blocks();
	$for_template_parts = $all['core/template-part'][ $relative_position ] ?? array();
	if ( empty( $for_template_parts ) ) {
		return $hooked_block_types;
	}
	return array_values( array_unique( array_merge( $hooked_block_types, $for_template_parts ) ) );
}
add_filter( 'hooked_block_types', 'gutenberg_map_template_part_hooked_block_types', 10, 3 );

/**
 * Drops a block hooked to `core/template-part` when the `core/block` anchor
 * is not a template part instance.
 *
 * @param array|null $parsed_hooked_block  The hooked block, or null.
 * @param string     $hooked_block_type    Hooked block type.
 * @param string     $relative_position    Relative position.
 * @param array      $parsed_anchor_block  The anchor block.
 * @return array|null The hooked block, or null to skip it.
 */
function gutenberg_filter_template_part_hooked_block( $parsed_hooked_block, $hooked_block_type, $relative_position, $parsed_anchor_block ) {
	if ( null === $parsed_hooked_block || 'core/block' !== ( $parsed_anchor_block['blockName'] ?? '' ) ) {
		return $parsed_hooked_block;
	}
	$all                = get_hooked_blocks();
	$for_template_parts = in_array( $hooked_block_type, $all['core/template-part'][ $relative_position ] ?? array(), true );
	$for_patterns       = in_array( $hooked_block_type, $all['core/block'][ $relative_position ] ?? array(), true );
	if ( $for_template_parts && ! $for_patterns && ! gutenberg_is_template_part_pattern_name( $parsed_anchor_block['attrs']['slug'] ?? '' ) ) {
		return null;
	}
	return $parsed_hooked_block;
}
add_filter( 'hooked_block', 'gutenberg_filter_template_part_hooked_block', 10, 4 );

/**
 * Tells the block parser that template parts are patterns here, and what it
 * needs to convert template part blocks to pattern instances: the active
 * theme and its parent (parts are named `<stylesheet>/part/<slug>`), and the
 * custom parts referenced by their user pattern's id.
 *
 * Attached to the `wp-blocks` script itself, so every context loading the
 * parser converts.
 *
 * @param WP_Scripts $scripts The scripts registry.
 */
function gutenberg_enable_template_parts_as_patterns_script( $scripts ) {
	if ( ! $scripts->query( 'wp-blocks', 'registered' ) ) {
		return;
	}
	$data = array(
		'stylesheet'  => get_stylesheet(),
		'template'    => get_template(),
		'customParts' => (object) gutenberg_get_user_template_parts(),
	);
	$scripts->add_inline_script(
		'wp-blocks',
		'window.__wpTemplatePartsAsPatterns = ' . wp_json_encode( $data ) . ';',
		'before'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_enable_template_parts_as_patterns_script', 20 );
