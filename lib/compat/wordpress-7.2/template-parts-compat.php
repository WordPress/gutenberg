<?php
/**
 * Backward compatibility for the PHP template part APIs now that template
 * parts are registered patterns.
 *
 * `get_block_templates()`, `get_block_template()` and `block_template_part()`
 * answer from the part patterns and their customizations, the
 * `/wp/v2/template-parts` route reads and writes those customizations, the
 * theme export ships parts as pattern files, `wp_template_part` posts can no
 * longer be created, and any that still appear are migrated on save.
 *
 * @package gutenberg
 */

/**
 * Returns the customization of a registered pattern: the published
 * `wp_block` post carrying the pattern name in its `wp_pattern_slug` meta.
 *
 * @param string $pattern_name Registered pattern name.
 * @return WP_Post|null The customization, or null when the pattern is not customized.
 */
function gutenberg_get_pattern_customization_post( $pattern_name ) {
	$copies = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'no_found_rows'  => true,
			'meta_key'       => 'wp_pattern_slug', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'     => $pattern_name, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		)
	);
	return $copies ? $copies[0] : null;
}

/**
 * Returns the customization of a template part.
 *
 * @param string $theme Theme stylesheet.
 * @param string $slug  Template part slug.
 * @return WP_Post|null The customization, or null.
 */
function gutenberg_get_template_part_customization( $theme, $slug ) {
	return gutenberg_get_pattern_customization_post( gutenberg_get_template_part_pattern_name( $theme, $slug ) );
}

/**
 * Returns the customizations of every template part of a theme, keyed by
 * part slug.
 *
 * @param string $theme Theme stylesheet.
 * @return WP_Post[] Customizations keyed by slug.
 */
function gutenberg_get_template_part_customizations( $theme ) {
	$prefix  = gutenberg_get_template_part_pattern_name( $theme, '' );
	$copies  = get_posts(
		array(
			'post_type'      => 'wp_block',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
				array(
					'key'     => 'wp_pattern_slug',
					'value'   => $prefix,
					'compare' => 'LIKE',
				),
			),
		)
	);
	$by_slug = array();
	foreach ( $copies as $copy ) {
		$name = get_post_meta( $copy->ID, 'wp_pattern_slug', true );
		if ( ! is_string( $name ) || ! str_starts_with( $name, $prefix ) ) {
			continue;
		}
		$by_slug[ substr( $name, strlen( $prefix ) ) ] = $copy;
	}
	return $by_slug;
}

/**
 * Builds the template part object of a customization, the way a customized
 * `wp_template_part` post used to be built.
 *
 * @param WP_Post $copy  The customization.
 * @param string  $theme Theme stylesheet.
 * @param string  $slug  Template part slug.
 * @return WP_Block_Template The template part.
 */
function gutenberg_build_template_part_from_customization( $copy, $theme, $slug ) {
	$file           = _get_block_template_file( 'wp_template_part', $slug );
	$has_theme_file = get_stylesheet() === $theme && null !== $file;
	$pattern        = WP_Block_Patterns_Registry::get_instance()->get_registered( gutenberg_get_template_part_pattern_name( $theme, $slug ) );
	$area           = get_post_meta( $copy->ID, GUTENBERG_PATTERN_AREA_META_KEY, true );
	if ( ! $area && $pattern ) {
		$area = $pattern['area'] ?? '';
	}
	$origin = null;
	if ( $has_theme_file ) {
		$origin = 'theme';
	} elseif ( $pattern && 'plugin' === ( $pattern['source'] ?? '' ) ) {
		$origin = 'plugin';
	}
	$content = $copy->post_content;
	if ( function_exists( 'apply_block_hooks_to_content_from_post_object' ) ) {
		$content = apply_block_hooks_to_content_from_post_object( $content, $copy );
	}

	$template                 = new WP_Block_Template();
	$template->wp_id          = $copy->ID;
	$template->id             = $theme . '//' . $slug;
	$template->theme          = $theme;
	$template->slug           = $slug;
	$template->type           = 'wp_template_part';
	$template->content        = $content;
	$template->source         = 'custom';
	$template->origin         = $origin;
	$template->title          = $copy->post_title;
	$template->description    = $copy->post_excerpt;
	$template->status         = $copy->post_status;
	$template->has_theme_file = $has_theme_file;
	$template->is_custom      = true;
	$template->author         = $copy->post_author;
	$template->modified       = $copy->post_modified;
	$template->date           = $copy->post_date;
	$template->area           = $area ? _filter_block_template_part_area( $area ) : WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
	return $template;
}

