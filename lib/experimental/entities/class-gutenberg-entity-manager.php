<?php
/**
 * Entity Manager.
 *
 * Manages the lifecycle of post types and taxonomies, storing their
 * configurations in a database option and re-registering them on init.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Entity configuration manager.
 */
class Gutenberg_Entity_Manager {

	/**
	 * Option name for storing entity configurations.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'gutenberg_entity_configs';

	/**
	 * Initializes the entity manager hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'apply_entity_configs' ), 99 );
	}

	/**
	 * Applies stored entity configurations.
	 *
	 * On first run, seeds the option from currently registered types.
	 * On subsequent runs, modifies existing types and registers user-created ones.
	 */
	public static function apply_entity_configs() {
		$configs = get_option( self::OPTION_NAME, null );
		$dirty   = false;

		// First activation: seed from current state.
		if ( null === $configs || false === $configs ) {
			$configs = self::seed_from_current_state();
			update_option( self::OPTION_NAME, $configs, false );
			return;
		}

		if ( ! isset( $configs['post_types'] ) ) {
			$configs['post_types'] = array();
		}
		if ( ! isset( $configs['taxonomies'] ) ) {
			$configs['taxonomies'] = array();
		}

		// Auto-detect new post types registered by plugins since last run.
		$post_types = get_post_types( array(), 'objects' );
		foreach ( $post_types as $slug => $type_object ) {
			if ( ! isset( $configs['post_types'][ $slug ] ) ) {
				$configs['post_types'][ $slug ] = self::extract_post_type_config( $slug, $type_object );
				$dirty                          = true;
			}
		}

		// Auto-detect new taxonomies registered by plugins since last run.
		$taxonomies = get_taxonomies( array(), 'objects' );
		foreach ( $taxonomies as $slug => $taxonomy_object ) {
			if ( ! isset( $configs['taxonomies'][ $slug ] ) ) {
				$configs['taxonomies'][ $slug ] = self::extract_taxonomy_config( $slug, $taxonomy_object );
				$dirty                          = true;
			}
		}

		// Apply post type configs.
		foreach ( $configs['post_types'] as $slug => $config ) {
			if ( empty( $config['_user_created'] ) && post_type_exists( $slug ) ) {
				self::modify_post_type( $slug, $config );
			} elseif ( ! empty( $config['_user_created'] ) && ! post_type_exists( $slug ) ) {
				self::register_custom_post_type( $slug, $config );
			}
			// If not user-created and doesn't exist, it's an orphan — skip silently.
		}

		// Apply taxonomy configs.
		foreach ( $configs['taxonomies'] as $slug => $config ) {
			if ( empty( $config['_user_created'] ) && taxonomy_exists( $slug ) ) {
				self::modify_taxonomy( $slug, $config );
			} elseif ( ! empty( $config['_user_created'] ) && ! taxonomy_exists( $slug ) ) {
				self::register_custom_taxonomy( $slug, $config );
			}
			// If not user-created and doesn't exist, it's an orphan — skip silently.
		}

		if ( $dirty ) {
			update_option( self::OPTION_NAME, $configs, false );
		}
	}

	/**
	 * Seeds the entity configs option from currently registered types and taxonomies.
	 *
	 * @return array The seeded configuration array.
	 */
	public static function seed_from_current_state() {
		$configs = array(
			'post_types' => array(),
			'taxonomies' => array(),
		);

		// Capture all registered post types.
		$post_types = get_post_types( array(), 'objects' );
		foreach ( $post_types as $slug => $type_object ) {
			$configs['post_types'][ $slug ] = self::extract_post_type_config( $slug, $type_object );
		}

		// Capture all registered taxonomies.
		$taxonomies = get_taxonomies( array(), 'objects' );
		foreach ( $taxonomies as $slug => $taxonomy_object ) {
			$configs['taxonomies'][ $slug ] = self::extract_taxonomy_config( $slug, $taxonomy_object );
		}

		return $configs;
	}

