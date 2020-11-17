<?php
/**
 * Temporary compatibility shims for features present in Gutenberg, pending
 * upstream commit to the WordPress core source repository. Functions here
 * exist only as long as necessary for corresponding WordPress support, and
 * each should be associated with a Trac ticket.
 *
 * @package gutenberg
 */

/**
 * These functions can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/50263
 * @see https://core.trac.wordpress.org/changeset/48141
 */
if ( ! function_exists( 'register_block_type_from_metadata' ) ) {
	/**
	 * Removes the block asset's path prefix if provided.
	 *
	 * @since 5.5.0
	 *
	 * @param string $asset_handle_or_path Asset handle or prefixed path.
	 *
	 * @return string Path without the prefix or the original value.
	 */
	function remove_block_asset_path_prefix( $asset_handle_or_path ) {
		$path_prefix = 'file:';
		if ( strpos( $asset_handle_or_path, $path_prefix ) !== 0 ) {
			return $asset_handle_or_path;
		}
		return substr(
			$asset_handle_or_path,
			strlen( $path_prefix )
		);
	}

	/**
	 * Generates the name for an asset based on the name of the block
	 * and the field name provided.
	 *
	 * @since 5.5.0
	 *
	 * @param string $block_name Name of the block.
	 * @param string $field_name Name of the metadata field.
	 *
	 * @return string Generated asset name for the block's field.
	 */
	function generate_block_asset_handle( $block_name, $field_name ) {
		$field_mappings = array(
			'editorScript' => 'editor-script',
			'script'       => 'script',
			'editorStyle'  => 'editor-style',
			'style'        => 'style',
		);
		return str_replace( '/', '-', $block_name ) .
			'-' . $field_mappings[ $field_name ];
	}

	/**
	 * Finds a script handle for the selected block metadata field. It detects
	 * when a path to file was provided and finds a corresponding
	 * asset file with details necessary to register the script under
	 * automatically generated handle name. It returns unprocessed script handle
	 * otherwise.
	 *
	 * @since 5.5.0
	 *
	 * @param array  $metadata Block metadata.
	 * @param string $field_name Field name to pick from metadata.
	 *
	 * @return string|boolean Script handle provided directly or created through
	 *     script's registration, or false on failure.
	 */
	function register_block_script_handle( $metadata, $field_name ) {
		if ( empty( $metadata[ $field_name ] ) ) {
			return false;
		}
		$script_handle = $metadata[ $field_name ];
		$script_path   = remove_block_asset_path_prefix( $metadata[ $field_name ] );
		if ( $script_handle === $script_path ) {
			return $script_handle;
		}

		$script_handle     = generate_block_asset_handle( $metadata['name'], $field_name );
		$script_asset_path = realpath(
			dirname( $metadata['file'] ) . '/' .
			substr_replace( $script_path, '.asset.php', - strlen( '.js' ) )
		);
		if ( ! file_exists( $script_asset_path ) ) {
			$message = sprintf(
				/* translators: %1: field name. %2: block name */
				__( 'The asset file for the "%1$s" defined in "%2$s" block definition is missing.', 'default' ),
				$field_name,
				$metadata['name']
			);
			_doing_it_wrong( __FUNCTION__, $message, '5.5.0' );
			return false;
		}
		$script_asset = require( $script_asset_path );
		$result       = wp_register_script(
			$script_handle,
			plugins_url( $script_path, $metadata['file'] ),
			$script_asset['dependencies'],
			$script_asset['version']
		);
		return $result ? $script_handle : false;
	}

	/**
	 * Finds a style handle for the block metadata field. It detects when a path
	 * to file was provided and registers the style under automatically
	 * generated handle name. It returns unprocessed style handle otherwise.
	 *
	 * @since 5.5.0
	 *
	 * @param array  $metadata Block metadata.
	 * @param string $field_name Field name to pick from metadata.
	 *
	 * @return string|boolean Style handle provided directly or created through
	 *     style's registration, or false on failure.
	 */
	function register_block_style_handle( $metadata, $field_name ) {
		if ( empty( $metadata[ $field_name ] ) ) {
			return false;
		}
		$style_handle = $metadata[ $field_name ];
		$style_path   = remove_block_asset_path_prefix( $metadata[ $field_name ] );
		if ( $style_handle === $style_path ) {
			return $style_handle;
		}

		$style_handle = generate_block_asset_handle( $metadata['name'], $field_name );
		$block_dir    = dirname( $metadata['file'] );
		$result       = wp_register_style(
			$style_handle,
			plugins_url( $style_path, $metadata['file'] ),
			array(),
			filemtime( realpath( "$block_dir/$style_path" ) )
		);
		return $result ? $style_handle : false;
	}

	/**
	 * Registers a block type from metadata stored in the `block.json` file.
	 *
	 * @since 7.9.0
	 *
	 * @param string $file_or_folder Path to the JSON file with metadata definition for
	 *     the block or path to the folder where the `block.json` file is located.
	 * @param array  $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 * @return WP_Block_Type|false The registered block type on success, or false on failure.
	 */
	function register_block_type_from_metadata( $file_or_folder, $args = array() ) {
		$filename      = 'block.json';
		$metadata_file = ( substr( $file_or_folder, -strlen( $filename ) ) !== $filename ) ?
			trailingslashit( $file_or_folder ) . $filename :
			$file_or_folder;
		if ( ! file_exists( $metadata_file ) ) {
			return false;
		}

		$metadata = json_decode( file_get_contents( $metadata_file ), true );
		if ( ! is_array( $metadata ) || empty( $metadata['name'] ) ) {
			return false;
		}
		$metadata['file'] = $metadata_file;

		$settings          = array();
		$property_mappings = array(
			'title'           => 'title',
			'category'        => 'category',
			'parent'          => 'parent',
			'icon'            => 'icon',
			'description'     => 'description',
			'keywords'        => 'keywords',
			'attributes'      => 'attributes',
			'providesContext' => 'provides_context',
			'usesContext'     => 'uses_context',
			// Deprecated: remove with Gutenberg 8.6 release.
			'context'         => 'context',
			'supports'        => 'supports',
			'styles'          => 'styles',
			'example'         => 'example',
		);

		foreach ( $property_mappings as $key => $mapped_key ) {
			if ( isset( $metadata[ $key ] ) ) {
				$settings[ $mapped_key ] = $metadata[ $key ];
			}
		}

		if ( ! empty( $metadata['editorScript'] ) ) {
			$settings['editor_script'] = register_block_script_handle(
				$metadata,
				'editorScript'
			);
		}

		if ( ! empty( $metadata['script'] ) ) {
			$settings['script'] = register_block_script_handle(
				$metadata,
				'script'
			);
		}

		if ( ! empty( $metadata['editorStyle'] ) ) {
			$settings['editor_style'] = register_block_style_handle(
				$metadata,
				'editorStyle'
			);
		}

		if ( ! empty( $metadata['style'] ) ) {
			$settings['style'] = register_block_style_handle(
				$metadata,
				'style'
			);
		}

		return register_block_type(
			$metadata['name'],
			array_merge(
				$settings,
				$args
			)
		);
	}
}

