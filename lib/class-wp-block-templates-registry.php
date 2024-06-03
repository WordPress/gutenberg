<?php
/**
 * Block template functions.
 *
 * @package Gutenberg
 * @since 6.7.0
 */

if ( ! class_exists( 'WP_Block_Templates_Registry' ) ) {
	/**
	 * Core class used for interacting with block templates and block template parts.
	 *
	 * @since 6.7.0
	 */
	final class WP_Block_Templates_Registry {
		/**
		 * Registered block templates, as `$name => $instance` pairs.
		 *
		 * @since 6.7.0
		 * @var array  $registered_block_templates {
		 *     @type WP_Block_Template[] $wp_template      Registered block templates.
		 *     @type WP_Block_Template[] $wp_template_part Registered block template parts.
		 * }
		 */
		private $registered_block_templates = array(
			'wp_template'      => array(),
			'wp_template_part' => array(),
		);

		/**
		 * Container for the main instance of the class.
		 *
		 * @since 6.7.0
		 * @var WP_Block_Templates_Registry|null
		 */
		private static $instance = null;

		/**
		 * Registers a block template.
		 *
		 * @since 6.7.0
		 *
		 * @param string|WP_Block_Template $template_name Block template name including namespace, or alternatively
		 *                                                a complete WP_Block_Template instance. In case a WP_Block_Template
		 *                                                is provided, the $args parameter will be ignored.
		 * @param string                   $template_type Template type, either `wp_template` or `wp_template_part`.
		 * @param array                    $args          Optional. Array of block template arguments.
		 * @return WP_Block_Template|false The registered block template on success, or false on failure.
		 */
		public function register( $template_name, $template_type, $args = array() ) {

			$template = null;
			if ( $template_name instanceof WP_Block_Template ) {
				$template      = $template_name;
				$template_name = $template->name;
			}

			if ( ! is_string( $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block template names must be strings.', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block templates need to be of `wp_template` or `wp_template_part` type.', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			if ( preg_match( '/[A-Z]+/', $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block template names must not contain uppercase characters.', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			$name_matcher = '/^[a-z0-9-]+\/\/[a-z0-9-]+$/';
			if ( ! preg_match( $name_matcher, $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block template names must contain a namespace prefix. Example: my-plugin//my-custom-template', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			if ( $this->is_registered( $template_type, $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Template name. */
					sprintf( __( 'Template "%s" is already registered.', 'gutenberg' ), $template_name ),
					'6.7.0'
				);
				return false;
			}

			if ( ! $template ) {
				$theme_name = get_stylesheet();
				$slug       = isset( $args['slug'] ) ? $args['slug'] : explode( '//', $template_name )[1];

				$template                 = new WP_Block_Template();
				$template->id             = $theme_name . '//' . $slug;
				$template->theme          = $theme_name;
				$template->plugin         = isset( $args['plugin'] ) ? $args['plugin'] : '';
				$template->author         = null;
				$template->content        = isset( $args['content'] ) ? $args['content'] : '';
				$template->source         = 'plugin';
				$template->slug           = $slug;
				$template->type           = $template_type;
				$template->title          = isset( $args['title'] ) ? $args['title'] : '';
				$template->description    = isset( $args['description'] ) ? $args['description'] : '';
				$template->status         = 'publish';
				$template->has_theme_file = true;
				$template->origin         = 'plugin';
				$template->is_custom      = true;
				$template->post_types     = 'wp_template' === $template_type && isset( $args['post_types'] ) ? $args['post_types'] : '';
				$template->area           = 'wp_template_part' === $template_type && isset( $args['area'] ) ? $args['area'] : '';
			}

			$this->registered_block_templates[ $template_type ][ $template_name ] = $template;

			return $template;
		}

		/**
		 * Retrieves all registered block templates by type.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_type Template type, either `wp_template` or `wp_template_part`.
		 * @return WP_Block_Template[]|false Associative array of `$block_template_name => $block_template` pairs.
		 */
		public function get_all_registered( $template_type ) {
			if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Only valid block template types are `wp_template` and `wp_template_part`.', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			return $this->registered_block_templates[ $template_type ];
		}

		/**
		 * Retrieves a registered template by its type and name.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_type Template type, either `wp_template` or `wp_template_part`.
		 * @param string $template_name Block template name including namespace.
		 * @return WP_Block_Template|null|false The registered block template, or null if it is not registered.
		 */
		public function get_registered( $template_type, $template_name ) {
			if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Only valid block template types are `wp_template` and `wp_template_part`.', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			if ( ! $this->is_registered( $template_type, $template_name ) ) {
				return null;
			}

			return $this->registered_block_templates[ $template_type ][ $template_name ];
		}

		/**
		 * Retrieves a registered template by its type and slug.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_type Template type, either `wp_template` or `wp_template_part`.
		 * @param string $template_slug Slug of the template.
		 * @return WP_Block_Template|null The registered block template, or null if it is not registered.
		 */
		public function get_by_slug( $template_type, $template_slug ) {
			$all_templates = $this->get_all_registered( $template_type );

			if ( ! $all_templates ) {
				return null;
			}

			foreach ( $all_templates as $template ) {
				if ( $template->slug === $template_slug ) {
					return $template;
				}
			}

			return null;
		}

		/**
		 * Retrieves registered block templates matching a query.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_type Template type. Either 'wp_template' or 'wp_template_part'.
		 * @param array  $query {
		 *     Arguments to retrieve templates. Optional, empty by default.
		 *
		 *     @type string[] $slug__in     List of slugs to include.
		 *     @type string[] $slug__not_in List of slugs to skip.
		 *     @type string   $area         A 'wp_template_part_area' taxonomy value to filter by (for 'wp_template_part' template type only).
		 *     @type string   $post_type    Post type to get the templates for.
		 * }
		 */
		public function get_by_query( $template_type, $query = array() ) {
			$all_templates = $this->get_all_registered( $template_type );

			if ( ! $all_templates ) {
				return array();
			}

			$slugs_to_include = isset( $query['slug__in'] ) ? $query['slug__in'] : array();
			$slugs_to_skip    = isset( $query['slug__not_in'] ) ? $query['slug__not_in'] : array();
			$area             = isset( $query['area'] ) ? $query['area'] : null;
			$post_type        = isset( $query['post_type'] ) ? $query['post_type'] : '';

			foreach ( $all_templates as $template_name => $template ) {
				if ( ! empty( $slugs_to_include ) && ! in_array( $template->slug, $slugs_to_include, true ) ) {
					unset( $all_templates[ $template_name ] );
				}

				if ( ! empty( $slugs_to_skip ) && in_array( $template->slug, $slugs_to_skip, true ) ) {
					unset( $all_templates[ $template_name ] );
				}

				if ( 'wp_template_part' === $template_type && isset( $area ) && $template->area !== $area ) {
					unset( $all_templates[ $template_name ] );
				}

				if ( 'wp_template' === $template_type && ! empty( $post_type ) && ! in_array( $post_type, $template->post_types, true ) ) {
					unset( $all_templates[ $template_name ] );
				}
			}

			return $all_templates;
		}

		/**
		 * Checks if a block template is registered.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_type Template type, either `wp_template` or `wp_template_part`.
		 * @param string $template_name Block template name including namespace.
		 * @return bool True if the template is registered, false otherwise.
		 */
		public function is_registered( $template_type, $template_name ) {
			if ( 'wp_template' !== $template_type && 'wp_template_part' !== $template_type ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Only valid block template types are `wp_template` and `wp_template_part`.', 'gutenberg' ),
					'6.7.0'
				);
				return false;
			}

			return isset( $this->registered_block_templates[ $template_type ][ $template_name ] );
		}

		/**
		 * Unregisters a block template.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_type Template type, either `wp_template` or `wp_template_part`.
		 * @param string $name          Block template name including namespace.
		 * @return WP_Block_Template|false The unregistered block template on success, or false on failure.
		 */
		public function unregister( $template_type, $template_name ) {
			if ( ! $this->is_registered( $template_type, $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Block name. */
					sprintf( __( 'Block template "%s" is not registered.', 'gutenberg' ), $template_name ),
					'6.7.0'
				);
				return false;
			}

			$unregistered_block_template = $this->registered_block_templates[ $template_type ][ $template_name ];
			unset( $this->registered_block_templates[ $template_type ][ $template_name ] );

			return $unregistered_block_template;
		}

		/**
		 * Utility method to retrieve the main instance of the class.
		 *
		 * The instance will be created if it does not exist yet.
		 *
		 * @since 6.7.0
		 *
		 * @return WP_Block_Templates_Registry The main instance.
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
}