/**
 * Builds the template part object of a custom part: a user pattern with an
 * area, referenced by its slug.
 *
 * @param WP_Post $post  The user pattern.
 * @param string  $theme Theme stylesheet.
 * @return WP_Block_Template The template part.
 */
function gutenberg_build_template_part_from_user_pattern( $post, $theme ) {
	$content = $post->post_content;
	if ( function_exists( 'apply_block_hooks_to_content_from_post_object' ) ) {
		$content = apply_block_hooks_to_content_from_post_object( $content, $post );
	}
	$area = get_post_meta( $post->ID, GUTENBERG_PATTERN_AREA_META_KEY, true );

	$template                 = new WP_Block_Template();
	$template->wp_id          = $post->ID;
	$template->id             = $theme . '//' . $post->post_name;
	$template->theme          = $theme;
	$template->slug           = $post->post_name;
	$template->type           = 'wp_template_part';
	$template->content        = $content;
	$template->source         = 'custom';
	$template->origin         = null;
	$template->title          = $post->post_title;
	$template->description    = $post->post_excerpt;
	$template->status         = $post->post_status;
	$template->has_theme_file = false;
	$template->is_custom      = true;
	$template->author         = $post->post_author;
	$template->modified       = $post->post_modified;
	$template->date           = $post->post_date;
	$template->area           = $area ? _filter_block_template_part_area( $area ) : WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
	return $template;
}

/**
 * Builds the template part object of a registered part pattern that has no
 * customization: a plugin-registered part, or a custom part registered from
 * its migrated copy.
 *
 * @param array  $pattern Registered pattern properties.
 * @param string $theme   Theme stylesheet.
 * @param string $slug    Template part slug.
 * @return WP_Block_Template The template part.
 */
function gutenberg_build_template_part_from_pattern( $pattern, $theme, $slug ) {
	$file           = _get_block_template_file( 'wp_template_part', $slug );
	$has_theme_file = get_stylesheet() === $theme && null !== $file;
	$source         = $pattern['source'] ?? 'theme';

	$template                 = new WP_Block_Template();
	$template->id             = $theme . '//' . $slug;
	$template->theme          = $theme;
	$template->slug           = $slug;
	$template->type           = 'wp_template_part';
	$template->content        = $pattern['content'] ?? '';
	$template->source         = 'plugin' === $source ? 'plugin' : 'theme';
	$template->origin         = null;
	$template->title          = $pattern['title'] ?? $slug;
	$template->description    = $pattern['description'] ?? '';
	$template->status         = 'publish';
	$template->has_theme_file = $has_theme_file;
	$template->is_custom      = false;
	$template->area           = ! empty( $pattern['area'] ) ? _filter_block_template_part_area( $pattern['area'] ) : WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
	return $template;
}

/**
 * Answers `get_block_templates()` queries for template parts with the parts'
 * customizations: a customized part takes its content from the
 * customization, and parts that only exist as customizations are listed.
 *
 * @param WP_Block_Template[] $templates     The query result.
 * @param array               $query         The query.
 * @param string              $template_type Template type.
 * @return WP_Block_Template[] The query result.
 */