/**
 * Adds a wp.date.setSettings with timezone abbr parameter
 *
 * This can be removed when plugin support requires WordPress 5.6.0+.
 *
 * The script registration occurs in core wp-includes/script-loader.php
 * wp_default_packages_inline_scripts()
 *
 * @since 8.6.0
 *
 * @param WP_Scripts $scripts WP_Scripts object.
 */
function gutenberg_add_date_settings_timezone( $scripts ) {
	if ( ! did_action( 'init' ) ) {
		return;
	}

	global $wp_locale;

	// Calculate the timezone abbr (EDT, PST) if possible.
	$timezone_string = get_option( 'timezone_string', 'UTC' );
	$timezone_abbr   = '';

	if ( ! empty( $timezone_string ) ) {
		$timezone_date = new DateTime( null, new DateTimeZone( $timezone_string ) );
		$timezone_abbr = $timezone_date->format( 'T' );
	}

	$scripts->add_inline_script(
		'wp-date',
		sprintf(
			'wp.date.setSettings( %s );',
			wp_json_encode(
				array(
					'l10n'     => array(
						'locale'        => get_user_locale(),
						'months'        => array_values( $wp_locale->month ),
						'monthsShort'   => array_values( $wp_locale->month_abbrev ),
						'weekdays'      => array_values( $wp_locale->weekday ),
						'weekdaysShort' => array_values( $wp_locale->weekday_abbrev ),
						'meridiem'      => (object) $wp_locale->meridiem,
						'relative'      => array(
							/* translators: %s: Duration. */
							'future' => __( '%s from now', 'default' ),
							/* translators: %s: Duration. */
							'past'   => __( '%s ago', 'default' ),
						),
					),
					'formats'  => array(
						/* translators: Time format, see https://www.php.net/date */
						'time'                => get_option( 'time_format', __( 'g:i a', 'default' ) ),
						/* translators: Date format, see https://www.php.net/date */
						'date'                => get_option( 'date_format', __( 'F j, Y', 'default' ) ),
						/* translators: Date/Time format, see https://www.php.net/date */
						'datetime'            => __( 'F j, Y g:i a', 'default' ),
						/* translators: Abbreviated date/time format, see https://www.php.net/date */
						'datetimeAbbreviated' => __( 'M j, Y g:i a', 'default' ),
					),
					'timezone' => array(
						'offset' => get_option( 'gmt_offset', 0 ),
						'string' => $timezone_string,
						'abbr'   => $timezone_abbr,
					),
				)
			)
		),
		'after'
	);
}
add_action( 'wp_default_scripts', 'gutenberg_add_date_settings_timezone', 20 );

