<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 5.9.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

// Define constants for supported wp_template_part_area taxonomy.
if ( ! defined( 'WP_TEMPLATE_PART_AREA_HEADER' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_HEADER', 'header' );
}
if ( ! defined( 'WP_TEMPLATE_PART_AREA_FOOTER' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_FOOTER', 'footer' );
}
if ( ! defined( 'WP_TEMPLATE_PART_AREA_SIDEBAR' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_SIDEBAR', 'sidebar' );
}
if ( ! defined( 'WP_TEMPLATE_PART_AREA_UNCATEGORIZED' ) ) {
	define( 'WP_TEMPLATE_PART_AREA_UNCATEGORIZED', 'uncategorized' );
}

if ( ! function_exists( 'get_block_theme_folders' ) ) {
	/**
	 * For backward compatibility reasons,
	 * block themes might be using block-templates or block-template-parts,
	 * this function ensures we fallback to these folders properly.
	 *
	 * @param string $theme_stylesheet The stylesheet. Default is to leverage the main theme root.
	 *
	 * @return array Folder names used by block themes.
	 */
	function get_block_theme_folders( $theme_stylesheet = null ) {
		$theme_name = null === $theme_stylesheet ? get_stylesheet() : $theme_stylesheet;
		$root_dir   = get_theme_root( $theme_name );
		$theme_dir  = "$root_dir/$theme_name";

		if ( file_exists( $theme_dir . '/block-templates' ) || file_exists( $theme_dir . '/block-template-parts' ) ) {
			return array(
				'wp_template'      => 'block-templates',
				'wp_template_part' => 'block-template-parts',
			);
		}

		return array(
			'wp_template'      => 'templates',
			'wp_template_part' => 'parts',
		);
	}
}

if ( ! function_exists( 'get_allowed_block_template_part_areas' ) ) {
	/**
	 * Returns a filtered list of allowed area values for template parts.
	 *
	 * @return array The supported template part area values.
	 */
	function get_allowed_block_template_part_areas() {
		$default_area_definitions = array(
			array(
				'area'        => WP_TEMPLATE_PART_AREA_UNCATEGORIZED,
				'label'       => __( 'General', 'gutenberg' ),
				'description' => __(
					'General templates often perform a specific role like displaying post content, and are not tied to any particular area.',
					'gutenberg'
				),
				'icon'        => 'layout',
				'area_tag'    => 'div',
			),
			array(
				'area'        => WP_TEMPLATE_PART_AREA_HEADER,
				'label'       => __( 'Header', 'gutenberg' ),
				'description' => __(
					'The Header template defines a page area that typically contains a title, logo, and main navigation.',
					'gutenberg'
				),
				'icon'        => 'header',
				'area_tag'    => 'header',
			),
			array(
				'area'        => WP_TEMPLATE_PART_AREA_FOOTER,
				'label'       => __( 'Footer', 'gutenberg' ),
				'description' => __(
					'The Footer template defines a page area that typically contains site credits, social links, or any other combination of blocks.',
					'gutenberg'
				),
				'icon'        => 'footer',
				'area_tag'    => 'footer',
			),
		);

		/**
		 * Filters the list of allowed template part area values.
		 *
		 * @param array $default_areas An array of supported area objects.
		 */
		return apply_filters( 'default_wp_template_part_areas', $default_area_definitions );
	}
}

if ( ! function_exists( 'get_default_block_template_types' ) ) {
	/**
	 * Returns a filtered list of default template types, containing their
	 * localized titles and descriptions.
	 *
	 * @return array The default template types.
	 */
	function get_default_block_template_types() {
		$default_template_types = array(
			'index'          => array(
				'title'       => _x( 'Index', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays posts.', 'gutenberg' ),
			),
			'home'           => array(
				'title'       => _x( 'Home', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays posts on the homepage, or on the Posts page if a static homepage is set.', 'gutenberg' ),
			),
			'front-page'     => array(
				'title'       => _x( 'Front Page', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays the homepage.', 'gutenberg' ),
			),
			'singular'       => array(
				'title'       => _x( 'Singular', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays a single post or page.', 'gutenberg' ),
			),
			'single'         => array(
				'title'       => _x( 'Single Post', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays a single post.', 'gutenberg' ),
			),
			'page'           => array(
				'title'       => _x( 'Page', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays a single page.', 'gutenberg' ),
			),
			'archive'        => array(
				'title'       => _x( 'Archive', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays post categories, tags, and other archives.', 'gutenberg' ),
			),
			'author'         => array(
				'title'       => _x( 'Author', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays latest posts written by a single author.', 'gutenberg' ),
			),
			'category'       => array(
				'title'       => _x( 'Category', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays latest posts in single post category.', 'gutenberg' ),
			),
			'taxonomy'       => array(
				'title'       => _x( 'Taxonomy', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays latest posts from a single post taxonomy.', 'gutenberg' ),
			),
			'date'           => array(
				'title'       => _x( 'Date', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays posts from a specific date.', 'gutenberg' ),
			),
			'tag'            => array(
				'title'       => _x( 'Tag', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays latest posts with a single post tag.', 'gutenberg' ),
			),
			'attachment'     => array(
				'title'       => __( 'Media', 'gutenberg' ),
				'description' => __( 'Displays individual media items or attachments.', 'gutenberg' ),
			),
			'search'         => array(
				'title'       => _x( 'Search', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays search results.', 'gutenberg' ),
			),
			'privacy-policy' => array(
				'title'       => __( 'Privacy Policy', 'gutenberg' ),
				'description' => __( 'Displays the privacy policy page.', 'gutenberg' ),
			),
			'404'            => array(
				'title'       => _x( '404', 'Template name', 'gutenberg' ),
				'description' => __( 'Displays when no content is found.', 'gutenberg' ),
			),
		);

		/**
		 * Filters the list of template types.
		 *
		 * @param array $default_template_types An array of template types, formatted as [ slug => [ title, description ] ].
		 *
		 * @since 5.x.x
		 */
		return apply_filters( 'default_template_types', $default_template_types );
	}
}

if ( ! function_exists( '_filter_block_template_part_area' ) ) {
	/**
	 * Checks whether the input 'area' is a supported value.
	 * Returns the input if supported, otherwise returns the 'uncategorized' value.
	 *
	 * @param string $type Template part area name.
	 *
	 * @return string Input if supported, else the uncategorized value.
	 */
	function _filter_block_template_part_area( $type ) {
		$allowed_areas = array_map(
			static function ( $item ) {
				return $item['area'];
			},
			get_allowed_block_template_part_areas()
		);
		if ( in_array( $type, $allowed_areas, true ) ) {
			return $type;
		}

		/* translators: %1$s: Template area type, %2$s: the uncategorized template area value. */
		$warning_message = sprintf( __( '"%1$s" is not a supported wp_template_part area value and has been added as "%2$s".', 'gutenberg' ), $type, WP_TEMPLATE_PART_AREA_UNCATEGORIZED );
		trigger_error( $warning_message, E_USER_NOTICE );
		return WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
	}
}

if ( ! function_exists( '_get_block_templates_paths' ) ) {
	/**
	 * Finds all nested template part file paths in a theme's directory.
	 *
	 * @access private
	 *
	 * @param string $base_directory The theme's file path.
	 * @return array $path_list A list of paths to all template part files.
	 */
	function _get_block_templates_paths( $base_directory ) {
		$path_list = array();
		if ( file_exists( $base_directory ) ) {
			$nested_files      = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base_directory ) );
			$nested_html_files = new RegexIterator( $nested_files, '/^.+\.html$/i', RecursiveRegexIterator::GET_MATCH );
			foreach ( $nested_html_files as $path => $file ) {
				$path_list[] = $path;
			}
		}
		return $path_list;
	}
}

if ( ! function_exists( '_get_block_template_file' ) ) {
	/**
	 * Retrieves the template file from the theme for a given slug.
	 *
	 * @access private
	 * @internal
	 *
	 * @param string $template_type wp_template or wp_template_part.
	 * @param string $slug template slug.
	 *
	 * @return array|null Template.
	 */
	function _get_block_template_file( $template_type, $slug ) {
		if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
			return null;
		}

		$themes = array(
			get_stylesheet() => get_stylesheet_directory(),
			get_template()   => get_template_directory(),
		);
		foreach ( $themes as $theme_slug => $theme_dir ) {
			$template_base_paths = get_block_theme_folders( $theme_slug );
			$file_path           = $theme_dir . '/' . $template_base_paths[ $template_type ] . '/' . $slug . '.html';
			if ( file_exists( $file_path ) ) {
				$new_template_item = array(
					'slug'  => $slug,
					'path'  => $file_path,
					'theme' => $theme_slug,
					'type'  => $template_type,
				);

				if ( 'wp_template_part' === $template_type ) {
					return _add_block_template_part_area_info( $new_template_item );
				}

				if ( 'wp_template' === $template_type ) {
					return _add_block_template_info( $new_template_item );
				}

				return $new_template_item;
			}
		}

		return null;
	}
}

if ( ! function_exists( '_get_block_templates_files' ) ) {
	/**
	 * Retrieves the template files from  the theme.
	 *
	 * @access private
	 * @internal
	 *
	 * @param string $template_type wp_template or wp_template_part.
	 *
	 * @return array Template.
	 */
	function _get_block_templates_files( $template_type ) {
		if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
			return null;
		}

		$themes         = array(
			get_stylesheet() => get_stylesheet_directory(),
			get_template()   => get_template_directory(),
		);
		$template_files = array();
		foreach ( $themes as $theme_slug => $theme_dir ) {
			$template_base_paths  = get_block_theme_folders( $theme_slug );
			$theme_template_files = _get_block_templates_paths( $theme_dir . '/' . $template_base_paths[ $template_type ] );
			foreach ( $theme_template_files as $template_file ) {
				$template_base_path = $template_base_paths[ $template_type ];
				$template_slug      = substr(
					$template_file,
					// Starting position of slug.
					strpos( $template_file, $template_base_path . DIRECTORY_SEPARATOR ) + 1 + strlen( $template_base_path ),
					// Subtract ending '.html'.
					-5
				);
				$new_template_item = array(
					'slug'  => $template_slug,
					'path'  => $template_file,
					'theme' => $theme_slug,
					'type'  => $template_type,
				);

				if ( 'wp_template_part' === $template_type ) {
					$template_files[] = _add_block_template_part_area_info( $new_template_item );
				}

				if ( 'wp_template' === $template_type ) {
					$template_files[] = _add_block_template_info( $new_template_item );
				}
			}
		}

		return $template_files;
	}
}

if ( ! function_exists( '_add_block_template_info' ) ) {
	/**
	 * Attempts to add custom template information to the template item.
	 *
	 * @param array $template_item Template to add information to (requires 'slug' field).
	 * @return array Template
	 */
	function _add_block_template_info( $template_item ) {
		if ( ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
			return $template_item;
		}

		$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_custom_templates();
		if ( isset( $theme_data[ $template_item['slug'] ] ) ) {
			$template_item['title']     = $theme_data[ $template_item['slug'] ]['title'];
			$template_item['postTypes'] = $theme_data[ $template_item['slug'] ]['postTypes'];
		}

		return $template_item;
	}
}

if ( ! function_exists( '_add_block_template_part_area_info' ) ) {
	/**
	 * Attempts to add the template part's area information to the input template.
	 *
	 * @param array $template_info Template to add information to (requires 'type' and 'slug' fields).
	 *
	 * @return array Template.
	 */
	function _add_block_template_part_area_info( $template_info ) {
		if ( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
			$theme_data = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_template_parts();
		}

		if ( isset( $theme_data[ $template_info['slug'] ]['area'] ) ) {
			$template_info['title'] = $theme_data[ $template_info['slug'] ]['title'];
			$template_info['area']  = _filter_block_template_part_area( $theme_data[ $template_info['slug'] ]['area'] );
		} else {
			$template_info['area'] = WP_TEMPLATE_PART_AREA_UNCATEGORIZED;
		}

		return $template_info;
	}
}

if ( ! function_exists( '_flatten_blocks' ) ) {
	/**
	 * Returns an array containing the references of
	 * the passed blocks and their inner blocks.
	 *
	 * @param array $blocks array of blocks.
	 *
	 * @return array block references to the passed blocks and their inner blocks.
	 */
	function _flatten_blocks( &$blocks ) {
		$all_blocks = array();
		$queue      = array();
		foreach ( $blocks as &$block ) {
			$queue[] = &$block;
		}

		while ( count( $queue ) > 0 ) {
			$block = &$queue[0];
			array_shift( $queue );
			$all_blocks[] = &$block;

			if ( ! empty( $block['innerBlocks'] ) ) {
				foreach ( $block['innerBlocks'] as &$inner_block ) {
					$queue[] = &$inner_block;
				}
			}
		}

		return $all_blocks;
	}
}

if ( ! function_exists( '_inject_theme_attribute_in_block_template_content' ) ) {
	/**
	 * Parses wp_template content and injects the current theme's
	 * stylesheet as a theme attribute into each wp_template_part
	 *
	 * @param string $template_content serialized wp_template content.
	 *
	 * @return string Updated wp_template content.
	 */
	function _inject_theme_attribute_in_block_template_content( $template_content ) {
		$has_updated_content = false;
		$new_content         = '';
		$template_blocks     = parse_blocks( $template_content );

		$blocks = _flatten_blocks( $template_blocks );
		foreach ( $blocks as &$block ) {
			if (
				'core/template-part' === $block['blockName'] &&
				! isset( $block['attrs']['theme'] )
			) {
				$block['attrs']['theme'] = wp_get_theme()->get_stylesheet();
				$has_updated_content     = true;
			}
		}

		if ( $has_updated_content ) {
			foreach ( $template_blocks as &$block ) {
				$new_content .= serialize_block( $block );
			}

			return $new_content;
		}

		return $template_content;
	}
}

if ( ! function_exists( '_remove_theme_attribute_in_block_template_content' ) ) {
	/**
	 * Parses wp_template content and removes the theme attribute from
	 * each wp_template_part
	 *
	 * @param string $template_content serialized wp_template content.
	 *
	 * @return string Updated wp_template content.
	 */
	function _remove_theme_attribute_in_block_template_content( $template_content ) {
		$has_updated_content = false;
		$new_content         = '';
		$template_blocks     = parse_blocks( $template_content );

		$blocks = _flatten_blocks( $template_blocks );
		foreach ( $blocks as $key => $block ) {
			if ( 'core/template-part' === $block['blockName'] && isset( $block['attrs']['theme'] ) ) {
				unset( $blocks[ $key ]['attrs']['theme'] );
				$has_updated_content = true;
			}
		}

		if ( ! $has_updated_content ) {
			return $template_content;
		}

		foreach ( $template_blocks as $block ) {
			$new_content .= serialize_block( $block );
		}

		return $new_content;
	}
}

if ( ! function_exists( '_build_block_template_result_from_file' ) ) {
	/**
	 * Build a unified template object based on a theme file.
	 *
	 * @param array $template_file Theme file.
	 * @param array $template_type wp_template or wp_template_part.
	 *
	 * @return Gutenberg_Block_Template Template.
	 */
	function _build_block_template_result_from_file( $template_file, $template_type ) {
		$default_template_types = get_default_block_template_types();
		$template_content       = file_get_contents( $template_file['path'] );
		$theme                  = wp_get_theme()->get_stylesheet();

		$template                 = new Gutenberg_Block_Template();
		$template->id             = $theme . '//' . $template_file['slug'];
		$template->theme          = $theme;
		$template->content        = _inject_theme_attribute_in_block_template_content( $template_content );
		$template->slug           = $template_file['slug'];
		$template->source         = 'theme';
		$template->type           = $template_type;
		$template->title          = ! empty( $template_file['title'] ) ? $template_file['title'] : $template_file['slug'];
		$template->status         = 'publish';
		$template->has_theme_file = true;
		$template->is_custom      = true;

		if ( 'wp_template' === $template_type && isset( $default_template_types[ $template_file['slug'] ] ) ) {
			$template->description = $default_template_types[ $template_file['slug'] ]['description'];
			$template->title       = $default_template_types[ $template_file['slug'] ]['title'];
			$template->is_custom   = false;
		}

		if ( 'wp_template' === $template_type && isset( $template_file['postTypes'] ) ) {
			$template->post_types = $template_file['postTypes'];
		}

		if ( 'wp_template_part' === $template_type && isset( $template_file['area'] ) ) {
			$template->area = $template_file['area'];
		}

		return $template;
	}
}

if ( ! function_exists( 'get_block_file_template' ) ) {
	/**
	 * Retrieves a single unified template object using its id.
	 * Retrieves the file template.
	 *
	 * @param string $id Template unique identifier (example: theme_slug//template_slug).
	 * @param array  $template_type wp_template or wp_template_part.
	 *
	 * @return Gutenberg_Block_Template|null File template.
	 */
	function get_block_file_template( $id, $template_type = 'wp_template' ) {
		/**
		 * Filters the block templates array before the query takes place.
		 *
		 * Return a non-null value to bypass the WordPress queries.
		 *
		 * @since 10.8
		 *
		 * @param Gutenberg_Block_Template|null $block_template Return block template object to short-circuit the default query,
		 *                                               or null to allow WP to run it's normal queries.
		 * @param string $id Template unique identifier (example: theme_slug//template_slug).
		 * @param array  $template_type wp_template or wp_template_part.
		 */
		$block_template = apply_filters( 'pre_get_block_file_template', null, $id, $template_type );
		if ( ! is_null( $block_template ) ) {
			return $block_template;
		}

		$parts = explode( '//', $id, 2 );
		if ( count( $parts ) < 2 ) {
			/** This filter is documented at the end of this function */
			return apply_filters( 'get_block_file_template', null, $id, $template_type );
		}
		list( $theme, $slug ) = $parts;

		if ( wp_get_theme()->get_stylesheet() !== $theme ) {
			/** This filter is documented at the end of this function */
			return apply_filters( 'get_block_file_template', null, $id, $template_type );
		}

		$template_file = _get_block_template_file( $template_type, $slug );
		if ( null === $template_file ) {
			/** This filter is documented at the end of this function */
			return apply_filters( 'get_block_file_template', null, $id, $template_type );
		}

		$block_template = _build_block_template_result_from_file( $template_file, $template_type );

		/**
		 * Filters the array of queried block templates array after they've been fetched.
		 *
		 * @since 10.8
		 *
		 * @param null|Gutenberg_Block_Template $block_template The found block template.
		 * @param string $id Template unique identifier (example: theme_slug//template_slug).
		 * @param array  $template_type wp_template or wp_template_part.
		 */
		return apply_filters( 'get_block_file_template', $block_template, $id, $template_type );
	}
}

if ( ! function_exists( 'block_template_part' ) ) {
	/**
	 * Print a template-part.
	 *
	 * @param string $part The template-part to print. Use "header" or "footer".
	 *
	 * @return void
	 */
	function block_template_part( $part ) {
		$template_part = gutenberg_get_block_template( get_stylesheet() . '//' . $part, 'wp_template_part' );
		if ( ! $template_part || empty( $template_part->content ) ) {
			return;
		}
		echo do_blocks( $template_part->content );
	}
}

if ( ! function_exists( 'block_header_area' ) ) {
	/**
	 * Print the header template-part.
	 *
	 * @return void
	 */
	function block_header_area() {
		block_template_part( 'header' );
	}
}

if ( ! function_exists( 'block_footer_area' ) ) {
	/**
	 * Print the footer template-part.
	 *
	 * @return void
	 */
	function block_footer_area() {
		block_template_part( 'footer' );
	}
}
