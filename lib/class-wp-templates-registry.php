<?php
/**
 * Templates registry functions.
 *
 * @package Gutenberg
 * @since 6.7.0
 */

if ( ! class_exists( 'WP_Templates_Registry' ) ) {
	/**
	 * Core class used for interacting with templates.
	 *
	 * @since 6.7.0
	 */
	final class WP_Templates_Registry {
		/**
		 * Registered templates, as `$name => $instance` pairs.
		 *
		 * @since 6.7.0
		 * @var WP_Block_Template[] $registered_block_templates Registered templates.
		 */
		private $registered_templates = array();

		/**
		 * Container for the main instance of the class.
		 *
		 * @since 6.7.0
		 * @var WP_Templates_Registry|null
		 */
		private static $instance = null;

		/**
		 * Registers a template.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_name Template name.
		 * @param array  $args          Optional. Array of template arguments.
		 * @return WP_Block_Template|false The registered template on success, or false on failure.
		 */
		public function register( $template_name, $args = array() ) {

			$template = null;

			if ( ! is_string( $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Template names must be a string.', 'gutenberg' ),
					'6.7.0'
				);
				return new WP_Error( 'template_name_no_string', __( 'Template names must be a string.', 'gutenberg' ) );
			}

			if ( preg_match( '/[A-Z]+/', $template_name ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Template names must not contain uppercase characters.', 'gutenberg' ),
					'6.7.0'
				);
				return new WP_Error( 'template_name_no_uppercase', __( 'Template names must not contain uppercase characters.', 'gutenberg' ) );
			}

			if ( ! isset( $args['plugin' ] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Registered templates must have a plugin property.', 'gutenberg' ),
					'6.7.0'
				);
				return new WP_Error( 'template_no_plugin', __( 'Registered templates must have a plugin property.', 'gutenberg' ) );
			}

			$template_id = $args['plugin'] . '//' . $template_name;

			if ( $this->is_registered( $template_id ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Template id. */
					sprintf( __( 'Template "%s" is already registered.', 'gutenberg' ), $template_id ),
					'6.7.0'
				);
				/* translators: %s: Template id. */
				return new WP_Error( 'template_already_registered', __( 'Template "%s" is already registered.', 'gutenberg' ) );
			}

			if ( ! $template ) {
				$theme_name = get_stylesheet();

				$template              = new WP_Block_Template();
				$template->id          = $theme_name . '//' . $template_name;
				$template->theme       = $theme_name;
				$template->plugin      = $args['plugin'];
				$template->author      = null;
				$template->content     = isset( $args['content'] ) ? $args['content'] : '';
				$template->source      = 'plugin';
				$template->slug        = $template_name;
				$template->type        = 'wp_template';
				$template->title       = isset( $args['title'] ) ? $args['title'] : '';
				$template->description = isset( $args['description'] ) ? $args['description'] : '';
				$template->status      = 'publish';
				$template->origin      = 'plugin';
				$template->is_custom   = true;
				$template->post_types  = isset( $args['post_types'] ) ? $args['post_types'] : '';
			}

			$this->registered_templates[ $template_id ] = $template;

			return $template;
		}

		/**
		 * Retrieves all registered templates.
		 *
		 * @since 6.7.0
		 *
		 * @return WP_Block_Template[]|false Associative array of `$template_id => $template` pairs.
		 */
		public function get_all_registered() {
			return $this->registered_templates;
		}

		/**
		 * Retrieves a registered template by its id.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_id Template id including namespace.
		 * @return WP_Block_Template|null|false The registered template, or null if it is not registered.
		 */
		public function get_registered( $template_id ) {
			if ( ! $this->is_registered( $template_id ) ) {
				return null;
			}

			return $this->registered_templates[ $template_id ];
		}

		/**
		 * Retrieves a registered template by its slug.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_slug Slug of the template.
		 * @return WP_Block_Template|null The registered template, or null if it is not registered.
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
		 * Retrieves registered templates matching a query.
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

			$matching_templates = array();
			foreach ( $all_templates as $template_id => $template ) {
				if ( ! empty( $slugs_to_include ) && ! in_array( $template->slug, $slugs_to_include, true ) ) {
					continue;
				}

				if ( ! empty( $slugs_to_skip ) && in_array( $template->slug, $slugs_to_skip, true ) ) {
					continue;
				}

				if ( ! empty( $post_type ) && ! in_array( $post_type, $template->post_types, true ) ) {
					continue;
				}

				$matching_templates[ $template_id ] = $template;
			}

			return $matching_templates;
		}

		/**
		 * Checks if a template is registered.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_id Template id.
		 * @return bool True if the template is registered, false otherwise.
		 */
		public function is_registered( $template_id ) {
			return isset( $this->registered_templates[ $template_id ] );
		}

		/**
		 * Unregisters a template.
		 *
		 * @since 6.7.0
		 *
		 * @param string $template_id Template id including namespace.
		 * @return WP_Block_Template|false The unregistered template on success, or false on failure.
		 */
		public function unregister( $template_id ) {
			if ( ! $this->is_registered( $template_id ) ) {
				_doing_it_wrong(
					__METHOD__,
					/* translators: %s: Template name. */
					sprintf( __( 'Template "%s" is not registered.', 'gutenberg' ), $template_id ),
					'6.7.0'
				);
				/* translators: %s: Template name. */
				return new WP_Error( 'template_not_registered', __( 'Template "%s" is not registered.', 'gutenberg' ) );
			}

			$unregistered_template = $this->registered_templates[ $template_id ];
			unset( $this->registered_templates[ $template_id ] );

			return $unregistered_template;
		}

		/**
		 * Utility method to retrieve the main instance of the class.
		 *
		 * The instance will be created if it does not exist yet.
		 *
		 * @since 6.7.0
		 *
		 * @return WP_Templates_Registry The main instance.
		 */
		public static function get_instance() {
			if ( null === self::$instance ) {
				self::$instance = new self();
			}

			return self::$instance;
		}
	}
}