function gutenberg_filter_template_parts_with_customizations( $templates, $query, $template_type ) {
	if ( 'wp_template_part' !== $template_type ) {
		return $templates;
	}
	$theme  = get_stylesheet();
	$prefix = gutenberg_get_template_part_pattern_name( $theme, '' );

	if ( isset( $query['wp_id'] ) ) {
		$copy = get_post( $query['wp_id'] );
		if ( $copy && 'wp_block' === $copy->post_type ) {
			$name = get_post_meta( $copy->ID, 'wp_pattern_slug', true );
			if ( is_string( $name ) && str_starts_with( $name, $prefix ) ) {
				return array( gutenberg_build_template_part_from_customization( $copy, $theme, substr( $name, strlen( $prefix ) ) ) );
			}
			if ( ! $name && get_post_meta( $copy->ID, GUTENBERG_PATTERN_AREA_META_KEY, true ) ) {
				return array( gutenberg_build_template_part_from_user_pattern( $copy, $theme ) );
			}
		}
		return $templates;
	}

	$customizations = gutenberg_get_template_part_customizations( $theme );

	$seen = array();
	foreach ( $templates as $i => $template ) {
		$seen[ $template->slug ] = true;
		if ( $template->theme === $theme && isset( $customizations[ $template->slug ] ) ) {
			$templates[ $i ] = gutenberg_build_template_part_from_customization( $customizations[ $template->slug ], $theme, $template->slug );
		}
	}
	foreach ( $customizations as $slug => $copy ) {
		if ( isset( $seen[ $slug ] ) ) {
			continue;
		}
		if ( ! empty( $query['slug__in'] ) && ! in_array( $slug, $query['slug__in'], true ) ) {
			continue;
		}
		$templates[]   = gutenberg_build_template_part_from_customization( $copy, $theme, $slug );
		$seen[ $slug ] = true;
	}
	// Registered part patterns without a theme file: plugin-registered parts
	// and custom parts registered from their copy.
	foreach ( WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $pattern ) {
		if ( ! str_starts_with( $pattern['name'], $prefix ) ) {
			continue;
		}
		$slug = substr( $pattern['name'], strlen( $prefix ) );
		if ( isset( $seen[ $slug ] ) ) {
			continue;
		}
		if ( ! empty( $query['slug__in'] ) && ! in_array( $slug, $query['slug__in'], true ) ) {
			continue;
		}
		$templates[]   = gutenberg_build_template_part_from_pattern( $pattern, $theme, $slug );
		$seen[ $slug ] = true;
	}
	// Custom parts: user patterns with an area.
	foreach ( gutenberg_get_user_template_parts() as $slug => $part ) {
		if ( isset( $seen[ $slug ] ) ) {
			continue;
		}
		if ( ! empty( $query['slug__in'] ) && ! in_array( $slug, $query['slug__in'], true ) ) {
			continue;
		}
		$post = get_post( $part['id'] );
		if ( $post ) {
			$templates[]   = gutenberg_build_template_part_from_user_pattern( $post, $theme );
			$seen[ $slug ] = true;
		}
	}
	if ( isset( $query['area'] ) ) {
		$templates = array_values(
			array_filter(
				$templates,
				static function ( $template ) use ( $query ) {
					return $template->area === $query['area'];
				}
			)
		);
	}
	return $templates;
}
add_filter( 'get_block_templates', 'gutenberg_filter_template_parts_with_customizations', 10, 3 );

/**
 * Answers `get_block_template()` for a template part: its customization when
 * there is one, else the theme file or plugin registration, else the user
 * pattern of a custom part. Runs before the lookup of `wp_template_part`
 * posts, which are trashed by the migration.
 *
 * @param WP_Block_Template|null $template      The template, if already resolved.
 * @param string                 $id            Template id (`theme//slug`).
 * @param string                 $template_type Template type.
 * @return WP_Block_Template|null The template part, or null to let the lookup continue.
 */
function gutenberg_resolve_template_part_from_pattern( $template, $id, $template_type ) {
	if ( null !== $template || 'wp_template_part' !== $template_type ) {
		return $template;
	}
	$parts = explode( '//', $id, 2 );
	if ( 2 !== count( $parts ) ) {
		return $template;
	}
	list( $theme, $slug ) = $parts;
	$copy                 = gutenberg_get_template_part_customization( $theme, $slug );
	if ( $copy ) {
		return gutenberg_build_template_part_from_customization( $copy, $theme, $slug );
	}
	$template = get_block_file_template( $id, $template_type );
	if ( $template ) {
		return $template;
	}
	$pattern = WP_Block_Patterns_Registry::get_instance()->get_registered( gutenberg_get_template_part_pattern_name( $theme, $slug ) );
	if ( $pattern ) {
		return gutenberg_build_template_part_from_pattern( $pattern, $theme, $slug );
	}
	$user_part = get_stylesheet() === $theme ? gutenberg_get_user_template_part( $slug ) : null;
	return $user_part ? gutenberg_build_template_part_from_user_pattern( $user_part, $theme ) : null;
}
add_filter( 'pre_get_block_template', 'gutenberg_resolve_template_part_from_pattern', 10, 3 );

/**
 * Returns a slug that no template part of the theme uses yet.
 *
 * @param string $theme Theme stylesheet.
 * @param string $slug  Wanted slug.
 * @return string The slug, suffixed when taken.
 */
