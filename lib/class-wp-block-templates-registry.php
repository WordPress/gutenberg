<?php
/**
 * Block template functions.
 *
 * @package Gutenberg
 * @since 6.7.0
 */

if ( ! class_exists( 'WP_Block_Templates_Registry' ) ) {
	/**
	 * Core class used for interacting with block templates.
	 *
	 * @since 6.7.0
	 */
	final class WP_Block_Templates_Registry {
		/**
		 * Registered block templates, as `$name => $instance` pairs.
		 *
		 * @since 6.7.0
		 * @var WP_Block_Template[] $registered_block_templates Registered block templates.
		 */
		private $registered_block_templates = array();

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
		 * @param array                    $args          Optional. Array of block template arguments.
		 * @return WP_Block_Template|false The registered block template on success, or false on failure.
		 */
		public function register( $template_name, $args = array() ) {

			$template = null;
			if ( $template_name instanceof WP_Block_Template ) {
				$template      = $template_name;
				$template_name = $template->name;
			}

			if ( ! is_string( $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block template names must be a string.', 'gutenberg' ),
					'6.7.0'
				);
				return new WP_Error( 'template_name_no_string', __( 'Block template names must be a string.', 'gutenberg' ) );
			}

			if ( preg_match( '/[A-Z]+/', $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block template names must not contain uppercase characters.', 'gutenberg' ),
					'6.7.0'
				);
				return new WP_Error( 'template_name_no_uppercase', __( 'Block template names must not contain uppercase characters.', 'gutenberg' ) );
			}

			$name_matcher = '/^[a-z0-9-]+\/\/[a-z0-9-]+$/';
			if ( ! preg_match( $name_matcher, $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Block template names must contain a namespace prefix. Example: my-plugin//my-custom-template', 'gutenberg' ),
					'6.7.0'
				);
				return new WP_Error( 'template_no_prefix', __( 'Block template names must contain a namespace prefix. Example: my-plugin//my-custom-template', 'gutenberg' ) );
			}

			if ( $this->is_registered( $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Template name. */
					sprintf( __( 'Template "%s" is already registered.', 'gutenberg' ), $template_name ),
					'6.7.0'
				);
				/* translators: %s: Template name. */
				return new WP_Error( 'template_already_registered', __( 'Template "%s" is already registered.', 'gutenberg' ) );
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
				$template->type           = 'wp_template';
				$template->title          = isset( $args['title'] ) ? $args['title'] : '';
				$template->description    = isset( $args['description'] ) ? $args['description'] : '';
				$template->status         = 'publish';
				$template->has_theme_file = true;
				$template->origin         = 'plugin';
				$template->is_custom      = true;
				$template->post_types     = isset( $args['post_types'] ) ? $args['post_types'] : '';
			}

			$this->registered_block_templates[ $template_name ] = $template;

			return $template;
		}

		/**
		 * Retrieves all registered block templates.
		 *
		 * @since 6.7.0
		 *
		 * @return WP_Block_Template[]|false Associative array of `$block_template_name => $block_template` pairs.
		 */
		public function get_all_registered() {
			return $this->registered_block_templates;
		}

		/**
		 * Retrieves a registered template by its and name.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_name Block template name including namespace.
		 * @return WP_Block_Template|null|false The registered block template, or null if it is not registered.
		 */
		public function get_registered( $template_name ) {
			if ( ! $this->is_registered( $template_name ) ) {
				return null;
			}

			return $this->registered_block_templates[ $template_name ];
		}

		/**
		 * Retrieves a registered template by its slug.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_slug Slug of the template.
		 * @return WP_Block_Template|null The registered block template, or null if it is not registered.
		 */
		public function get_by_slug( $template_slug ) {
			$all_templates = $this->get_all_registered();

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
		 * @param array  $query {
		 *     Arguments to retrieve templates. Optional, empty by default.
		 *
		 *     @type string[] $slug__in     List of slugs to include.
		 *     @type string[] $slug__not_in List of slugs to skip.
		 *     @type string   $post_type    Post type to get the templates for.
		 * }
		 */
		public function get_by_query( $query = array() ) {
			$all_templates = $this->get_all_registered();

			if ( ! $all_templates ) {
				return array();
			}

			$query            = wp_parse_args(
				$query,
				array(
					'slug__in'     => array(),
					'slug__not_in' => array(),
					'post_type'    => '',
				)
			);
			$slugs_to_include = $query['slug__in'];
			$slugs_to_skip    = $query['slug__not_in'];
			$post_type        = $query['post_type'];

			foreach ( $all_templates as $template_name => $template ) {
				if ( ! empty( $slugs_to_include ) && ! in_array( $template->slug, $slugs_to_include, true ) ) {
					unset( $all_templates[ $template_name ] );
				}

				if ( ! empty( $slugs_to_skip ) && in_array( $template->slug, $slugs_to_skip, true ) ) {
					unset( $all_templates[ $template_name ] );
				}

				if ( ! empty( $post_type ) && ! in_array( $post_type, $template->post_types, true ) ) {
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
		 * @param string $template_name Block template name including namespace.
		 * @return bool True if the template is registered, false otherwise.
		 */
		public function is_registered( $template_name ) {
			return isset( $this->registered_block_templates[ $template_name ] );
		}

		/**
		 * Unregisters a block template.
		 *
		 * @since 6.7.0
		 *
		 * @param string $name          Block template name including namespace.
		 * @return WP_Block_Template|false The unregistered block template on success, or false on failure.
		 */
		public function unregister( $template_name ) {
			if ( ! $this->is_registered( $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Template name. */
					sprintf( __( 'Template "%s" is not registered.', 'gutenberg' ), $template_name ),
					'6.7.0'
				);
				/* translators: %s: Template name. */
				return new WP_Error( 'template_not_registered', __( 'Template "%s" is not registered.', 'gutenberg' ) );
			}

			$unregistered_block_template = $this->registered_block_templates[ $template_name ];
			unset( $this->registered_block_templates[ $template_name ] );

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