/**
 * Filters default block categories to substitute legacy category names with new
 * block categories.
 *
 * This can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/50278
 * @see https://core.trac.wordpress.org/changeset/48177
 *
 * @param array[] $default_categories Array of block categories.
 *
 * @return array[] Filtered block categories.
 */
function gutenberg_replace_default_block_categories( $default_categories ) {
	$substitution = array(
		'common'     => array(
			'slug'  => 'text',
			'title' => __( 'Text', 'gutenberg' ),
			'icon'  => null,
		),
		'formatting' => array(
			'slug'  => 'media',
			'title' => __( 'Media', 'gutenberg' ),
			'icon'  => null,
		),
		'layout'     => array(
			'slug'  => 'design',
			'title' => __( 'Design', 'gutenberg' ),
			'icon'  => null,
		),
	);

	// Loop default categories to perform in-place substitution by legacy slug.
	foreach ( $default_categories as $i => $default_category ) {
		$slug = $default_category['slug'];
		if ( isset( $substitution[ $slug ] ) ) {
			$default_categories[ $i ] = $substitution[ $slug ];
			unset( $substitution[ $slug ] );
		}
	}

	/*
	 * At this point, `$substitution` should contain only the categories which
	 * could not be in-place substituted with a default category, likely in the
	 * case that core has since been updated to use the default categories.
	 * Check to verify they exist.
	 */
	$default_category_slugs = wp_list_pluck( $default_categories, 'slug' );
	foreach ( $substitution as $i => $substitute_category ) {
		if ( in_array( $substitute_category['slug'], $default_category_slugs, true ) ) {
			unset( $substitution[ $i ] );
		}
	}

	/*
	 * Any substitutes remaining should be appended, as they are not yet
	 * assigned in the default categories array.
	 */
	return array_merge( $default_categories, array_values( $substitution ) );
}
add_filter( 'block_categories', 'gutenberg_replace_default_block_categories' );

/**
 * Shim that hooks into `pre_render_block` so as to override `render_block` with
 * a function that assigns block context.
 *
 * The context handling can be removed when plugin support requires WordPress 5.5.0+.
 *
 * @see https://core.trac.wordpress.org/ticket/49927
 * @see https://core.trac.wordpress.org/changeset/48243
 *
 * @param string|null $pre_render   The pre-rendered content. Defaults to null.
 * @param array       $parsed_block The parsed block being rendered.
 *
 * @return string String of rendered HTML.
 */