function gutenberg_get_unique_template_part_slug( $theme, $slug ) {
	$registry  = WP_Block_Patterns_Registry::get_instance();
	$candidate = $slug;
	$suffix    = 2;
	while (
		$registry->is_registered( gutenberg_get_template_part_pattern_name( $theme, $candidate ) ) ||
		gutenberg_get_template_part_customization( $theme, $candidate ) ||
		gutenberg_get_user_template_part( $candidate ) ||
		( get_stylesheet() === $theme && null !== _get_block_template_file( 'wp_template_part', $candidate ) )
	) {
		$candidate = $slug . '-' . $suffix;
		++$suffix;
	}
	return $candidate;
}

/**
 * Writes a template part: its customization when it has a registered
 * original (created on the first write, from the registered version, like a
 * template part's first save copied its theme file), else the user pattern
 * of the custom part (created when there is none).
 *
 * @param string $theme  Theme stylesheet.
 * @param string $slug   Template part slug.
 * @param array  $fields Fields to write: `title`, `content`, `description`, `area`, `author`, `status`.
 * @return int|WP_Error The `wp_block` post id, or an error.
 */
function gutenberg_save_template_part( $theme, $slug, $fields ) {
	$post = gutenberg_get_template_part_customization( $theme, $slug );
	if ( ! $post && get_stylesheet() === $theme ) {
		$post = gutenberg_get_user_template_part( $slug );
	}
	$postarr          = array(
		'post_type'   => 'wp_block',
		'post_status' => 'publish',
	);
	$is_new_user_part = false;
	if ( $post ) {
		$postarr['ID'] = $post->ID;
	} else {
		$template = get_block_template( $theme . '//' . $slug, 'wp_template_part' );
		if ( $template ) {
			// A first edit starts from the registered version.
			$postarr['post_title']   = $template->title;
			$postarr['post_content'] = $template->content;
			$postarr['post_excerpt'] = $template->description;
			$postarr['meta_input']   = array(
				'wp_pattern_slug'               => gutenberg_get_template_part_pattern_name( $theme, $slug ),
				GUTENBERG_PATTERN_AREA_META_KEY => $template->area ? $template->area : WP_TEMPLATE_PART_AREA_UNCATEGORIZED,
			);
		} else {
			// A new custom part is a user pattern with an area.
			$is_new_user_part        = true;
			$postarr['post_name']    = $slug;
			$postarr['post_title']   = $slug;
			$postarr['post_content'] = '';
			$postarr['meta_input']   = array(
				GUTENBERG_PATTERN_AREA_META_KEY => WP_TEMPLATE_PART_AREA_UNCATEGORIZED,
			);
		}
	}
	if ( isset( $fields['title'] ) ) {
		$postarr['post_title'] = $fields['title'];
	}
	if ( isset( $fields['content'] ) ) {
		$postarr['post_content'] = $fields['content'];
	}
	if ( isset( $fields['description'] ) ) {
		$postarr['post_excerpt'] = $fields['description'];
	}
	if ( isset( $fields['author'] ) ) {
		$postarr['post_author'] = $fields['author'];
	}
	if ( isset( $fields['status'] ) ) {
		$postarr['post_status'] = $fields['status'];
	}
	if ( isset( $fields['area'] ) ) {
		$postarr['meta_input'][ GUTENBERG_PATTERN_AREA_META_KEY ] = _filter_block_template_part_area( $fields['area'] );
	}
	$result = $post ? wp_update_post( wp_slash( $postarr ), true ) : wp_insert_post( wp_slash( $postarr ), true );
	if ( is_wp_error( $result ) ) {
		return $result;
	}
	if ( ( $is_new_user_part || isset( $fields['area'] ) ) && ! get_post_meta( $result, 'wp_pattern_slug', true ) ) {
		// A user part is filed under its area.
		gutenberg_assign_template_part_area_category( $result, get_post_meta( $result, GUTENBERG_PATTERN_AREA_META_KEY, true ) );
	}
	return $result;
}

/**
 * Serves the template parts REST route with the controller that reads and
 * writes pattern customizations, and closes the `wp_template_part` post type
 * to new posts: parts live in `wp_block` now.
 *
 * @param array $args Post type arguments.
 * @return array Post type arguments.
 */