	/**
	 * Extracts a storable configuration from a WP_Post_Type object.
	 *
	 * @param string       $slug        The post type slug.
	 * @param WP_Post_Type $type_object The post type object.
	 * @return array The extracted configuration.
	 */
	private static function extract_post_type_config( $slug, $type_object ) {
		$labels = array();
		if ( isset( $type_object->labels ) ) {
			$labels = (array) $type_object->labels;
		}

		$supports = get_all_post_type_supports( $slug );

		// Normalize supports to boolean values.
		$normalized_supports = array();
		foreach ( $supports as $feature => $value ) {
			$normalized_supports[ $feature ] = (bool) $value;
		}

		$rewrite = false;
		if ( is_array( $type_object->rewrite ) ) {
			$rewrite = $type_object->rewrite;
		} elseif ( true === $type_object->rewrite ) {
			$rewrite = array( 'slug' => $slug );
		}

		return array(
			'_user_created' => false,
			'_source'       => ! empty( $type_object->_builtin ) ? 'core' : 'plugin',
			'labels'        => $labels,
			'description'   => $type_object->description ?? '',
			'public'        => (bool) ( $type_object->public ?? false ),
			'hierarchical'  => (bool) ( $type_object->hierarchical ?? false ),
			'supports'      => $normalized_supports,
			'has_archive'   => $type_object->has_archive ?? false,
			'rewrite'       => $rewrite,
			'show_in_rest'  => (bool) ( $type_object->show_in_rest ?? false ),
			'rest_base'     => $type_object->rest_base ?? $slug,
			'menu_icon'     => $type_object->menu_icon ?? null,
			'menu_position' => $type_object->menu_position ?? null,
			'show_ui'       => (bool) ( $type_object->show_ui ?? false ),
			'show_in_menu'  => $type_object->show_in_menu ?? false,
			'taxonomies'    => (array) get_object_taxonomies( $slug ),
		);
	}

	/**
	 * Extracts a storable configuration from a WP_Taxonomy object.
	 *
	 * @param string      $slug            The taxonomy slug.
	 * @param WP_Taxonomy $taxonomy_object The taxonomy object.
	 * @return array The extracted configuration.
	 */
	private static function extract_taxonomy_config( $slug, $taxonomy_object ) {
		$labels = array();
		if ( isset( $taxonomy_object->labels ) ) {
			$labels = (array) $taxonomy_object->labels;
		}

		$rewrite = false;
		if ( is_array( $taxonomy_object->rewrite ) ) {
			$rewrite = $taxonomy_object->rewrite;
		} elseif ( true === $taxonomy_object->rewrite ) {
			$rewrite = array( 'slug' => $slug );
		}

		return array(
			'_user_created' => false,
			'_source'       => ! empty( $taxonomy_object->_builtin ) ? 'core' : 'plugin',
			'labels'        => $labels,
			'description'   => $taxonomy_object->description ?? '',
			'public'        => (bool) ( $taxonomy_object->public ?? false ),
			'hierarchical'  => (bool) ( $taxonomy_object->hierarchical ?? false ),
			'show_in_rest'  => (bool) ( $taxonomy_object->show_in_rest ?? false ),
			'rest_base'     => $taxonomy_object->rest_base ?? $slug,
			'show_ui'       => (bool) ( $taxonomy_object->show_ui ?? false ),
			'show_in_menu'  => $taxonomy_object->show_in_menu ?? false,
			'rewrite'       => $rewrite,
			'object_type'   => (array) ( $taxonomy_object->object_type ?? array() ),
		);
	}

	/**
	 * Modifies an existing post type in place using global $wp_post_types.
	 *
	 * @param string $slug   The post type slug.
	 * @param array  $config The stored configuration.
	 */
	private static function modify_post_type( $slug, $config ) {
		global $wp_post_types;

		if ( ! isset( $wp_post_types[ $slug ] ) ) {
			return;
		}

		$type_object = $wp_post_types[ $slug ];

		if ( ! empty( $config['labels'] ) ) {
			$type_object->labels = (object) array_merge(
				(array) $type_object->labels,
				$config['labels']
			);
			$type_object->label = $type_object->labels->name ?? $type_object->label;
		}

		if ( isset( $config['description'] ) ) {
			$type_object->description = $config['description'];
		}

		if ( isset( $config['public'] ) ) {
			$type_object->public = (bool) $config['public'];
		}

		if ( isset( $config['show_ui'] ) ) {
			$type_object->show_ui = (bool) $config['show_ui'];
		}

		if ( isset( $config['show_in_menu'] ) ) {
			$type_object->show_in_menu = $config['show_in_menu'];
		}

		if ( isset( $config['show_in_rest'] ) ) {
			$type_object->show_in_rest = (bool) $config['show_in_rest'];
		}

		if ( isset( $config['menu_icon'] ) ) {
			$type_object->menu_icon = $config['menu_icon'];
		}

		if ( isset( $config['menu_position'] ) ) {
			$type_object->menu_position = $config['menu_position'];
		}

		if ( isset( $config['has_archive'] ) ) {
			$type_object->has_archive = $config['has_archive'];
		}

		if ( isset( $config['supports'] ) ) {
			// Clear and re-add supports.
			$existing_supports = get_all_post_type_supports( $slug );
			foreach ( array_keys( $existing_supports ) as $feature ) {
				remove_post_type_support( $slug, $feature );
			}
			foreach ( $config['supports'] as $feature => $enabled ) {
				if ( $enabled ) {
					add_post_type_support( $slug, $feature );
				}
			}
		}

	}