function gutenberg_render_block_with_assigned_block_context( $pre_render, $parsed_block ) {
	$already_supports_context = version_compare( get_bloginfo( 'version' ), '5.5', '>=' );

	/*
	 * If a non-null value is provided, a filter has run at an earlier priority
	 * and has already handled custom rendering and should take precedence.
	 */
	if ( null !== $pre_render || $already_supports_context ) {
		return $pre_render;
	}

	$source_block = $parsed_block;

	/** This filter is documented in src/wp-includes/blocks.php */
	$parsed_block = apply_filters( 'render_block_data', $parsed_block, $source_block );

	$context = array();

	/**
	 * Filters the default context provided to a rendered block.
	 *
	 * @param array $context      Default context.
	 * @param array $parsed_block Block being rendered, filtered by `render_block_data`.
	 */
	$context = apply_filters( 'render_block_context', $context, $parsed_block );

	$block = new WP_Block( $parsed_block, $context );

	return $block->render();
}
add_filter( 'pre_render_block', 'gutenberg_render_block_with_assigned_block_context', 9, 2 );

/**
 * Callback hooked to the register_block_type_args filter.
 *
 * This hooks into block registration to inject the default context into the block object.
 * It can be removed once the default context is added into Core.
 *
 * @param array $args Block attributes.
 * @return array Block attributes.
 */
function gutenberg_inject_default_block_context( $args ) {
	if ( is_callable( $args['render_callback'] ) ) {
		$block_render_callback   = $args['render_callback'];
		$args['render_callback'] = function( $attributes, $content, $block = null ) use ( $block_render_callback ) {
			global $post, $wp_query;

			// Check for null for back compatibility with WP_Block_Type->render
			// which is unused since the introduction of WP_Block class.
			//
			// See:
			// - https://core.trac.wordpress.org/ticket/49927
			// - commit 910de8f6890c87f93359c6f2edc6c27b9a3f3292 at wordpress-develop.

			if ( null === $block ) {
				return $block_render_callback( $attributes, $content );
			}

			$registry   = WP_Block_Type_Registry::get_instance();
			$block_type = $registry->get_registered( $block->name );

			// For WordPress versions that don't support the context API.
			if ( ! $block->context ) {
				$block->context = array();
			}

			// Inject the post context if not done by Core.
			$needs_post_id = ! empty( $block_type->uses_context ) && in_array( 'postId', $block_type->uses_context, true );
			if ( $post instanceof WP_Post && $needs_post_id && ! isset( $block->context['postId'] ) && 'wp_template' !== $post->post_type && 'wp_template_part' !== $post->post_type ) {
				$block->context['postId'] = $post->ID;
			}
			$needs_post_type = ! empty( $block_type->uses_context ) && in_array( 'postType', $block_type->uses_context, true );
			if ( $post instanceof WP_Post && $needs_post_type && ! isset( $block->context['postType'] ) && 'wp_template' !== $post->post_type && 'wp_template_part' !== $post->post_type ) {
				/*
				* The `postType` context is largely unnecessary server-side, since the
				* ID is usually sufficient on its own. That being said, since a block's
				* manifest is expected to be shared between the server and the client,
				* it should be included to consistently fulfill the expectation.
				*/
				$block->context['postType'] = $post->post_type;
			}

			// Inject the query context if not done by Core.
			$needs_query = ! empty( $block_type->uses_context ) && in_array( 'query', $block_type->uses_context, true );
			if ( ! isset( $block->context['query'] ) && $needs_query ) {
				if ( isset( $wp_query->tax_query->queried_terms['category'] ) ) {
					$block->context['query'] = array( 'categoryIds' => array() );

					foreach ( $wp_query->tax_query->queried_terms['category']['terms'] as $category_slug_or_id ) {
						$block->context['query']['categoryIds'][] = 'slug' === $wp_query->tax_query->queried_terms['category']['field'] ? get_cat_ID( $category_slug_or_id ) : $category_slug_or_id;
					}
				}

				if ( isset( $wp_query->tax_query->queried_terms['post_tag'] ) ) {
					if ( isset( $block->context['query'] ) ) {
						$block->context['query']['tagIds'] = array();
					} else {
						$block->context['query'] = array( 'tagIds' => array() );
					}

					foreach ( $wp_query->tax_query->queried_terms['post_tag']['terms'] as $tag_slug_or_id ) {
						$tag_ID = $tag_slug_or_id;

						if ( 'slug' === $wp_query->tax_query->queried_terms['post_tag']['field'] ) {
							$tag = get_term_by( 'slug', $tag_slug_or_id, 'post_tag' );

							if ( $tag ) {
								$tag_ID = $tag->term_id;
							}
						}
						$block->context['query']['tagIds'][] = $tag_ID;
					}
				}
			}

			return $block_render_callback( $attributes, $content, $block );
		};
	}
	return $args;
}