function gutenberg_close_template_part_post_type( $args ) {
	$args['rest_controller_class'] = 'Gutenberg_REST_Template_Parts_Controller_7_2';
	$args['capabilities']          = array_merge(
		$args['capabilities'] ?? array(),
		array(
			'create_posts'           => 'do_not_allow',
			'edit_posts'             => 'do_not_allow',
			'edit_others_posts'      => 'do_not_allow',
			'edit_published_posts'   => 'do_not_allow',
			'publish_posts'          => 'do_not_allow',
			'delete_posts'           => 'do_not_allow',
			'delete_others_posts'    => 'do_not_allow',
			'delete_published_posts' => 'do_not_allow',
		)
	);
	return $args;
}
add_filter( 'register_wp_template_part_post_type_args', 'gutenberg_close_template_part_post_type', 20 );

/**
 * Migrates a `wp_template_part` post that appears after the migration ran,
 * for instance inserted by a plugin, as soon as it is saved with its theme.
 *
 * @param int     $post_id Post id.
 * @param WP_Post $post    The post.
 */
function gutenberg_migrate_template_part_on_save( $post_id, $post ) {
	if (
		wp_is_post_revision( $post_id ) ||
		wp_is_post_autosave( $post_id ) ||
		in_array( $post->post_status, array( 'auto-draft', 'trash', 'inherit' ), true )
	) {
		return;
	}
	$theme_terms = get_the_terms( $post_id, 'wp_theme' );
	if ( ! is_array( $theme_terms ) || empty( $theme_terms ) ) {
		// Not a usable template part yet; the bulk migration picks it up.
		return;
	}
	gutenberg_migrate_template_part_post( $post );
}
add_action( 'save_post_wp_template_part', 'gutenberg_migrate_template_part_on_save', 100, 2 );

/**
 * Redirects legacy site editor URLs of template parts to the part's
 * customization in the pattern editor, or to the Patterns page.
 */
