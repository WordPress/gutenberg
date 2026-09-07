<?php
/**
 * Template parts as registered patterns.
 *
 * Theme template part files (and plugin-registered parts) become synced
 * registered patterns named `<theme>/part/<slug>`, existing
 * `wp_template_part` posts become the edited copies of those patterns, and
 * `core/template-part` blocks are rendered as `core/block` instances.
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
	if ( WP_TEMPLATE_PART_AREA_UNCATEGORIZED !== $area ) {
		$properties['categories'] = array( $area );
	}
	return $properties;
}

/**
 * Registers the active theme's template part files, plugin-registered template
 * parts and migrated custom parts as synced patterns.
 *
 * Runs after the theme's own patterns are registered, so a theme cannot be
 * shadowed by its parts and parts get the `Synced`/`Area` treatment last.
 */
function gutenberg_register_template_parts_as_patterns() {
	if ( empty( wp_get_active_and_valid_themes() ) || ! wp_is_block_theme() ) {
		return;
	}
	$registry = WP_Block_Patterns_Registry::get_instance();

	// Theme files, child theme first.
	foreach ( _get_block_templates_files( 'wp_template_part' ) as $file ) {
		$name = gutenberg_get_template_part_pattern_name( $file['theme'], $file['slug'] );
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

	// Custom parts that only ever existed in the database: their migrated copy
	// is the source, registered so instances and the Patterns pages resolve.
	$copies = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
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
		$name = get_post_meta( $copy->ID, 'wp_pattern_slug', true );
		if ( ! gutenberg_is_template_part_pattern_name( $name ) || $registry->is_registered( $name ) ) {
			continue;
		}
		$properties            = gutenberg_get_template_part_pattern_properties(
			$copy->post_title,
			get_post_meta( $copy->ID, GUTENBERG_PATTERN_AREA_META_KEY, true )
		);
		$properties['content'] = $copy->post_content;
		$properties['source']  = 'user';
		register_block_pattern( $name, $properties );
	}
}
add_action( 'init', 'gutenberg_register_template_parts_as_patterns', 12 );

/**
 * Migrates `wp_template_part` posts to `wp_block` copies of their pattern.
 *
 * Each part post becomes a `wp_block` post carrying the `wp_pattern_slug`
 * meta (`<theme>/part/<slug>`) and the part's area, and the original is moved
 * to the trash so the migration can be undone by hand. Runs once.
 */
function gutenberg_migrate_template_parts_to_patterns() {
	if ( get_option( 'gutenberg_template_parts_migrated' ) ) {
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
		$theme_terms = get_the_terms( $part->ID, 'wp_theme' );
		$theme       = ( is_array( $theme_terms ) && ! empty( $theme_terms ) ) ? $theme_terms[0]->name : get_stylesheet();
		$area_terms  = get_the_terms( $part->ID, 'wp_template_part_area' );
		$area        = ( is_array( $area_terms ) && ! empty( $area_terms ) ) ? $area_terms[0]->name : WP_TEMPLATE_PART_AREA_UNCATEGORIZED;

		$copy_id = wp_insert_post(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish' === $part->post_status ? 'publish' : 'draft',
				'post_title'   => $part->post_title,
				'post_content' => $part->post_content,
				'post_excerpt' => $part->post_excerpt,
				'post_author'  => $part->post_author,
				'meta_input'   => array(
					'wp_pattern_slug'               => gutenberg_get_template_part_pattern_name( $theme, $part->post_name ),
					GUTENBERG_PATTERN_AREA_META_KEY => $area,
				),
			),
			true
		);
		if ( is_wp_error( $copy_id ) ) {
			continue;
		}
		wp_trash_post( $part->ID );
	}
	update_option( 'gutenberg_template_parts_migrated', 1 );
}
add_action( 'init', 'gutenberg_migrate_template_parts_to_patterns', 13 );

/**
 * Renders `core/template-part` blocks as `core/block` instances referencing
 * the part's pattern, so theme files and unconverted content keep working
 * without the template part block.
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
	$theme               = ! empty( $attrs['theme'] ) ? $attrs['theme'] : get_stylesheet();
	$attrs['slug']       = gutenberg_get_template_part_pattern_name( $theme, $attrs['slug'] );
	$attrs['hasWrapper'] = true;
	unset( $attrs['theme'] );

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
 * Tells the block parser that template parts are patterns here, and which
 * theme is active, so it can convert template part blocks to pattern
 * instances that reference `<theme>/part/<slug>`.
 */
function gutenberg_enable_template_parts_as_patterns_script() {
	wp_add_inline_script(
		'wp-blocks',
		'window.__wpTemplatePartsAsPatterns = ' . wp_json_encode( array( 'stylesheet' => get_stylesheet() ) ) . ';',
		'before'
	);
}
add_action( 'admin_init', 'gutenberg_enable_template_parts_as_patterns_script' );
add_action( 'site-editor-v2_init', 'gutenberg_enable_template_parts_as_patterns_script' );