add_filter( 'register_block_type_args', 'gutenberg_inject_default_block_context' );

/**
 * Amends the paths to preload when initializing edit post.
 *
 * @see https://core.trac.wordpress.org/ticket/50606
 *
 * @since 8.4.0
 *
 * @param  array $preload_paths Default path list that will be preloaded.
 * @return array Modified path list to preload.
 */
function gutenberg_preload_edit_post( $preload_paths ) {
	$additional_paths = array( '/?context=edit' );
	return array_merge( $preload_paths, $additional_paths );
}

add_filter( 'block_editor_preload_paths', 'gutenberg_preload_edit_post' );

/**
 * Override post type labels for Reusable Block custom post type.
 *
 * This shim can be removed when the Gutenberg plugin requires a WordPress
 * version that has the ticket below.
 *
 * @see https://core.trac.wordpress.org/ticket/50755
 *
 * @since 8.6.0
 *
 * @return array Array of new labels for Reusable Block post type.
 */
function gutenberg_override_reusable_block_post_type_labels() {
	return array(
		'name'                     => _x( 'Reusable Blocks', 'post type general name', 'gutenberg' ),
		'singular_name'            => _x( 'Reusable Block', 'post type singular name', 'gutenberg' ),
		'menu_name'                => _x( 'Reusable Blocks', 'admin menu', 'gutenberg' ),
		'name_admin_bar'           => _x( 'Reusable Block', 'add new on admin bar', 'gutenberg' ),
		'add_new'                  => _x( 'Add New', 'Reusable Block', 'gutenberg' ),
		'add_new_item'             => __( 'Add New Reusable Block', 'gutenberg' ),
		'new_item'                 => __( 'New Reusable Block', 'gutenberg' ),
		'edit_item'                => __( 'Edit Reusable Block', 'gutenberg' ),
		'view_item'                => __( 'View Reusable Block', 'gutenberg' ),
		'all_items'                => __( 'All Reusable Blocks', 'gutenberg' ),
		'search_items'             => __( 'Search Reusable Blocks', 'gutenberg' ),
		'not_found'                => __( 'No reusable blocks found.', 'gutenberg' ),
		'not_found_in_trash'       => __( 'No reusable blocks found in Trash.', 'gutenberg' ),
		'filter_items_list'        => __( 'Filter reusable blocks list', 'gutenberg' ),
		'items_list_navigation'    => __( 'Reusable Blocks list navigation', 'gutenberg' ),
		'items_list'               => __( 'Reusable Blocks list', 'gutenberg' ),
		'item_published'           => __( 'Reusable Block published.', 'gutenberg' ),
		'item_published_privately' => __( 'Reusable Block published privately.', 'gutenberg' ),
		'item_reverted_to_draft'   => __( 'Reusable Block reverted to draft.', 'gutenberg' ),
		'item_scheduled'           => __( 'Reusable Block scheduled.', 'gutenberg' ),
		'item_updated'             => __( 'Reusable Block updated.', 'gutenberg' ),
	);
}
add_filter( 'post_type_labels_wp_block', 'gutenberg_override_reusable_block_post_type_labels', 10, 0 );