function gutenberg_redirect_template_part_site_editor_urls() {
	// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only URL inspection.
	$path = isset( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '';
	if ( isset( $_GET['postType'] ) && 'wp_template_part' === $_GET['postType'] ) {
		$path = '/wp_template_part/' . ( isset( $_GET['postId'] ) ? sanitize_text_field( wp_unslash( $_GET['postId'] ) ) : '' );
	}
	// phpcs:enable WordPress.Security.NonceVerification.Recommended
	if ( ! str_starts_with( $path, '/wp_template_part' ) ) {
		return;
	}
	$id    = trim( substr( $path, strlen( '/wp_template_part' ) ), '/' );
	$parts = explode( '//', $id, 2 );
	$url   = admin_url( 'site-editor.php?p=%2Fpattern' );
	if ( 2 === count( $parts ) ) {
		$copy = gutenberg_get_template_part_customization( $parts[0], $parts[1] );
		if ( $copy ) {
			$url = admin_url( 'site-editor.php?p=%2Fwp_block%2F' . $copy->ID . '&canvas=edit' );
		}
	}
	wp_safe_redirect( $url );
	exit;
}
add_action( 'load-site-editor.php', 'gutenberg_redirect_template_part_site_editor_urls' );

/**
 * Builds the contents of a theme pattern file (`patterns/*.php`) from a
 * registered pattern and its content.
 *
 * @param array  $pattern Registered pattern properties.
 * @param string $content Block markup.
 * @return string The file contents.
 */
function gutenberg_build_pattern_file_contents( $pattern, $content ) {
	$headers = array(
		'Title' => $pattern['title'] ?? '',
		'Slug'  => $pattern['name'],
	);
	if ( ! empty( $pattern['description'] ) ) {
		$headers['Description'] = $pattern['description'];
	}
	if ( ! empty( $pattern['synced'] ) ) {
		$headers['Synced'] = 'yes';
	}
	if ( ! empty( $pattern['area'] ) ) {
		$headers['Area'] = $pattern['area'];
	}
	$lists = array(
		'Categories'     => 'categories',
		'Keywords'       => 'keywords',
		'Block Types'    => 'blockTypes',
		'Post Types'     => 'postTypes',
		'Template Types' => 'templateTypes',
	);
	foreach ( $lists as $header => $property ) {
		if ( ! empty( $pattern[ $property ] ) ) {
			$headers[ $header ] = implode( ', ', (array) $pattern[ $property ] );
		}
	}
	if ( isset( $pattern['inserter'] ) && ! $pattern['inserter'] ) {
		$headers['Inserter'] = 'no';
	}
	if ( ! empty( $pattern['viewportWidth'] ) ) {
		$headers['Viewport Width'] = (string) $pattern['viewportWidth'];
	}

	$file = "<?php\n/**\n";
	foreach ( $headers as $header => $value ) {
		$file .= ' * ' . $header . ': ' . preg_replace( '/\s+/', ' ', trim( (string) $value ) ) . "\n";
	}
	$file .= " */\n?>\n";
	// Block markup is static; keep a literal `<?` from being read as PHP.
	$file .= str_replace( '<?', "<?php echo '<?'; ?>", $content );
	return rtrim( $file ) . "\n";
}

/**
 * Rewrites, for a theme export, a Pattern block referencing a custom part by
 * its user pattern's id to reference it by the part's pattern name, which the
 * exported pattern file registers.
 *
 * @param array $block The parsed block, passed by reference.
 * @return string Nothing to prepend.
 */
function gutenberg_export_reference_custom_parts_by_slug( &$block ) {
	static $by_id = null;
	if ( null === $by_id ) {
		$by_id = array();
		foreach ( gutenberg_get_user_template_parts() as $slug => $part ) {
			$by_id[ $part['id'] ] = gutenberg_get_template_part_pattern_name( get_stylesheet(), $slug );
		}
	}
	if ( 'core/block' === ( $block['blockName'] ?? '' ) && isset( $block['attrs']['ref'], $by_id[ $block['attrs']['ref'] ] ) ) {
		$block['attrs']['slug'] = $by_id[ $block['attrs']['ref'] ];
		unset( $block['attrs']['ref'] );
	}
	return '';
}

/**
 * Returns the pattern files a theme export ships in place of the `parts/`
 * folder: every template part of the active theme as a pattern file (custom
 * parts included), and every theme pattern that has a customization, with
 * the customized content.
 *
 * @return string[] File contents keyed by theme-relative path.
 */
function gutenberg_get_exported_pattern_files() {
	$theme      = get_stylesheet();
	$theme_path = wp_normalize_path( get_stylesheet_directory() ) . '/';
	$prefix     = gutenberg_get_template_part_pattern_name( $theme, '' );
	$files      = array();

	foreach ( WP_Block_Patterns_Registry::get_instance()->get_all_registered() as $pattern ) {
		$name          = $pattern['name'];
		$is_part       = str_starts_with( $name, $prefix );
		$file_path     = ! empty( $pattern['filePath'] ) ? wp_normalize_path( $pattern['filePath'] ) : '';
		$relative_path = $file_path && str_starts_with( $file_path, $theme_path ) ? substr( $file_path, strlen( $theme_path ) ) : '';
		if ( ! $is_part && ! $relative_path ) {
			continue;
		}
		$customization = gutenberg_get_pattern_customization_post( $name );
		if ( ! $is_part && ! $customization ) {
			// An uncustomized theme pattern ships as its own file.
			continue;
		}
		if ( ! $relative_path || ! str_ends_with( $relative_path, '.php' ) ) {
			$relative_path = 'patterns/part-' . substr( $name, strlen( $prefix ) ) . '.php';
		}
		$content = $customization ? $customization->post_content : $pattern['content'];
		if ( $customization ) {
			$pattern['title'] = $customization->post_title;
			$area             = get_post_meta( $customization->ID, GUTENBERG_PATTERN_AREA_META_KEY, true );
			if ( $area ) {
				$pattern['area'] = $area;
			}
		}
		$files[ $relative_path ] = gutenberg_build_pattern_file_contents( $pattern, $content );
	}

	// Custom parts: user patterns with an area become theme parts.
	foreach ( gutenberg_get_user_template_parts() as $slug => $part ) {
		$post = get_post( $part['id'] );
		if ( ! $post ) {
			continue;
		}
		$pattern                                    = gutenberg_get_template_part_pattern_properties( $post->post_title, $part['area'] );
		$pattern['name']                            = gutenberg_get_template_part_pattern_name( $theme, $slug );
		$files[ 'patterns/part-' . $slug . '.php' ] = gutenberg_build_pattern_file_contents( $pattern, $post->post_content );
	}
	return $files;
}