	/**
	 * Registers a user-created post type.
	 *
	 * @param string $slug   The post type slug.
	 * @param array  $config The stored configuration.
	 */
	private static function register_custom_post_type( $slug, $config ) {
		$supports = array();
		if ( ! empty( $config['supports'] ) ) {
			$supports = array_keys( array_filter( $config['supports'] ) );
		}
		if ( empty( $supports ) ) {
			$supports = array( 'title', 'editor' );
		}

		$args = array(
			'labels'        => $config['labels'] ?? array(),
			'description'   => $config['description'] ?? '',
			'public'        => $config['public'] ?? true,
			'hierarchical'  => $config['hierarchical'] ?? false,
			'supports'      => $supports,
			'has_archive'   => $config['has_archive'] ?? false,
			'rewrite'       => $config['rewrite'] ?? true,
			'show_in_rest'  => $config['show_in_rest'] ?? true,
			'rest_base'     => $config['rest_base'] ?? $slug,
			'menu_icon'     => $config['menu_icon'] ?? 'dashicons-admin-post',
			'menu_position' => $config['menu_position'] ?? null,
			'show_ui'       => $config['show_ui'] ?? true,
			'show_in_menu'  => $config['show_in_menu'] ?? true,
			'taxonomies'    => $config['taxonomies'] ?? array(),
		);

		register_post_type( $slug, $args );
	}

	/**
	 * Modifies an existing taxonomy in place using global $wp_taxonomies.
	 *
	 * @param string $slug   The taxonomy slug.
	 * @param array  $config The stored configuration.
	 */
	private static function modify_taxonomy( $slug, $config ) {
		global $wp_taxonomies;

		if ( ! isset( $wp_taxonomies[ $slug ] ) ) {
			return;
		}

		$taxonomy_object = $wp_taxonomies[ $slug ];

		if ( ! empty( $config['labels'] ) ) {
			$taxonomy_object->labels = (object) array_merge(
				(array) $taxonomy_object->labels,
				$config['labels']
			);
			$taxonomy_object->label = $taxonomy_object->labels->name ?? $taxonomy_object->label;
		}

		if ( isset( $config['description'] ) ) {
			$taxonomy_object->description = $config['description'];
		}

		if ( isset( $config['public'] ) ) {
			$taxonomy_object->public = (bool) $config['public'];
		}

		if ( isset( $config['show_ui'] ) ) {
			$taxonomy_object->show_ui = (bool) $config['show_ui'];
		}

		if ( isset( $config['show_in_menu'] ) ) {
			$taxonomy_object->show_in_menu = $config['show_in_menu'];
		}

		if ( isset( $config['show_in_rest'] ) ) {
			$taxonomy_object->show_in_rest = (bool) $config['show_in_rest'];
		}

		if ( isset( $config['object_type'] ) ) {
			$current_object_types = (array) $taxonomy_object->object_type;
			$desired_object_types = (array) $config['object_type'];

			// Unregister from post types that are no longer assigned.
			foreach ( $current_object_types as $post_type ) {
				if ( ! in_array( $post_type, $desired_object_types, true ) ) {
					unregister_taxonomy_for_object_type( $slug, $post_type );
				}
			}

			// Register for newly assigned post types.
			foreach ( $desired_object_types as $post_type ) {
				if ( ! in_array( $post_type, $current_object_types, true ) ) {
					register_taxonomy_for_object_type( $slug, $post_type );
				}
			}

			$taxonomy_object->object_type = $desired_object_types;
		}
	}

	/**
	 * Registers a user-created taxonomy.
	 *
	 * @param string $slug   The taxonomy slug.
	 * @param array  $config The stored configuration.
	 */
	private static function register_custom_taxonomy( $slug, $config ) {
		$args = array(
			'labels'        => $config['labels'] ?? array(),
			'description'   => $config['description'] ?? '',
			'public'        => $config['public'] ?? true,
			'hierarchical'  => $config['hierarchical'] ?? false,
			'show_in_rest'  => $config['show_in_rest'] ?? true,
			'rest_base'     => $config['rest_base'] ?? $slug,
			'show_ui'       => $config['show_ui'] ?? true,
			'show_in_menu'  => $config['show_in_menu'] ?? true,
			'rewrite'       => $config['rewrite'] ?? true,
		);

		$object_type = $config['object_type'] ?? array( 'post' );

		register_taxonomy( $slug, $object_type, $args );
	}
}
