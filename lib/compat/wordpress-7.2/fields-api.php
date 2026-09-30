<?php
/**
 * Entity fields API.
 *
 * A field definition is the serializable subset of the DataViews Field API:
 * every property that is plain data (`id`, `type`, `label`, `elements`,
 * `filterBy`, `isValid`, …). Properties that are JavaScript callbacks or
 * components (`render`, `Edit` as a component, `getValue`, `setValue`, `sort`,
 * `isVisible`, `getElements`, …) cannot be declared here. They are provided by
 * a script module registered for the entity along with its fields: its default
 * export maps field ids to the properties of each field that are JavaScript. An
 * entity can have several modules. Each module applies to the fields it was
 * registered with, see {@see gutenberg_get_registered_field_modules()}.
 *
 * Fields are registered on the `fields_api_init` action, and only there, on the
 * registry its callbacks receive, see
 * {@see Gutenberg_Fields_Registry::register()},
 * {@see Gutenberg_Fields_Registry::update()}, and
 * {@see Gutenberg_Fields_Registry::unregister()}. The functions below read the
 * registry.
 *
 * Fields can also be declared as files, grouped in a field collection, which
 * a `fields_api_init` callback registers with
 * {@see gutenberg_register_field_collection()}. The fields a collection for
 * every post type derives from the supports of each post type can be
 * excluded per post type with the `fields_api_exclude_post_type_supports`
 * filter.
 *
 * @package gutenberg
 */

/**
 * Returns the fields registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array[] The list of registered field definitions, in registration
 *                 order. Empty until the `init` action has completed: a
 *                 read before then is refused.
 */
function gutenberg_get_registered_fields( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered( $kind, $name );
}

/**
 * Returns the ids of the script modules registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array<string, string[]> The ids of the fields each module applies
 *                                 to, keyed by module id, in registration
 *                                 order. Empty until the `init` action has
 *                                 completed: a read before then is refused.
 */
function gutenberg_get_registered_field_modules( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered_field_modules( $kind, $name );
}

/**
 * Returns the ids of all script modules registered for any entity.
 *
 * @return array<string, array<string, string[]>> The lists of module ids,
 *                                                keyed by kind, then by
 *                                                name. Empty until the
 *                                                `init` action has
 *                                                completed: a read before
 *                                                then is refused.
 */
function gutenberg_get_all_registered_field_modules() {
	return Gutenberg_Fields_Registry::get_instance()->get_all_registered_field_modules();
}

/**
 * Declares the script modules of the entity fields as dependencies of the
 * editor script.
 *
 * The editor imports the script modules of an entity on demand, with a dynamic
 * `import()` the browser resolves through the import map of the page. Listing
 * the modules as dynamic `module_dependencies` of the `wp-editor` script adds
 * them to the import map of every page that loads the editor script: the post
 * editor, the site editor, and the pages booted by `@wordpress/boot`, whose
 * prerequisites depend on it. A dynamic dependency is only listed in the
 * import map; the module is fetched when it is imported.
 *
 * Reading the registry fires `fields_api_init`, so the fields and their
 * script modules are registered on demand. It only reads the registry on the
 * pages that load the editor script, not on every admin request (heartbeat,
 * Ajax, other screens). It runs on `admin_footer`, the last action before the
 * import map is printed that fires both in the admin template and in the pages
 * rendered outside it, which print the import map themselves. By then `init`
 * has completed, so the supports the default fields derive from are final.
 * The registry only accepts registrations while the action fires, so the
 * modules declared here are the modules of every field the page can show.
 *
 * When called by the `admin_footer` action, `$scripts` is the hook suffix of
 * the page and the global registry is used. In other scenarios (tests), the
 * scripts are given directly.
 *
 * @param WP_Scripts|null $scripts The scripts registry. Defaults to the global one.
 */
function _gutenberg_add_field_modules_to_editor_script( $scripts = null ) {
	if ( ! $scripts instanceof WP_Scripts ) {
		$scripts = wp_scripts();
	}

	// Field registration as well as actions live in packages/editor/src/dataviews/store/private-actions.ts
	// which means any screen that wants to use this mechanism needs to load the editor script.
	if ( ! $scripts->query( 'wp-editor', 'enqueued' ) && ! $scripts->query( 'wp-editor', 'done' ) ) {
		return;
	}

	$kinds = gutenberg_get_all_registered_field_modules();
	if ( empty( $kinds ) ) {
		return;
	}

	$dependencies = $scripts->get_data( 'wp-editor', 'module_dependencies' );
	$dependencies = is_array( $dependencies ) ? $dependencies : array();

	$declared = array();
	foreach ( $dependencies as $dependency ) {
		$declared[] = is_array( $dependency ) ? $dependency['id'] : $dependency;
	}

	$added = false;
	foreach ( $kinds as $entities ) {
		foreach ( $entities as $modules ) {
			foreach ( $modules as $module ) {
				if ( ! in_array( $module, $declared, true ) ) {
					$dependencies[] = array(
						'id'     => $module,
						'import' => 'dynamic',
					);
					$declared[]     = $module;
					$added          = true;
				}
			}
		}
	}

	if ( $added ) {
		// `add_data()` replaces the value, hence the merge above.
		$scripts->add_data( 'wp-editor', 'module_dependencies', $dependencies );
	}
}
add_action( 'admin_footer', '_gutenberg_add_field_modules_to_editor_script' );

/**
 * Returns the post types whose fields the screen of the site editor being
 * loaded lists, from its `p` query arg.
 *
 * The screens are the routes in
 * packages/edit-site/src/components/site-editor-routes: the lists and the
 * editors of pages, templates, patterns, and template parts. The patterns
 * screen lists both patterns and template parts.
 *
 * @return string[] The post types, empty for any other screen.
 */
function _gutenberg_get_site_editor_screen_post_types() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks what to preload.
	$path     = isset( $_GET['p'] ) && is_string( $_GET['p'] ) ? sanitize_text_field( wp_unslash( $_GET['p'] ) ) : '';
	$segments = explode( '/', trim( $path, '/' ) );

	switch ( $segments[0] ) {
		case 'page':
			return array( 'page' );
		case 'template':
		case 'wp_template':
			return array( 'wp_template' );
		case 'pattern':
			return array( 'wp_block', 'wp_template_part' );
		case 'wp_block':
			return array( 'wp_block' );
		case 'wp_template_part':
			return array( 'wp_template_part' );
	}
	return array();
}

/**
 * Preloads the fields of the post types the post editor or the site editor
 * lists.
 *
 * Both editors read them from the `wp/v2/fields` route before they can list
 * the post fields, see `registerPostTypeSchema` in
 * packages/editor/src/dataviews/store/private-actions.ts. The post editor
 * reads the fields of the edited post type; the site editor those of the
 * edited post, if any, and of the post types of the screen it opens on. The
 * path must match the request of the `getFieldsConfig` core data resolver.
 *
 * @param array                   $paths   REST API paths to preload.
 * @param WP_Block_Editor_Context $context Block editor context.
 * @return array Filtered preload paths.
 */
function _gutenberg_preload_entity_fields( $paths, $context ) {
	$post_types = array();
	if ( 'core/edit-post' === $context->name && isset( $context->post ) ) {
		$post_types[] = $context->post->post_type;
	} elseif ( 'core/edit-site' === $context->name ) {
		if ( isset( $context->post ) ) {
			$post_types[] = $context->post->post_type;
		}
		$post_types = array_merge( $post_types, _gutenberg_get_site_editor_screen_post_types() );
	}

	foreach ( array_unique( $post_types ) as $post_type ) {
		if ( ! post_type_exists( $post_type ) ) {
			continue;
		}
		$paths[] = add_query_arg(
			array(
				'kind' => 'postType',
				'name' => $post_type,
			),
			'/wp/v2/fields'
		);
	}

	return $paths;
}
add_filter( 'block_editor_rest_api_preload_paths', '_gutenberg_preload_entity_fields', 10, 2 );

/**
 * Returns the fields of a field collection.
 *
 * A collection holds a folder per field, whose `field.php` returns the
 * serializable part of the field, see
 * {@see gutenberg_register_field_collection()}.
 *
 * @param string $directory The directory of the collection.
 * @return array<string, array> The fields of the collection, keyed by id, in
 *                              the alphabetical order of their folders. The
 *                              id of a field is the name of its folder,
 *                              unless its `field.php` sets an `id`, and it
 *                              comes first in the field.
 */
function gutenberg_get_field_collection_fields( $directory ) {
	$files = glob( $directory . '/*/field.php' );
	if ( empty( $files ) ) {
		return array();
	}
	sort( $files, SORT_STRING );

	$fields = array();
	foreach ( $files as $file ) {
		$field = require $file;
		if ( ! is_array( $field ) ) {
			continue;
		}
		// The id comes first, like in the fields registered directly.
		$field                  = array_merge( array( 'id' => basename( dirname( $file ) ) ), $field );
		$fields[ $field['id'] ] = $field;
	}

	return $fields;
}

/**
 * Checks whether a value is a support condition: the name of a support
 * (`'author'`), or a support and one of its arguments
 * (`array( 'editor', 'notes' )`).
 *
 * @param mixed $condition The value to check.
 * @return bool Whether the value is a support condition.
 */
function _gutenberg_is_field_support_condition( $condition ) {
	if ( is_string( $condition ) ) {
		return '' !== $condition;
	}

	return is_array( $condition )
		&& array( 0, 1 ) === array_keys( $condition )
		&& is_string( $condition[0] ) && '' !== $condition[0]
		&& is_string( $condition[1] ) && '' !== $condition[1];
}

/**
 * Checks whether a post type meets a support condition.
 *
 * A support name holds when the post type supports it. A support and
 * argument pair holds when the arguments of the support have a truthy value
 * for the argument: `'supports' => array( 'editor' => array( 'notes' => true ) )`
 * meets `array( 'editor', 'notes' )`. WordPress stores the arguments of a
 * support as a list of argument arrays, and a support without arguments as
 * `true`, which meets no pair.
 *
 * @param string          $post_type The post type.
 * @param string|string[] $condition The support condition.
 * @return bool Whether the post type meets the condition.
 */
function _gutenberg_post_type_meets_field_support( $post_type, $condition ) {
	if ( is_string( $condition ) ) {
		return post_type_supports( $post_type, $condition );
	}

	$arguments = get_all_post_type_supports( $post_type )[ $condition[0] ] ?? null;
	return is_array( $arguments ) && (bool) array_filter( array_column( $arguments, $condition[1] ) );
}

/**
 * Reads and validates a field collection, see
 * {@see gutenberg_register_field_collection()} for its format.
 *
 * An invalid configuration or field is reported with _doing_it_wrong(): the
 * collection or the field is skipped.
 *
 * @param string $directory The directory of the collection.
 * @return array|null The configuration of the collection, with the `module`
 *                    key set and its valid `fields` as a list, or null when
 *                    the configuration is invalid.
 */
function _gutenberg_get_field_collection( $directory ) {
	$slug   = basename( $directory );
	$file   = $directory . '/index.php';
	$config = is_file( $file ) ? require $file : null;
	$error  = null;

	if ( ! is_array( $config ) ) {
		$error = __( 'The `index.php` of a field collection must return an array.', 'gutenberg' );
	} elseif ( ! isset( $config['origin'] ) || ! is_string( $config['origin'] ) || '' === $config['origin'] ) {
		$error = __( 'The `origin` of a field collection must be a non-empty string.', 'gutenberg' );
	} elseif ( ! isset( $config['kind'] ) || ! is_string( $config['kind'] ) || '' === $config['kind'] ) {
		$error = __( 'The `kind` of a field collection must be a non-empty string.', 'gutenberg' );
	} elseif ( ! array_key_exists( 'name', $config ) || ( null !== $config['name'] && ( ! is_string( $config['name'] ) || '' === $config['name'] ) ) ) {
		$error = __( 'The `name` of a field collection must be a non-empty string, or null for every entity of the kind.', 'gutenberg' );
	} elseif ( null === $config['name'] && 'postType' !== $config['kind'] ) {
		$error = __( 'Only the `postType` kind supports field collections for every entity of the kind: the `name` must be a string.', 'gutenberg' );
	} elseif ( isset( $config['module'] ) && ( ! is_string( $config['module'] ) || '' === $config['module'] ) ) {
		$error = __( 'The `module` of a field collection must be the id of a script module.', 'gutenberg' );
	}

	if ( null !== $error ) {
		_doing_it_wrong(
			'gutenberg_register_field_collection',
			/* translators: 1: The name of a field collection. 2: The error. */
			sprintf( __( 'The field collection "%1$s" is skipped. %2$s', 'gutenberg' ), $slug, $error ),
			'7.2.0'
		);
		return null;
	}

	$universal = null === $config['name'];
	$fields    = array();
	foreach ( gutenberg_get_field_collection_fields( $directory ) as $id => $field ) {
		if ( $universal && ! _gutenberg_is_field_support_condition( $field['supports'] ?? null ) ) {
			$error = __( 'A field of a collection for every entity of the kind must set `supports` to a support name, or a support and argument pair.', 'gutenberg' );
		} elseif ( ! $universal && array_key_exists( 'supports', $field ) ) {
			$error = __( 'Only the fields of a collection for every entity of the kind can set `supports`.', 'gutenberg' );
		} else {
			$fields[] = $field;
			continue;
		}

		_doing_it_wrong(
			'gutenberg_register_field_collection',
			/* translators: 1: The id of a field. 2: The name of a field collection. 3: The error. */
			sprintf( __( 'The field "%1$s" of the collection "%2$s" is skipped. %3$s', 'gutenberg' ), $id, $slug, $error ),
			'7.2.0'
		);
	}

	return array_merge(
		$config,
		array(
			'module' => $config['module'] ?? null,
			'fields' => $fields,
		)
	);
}

/**
 * Returns the ids of the fields a post type does not get from a collection
 * for every post type, from the `fields_api_exclude_post_type_supports`
 * filter.
 *
 * @param string $post_type  The post type.
 * @param array  $collection The configuration of the collection, as
 *                           returned by {@see _gutenberg_get_field_collection()}.
 * @return true|string[] The ids of the excluded fields, or true for all of
 *                       them.
 */
function _gutenberg_get_excluded_post_type_supports( $post_type, $collection ) {
	unset( $collection['fields'] );

	/**
	 * Filters the fields a post type does not get from the field collections
	 * for every post type, whose fields derive from the supports of each post
	 * type (like the default `author`, `comment_status`, and `notesCount`
	 * fields).
	 *
	 * A post type whose fields differ from the defaults opts out of some or
	 * all of them here, and registers its own if needed: the registry
	 * refuses a field registered twice for the same entity. Callbacks
	 * compose: add to the incoming list rather than replacing it, and keep
	 * `true` when it comes in.
	 *
	 * The filter runs when the registry fires `fields_api_init`, on its first
	 * read after `init`: add callbacks on plugin load or on `init`, not
	 * later.
	 *
	 * @since 7.2.0
	 *
	 * @param true|string[] $excluded   The ids of the fields the post type does
	 *                                  not get from the collection, or true
	 *                                  for all of them. Default empty array.
	 * @param string        $post_type  The post type.
	 * @param array         $collection {
	 *     The configuration of the collection, as its `index.php` returns it.
	 *
	 *     @type string      $origin Who registers the fields of the collection.
	 *     @type string      $kind   The entity kind, `postType`.
	 *     @type null        $name   The entity name, null for every post type.
	 *     @type string|null $module The id of the script module of the
	 *                               collection, if any.
	 * }
	 */
	$excluded = apply_filters( 'fields_api_exclude_post_type_supports', array(), $post_type, $collection );

	if ( true === $excluded || ( is_array( $excluded ) && array_is_list( $excluded ) && count( array_filter( $excluded, 'is_string' ) ) === count( $excluded ) ) ) {
		return $excluded;
	}

	_doing_it_wrong(
		'gutenberg_register_field_collection',
		sprintf(
			/* translators: 1: The name of a filter. 2: A post type. */
			__( 'The %1$s filter must return true, or a list of field ids. Nothing is excluded for the post type "%2$s".', 'gutenberg' ),
			'<code>fields_api_exclude_post_type_supports</code>',
			$post_type
		),
		'7.2.0'
	);
	return array();
}

/**
 * Registers the fields of a field collection.
 *
 * A collection is a folder whose `index.php` returns its configuration, with
 * a folder per field whose `field.php` returns the serializable part of the
 * field (see {@see gutenberg_get_field_collection_fields()}). The
 * JavaScript parts of the fields, if any, ship in the script module of the
 * collection. The configuration is an array with these keys:
 *
 * - `origin` (required): who registers the fields: `core`, or the slug of
 *   the plugin or theme. See {@see Gutenberg_Fields_Registry::register()}.
 * - `kind` (required): the entity kind, e.g. `postType`.
 * - `name` (required, may be null): the entity name, e.g. `wp_template`.
 *   Null makes the collection apply to every entity of the kind, which only
 *   the `postType` kind supports: every post type exposed in the REST API.
 *   Each field of such a collection declares, as its `supports`, the
 *   support condition a post type must meet to get it: a support name
 *   (`'author'`), or a support and one of its arguments
 *   (`array( 'editor', 'notes' )`). The fields of a collection for a single
 *   entity do not set it.
 * - `module` (optional): the id of the script module providing the
 *   JavaScript parts of the fields. Every field of the collection is
 *   registered with it.
 *
 * A collection for a single entity registers its fields on it. A
 * collection for a post type that does not exist or is not exposed in the
 * REST API registers nothing.
 *
 * A collection for every post type registers, on each post type exposed in
 * the REST API, the fields whose `supports` condition the post type meets,
 * minus those the `fields_api_exclude_post_type_supports` filter excludes
 * for it. The `supports` of a field only decides where it applies: it is
 * not registered.
 *
 * The fields keep the alphabetical order of their folders, and follow the
 * fields registered on the entity before. There is no precedence between
 * collections: the registry refuses a field registered twice for an entity,
 * so a collection redefining a field of a collection for every post type
 * needs the post type to exclude it with the filter.
 *
 * It must be called on the `fields_api_init` action, with the registry its
 * callbacks receive. The fields of the post types depend on their supports,
 * which are final once `init` has completed, when the action fires.
 *
 * An invalid configuration or field, and an invalid value of the filter,
 * are reported with _doing_it_wrong() and skipped.
 *
 * @since 7.2.0
 *
 * @param Gutenberg_Fields_Registry $registry  The registry, as received by
 *                                             the `fields_api_init` action.
 * @param string                    $directory The directory of the
 *                                             collection.
 * @return bool Whether the collection is valid and the registry accepted
 *              all of its fields. True as well when no fields applied.
 */
function gutenberg_register_field_collection( $registry, $directory ) {
	if ( ! $registry instanceof Gutenberg_Fields_Registry ) {
		_doing_it_wrong(
			__FUNCTION__,
			__( 'Field collections are registered on the registry the `fields_api_init` action passes to its callbacks.', 'gutenberg' ),
			'7.2.0'
		);
		return false;
	}

	$collection = _gutenberg_get_field_collection( $directory );
	if ( null === $collection ) {
		return false;
	}
	if ( empty( $collection['fields'] ) ) {
		return true;
	}

	$post_types = get_post_types( array( 'show_in_rest' => true ) );

	if ( null !== $collection['name'] ) {
		// Like the collections for every post type, only the post types
		// exposed in the REST API.
		if ( 'postType' === $collection['kind'] && ! in_array( $collection['name'], $post_types, true ) ) {
			return true;
		}
		return $registry->register( $collection['origin'], $collection['kind'], $collection['name'], $collection['fields'], $collection['module'] );
	}

	$registered = true;
	foreach ( $post_types as $post_type ) {
		$excluded = _gutenberg_get_excluded_post_type_supports( $post_type, $collection );
		if ( true === $excluded ) {
			continue;
		}

		$fields = array();
		foreach ( $collection['fields'] as $field ) {
			if ( in_array( $field['id'], $excluded, true ) || ! _gutenberg_post_type_meets_field_support( $post_type, $field['supports'] ) ) {
				continue;
			}
			unset( $field['supports'] );
			$fields[] = $field;
		}

		if ( ! empty( $fields ) ) {
			$registered = $registry->register( $collection['origin'], 'postType', $post_type, $fields, $collection['module'] ) && $registered;
		}
	}

	return $registered;
}

/**
 * Returns the collections of the fields WordPress core registers.
 *
 * The collections are in packages/core-fields/src, copied as they are to
 * build/scripts/core-fields by the build. A collection is a folder whose
 * `index.php` returns its configuration, with a folder per field whose
 * `field.php` returns the serializable part of the field (see
 * {@see gutenberg_get_field_collection_fields()}). The JavaScript parts of
 * the fields, if any, are in `<field>/field.tsx`, and the `index.ts` of the
 * collection gathers them in its script module.
 *
 * The configuration of a collection is an array with these keys:
 *
 * - `origin` (required): who registers the fields, `core` for the core
 *   collections. See {@see Gutenberg_Fields_Registry::register()}.
 * - `kind` (required): the entity kind, e.g. `postType`.
 * - `name` (required, may be null): the entity name, e.g. `wp_template`.
 *   Null makes the collection apply to every entity of the kind, which only
 *   the `postType` kind supports: every post type exposed in the REST API.
 *   Each field of such a collection declares, as its `supports`, the
 *   support condition a post type must meet to get it: a support name
 *   (`'author'`), or a support and one of its arguments
 *   (`array( 'editor', 'notes' )`).
 * - `module` (optional): the id of the script module providing the
 *   JavaScript parts of the fields. Every field of the collection is
 *   registered with it.
 * - `exclude_supports` (optional, only for a collection of a single post
 *   type): the fields of the collections of every post type the post type
 *   does not get, as the list of their `supports`, matched exactly
 *   (`'editor'` does not exclude `array( 'editor', 'notes' )`), or `true`
 *   for all of them.
 *
 * An invalid configuration or field is reported with _doing_it_wrong() and
 * skipped.
 *
 * @param string $directory The directory of the collections.
 * @return array[] The valid configurations, in the alphabetical order of
 *                 their folders, each with its valid `fields` as a list,
 *                 and the `module` and `exclude_supports` keys set.
 */
function _gutenberg_get_field_collections( $directory ) {
	$files = glob( $directory . '/*/index.php' );
	if ( empty( $files ) ) {
		return array();
	}
	sort( $files, SORT_STRING );

	$collections = array();
	foreach ( $files as $file ) {
		$slug   = basename( dirname( $file ) );
		$config = require $file;
		$error  = null;

		if ( ! is_array( $config ) ) {
			$error = __( 'The `index.php` of a field collection must return an array.', 'gutenberg' );
		} elseif ( ! isset( $config['origin'] ) || ! is_string( $config['origin'] ) || '' === $config['origin'] ) {
			$error = __( 'The `origin` of a field collection must be a non-empty string.', 'gutenberg' );
		} elseif ( ! isset( $config['kind'] ) || ! is_string( $config['kind'] ) || '' === $config['kind'] ) {
			$error = __( 'The `kind` of a field collection must be a non-empty string.', 'gutenberg' );
		} elseif ( ! array_key_exists( 'name', $config ) || ( null !== $config['name'] && ( ! is_string( $config['name'] ) || '' === $config['name'] ) ) ) {
			$error = __( 'The `name` of a field collection must be a non-empty string, or null for every entity of the kind.', 'gutenberg' );
		} elseif ( null === $config['name'] && 'postType' !== $config['kind'] ) {
			$error = __( 'Only the `postType` kind supports field collections for every entity of the kind: the `name` must be a string.', 'gutenberg' );
		} elseif ( isset( $config['module'] ) && ( ! is_string( $config['module'] ) || '' === $config['module'] ) ) {
			$error = __( 'The `module` of a field collection must be the id of a script module.', 'gutenberg' );
		} elseif ( isset( $config['exclude_supports'] ) ) {
			$exclude = $config['exclude_supports'];
			if ( null === $config['name'] ) {
				$error = __( 'Only a field collection of a single entity can set `exclude_supports`.', 'gutenberg' );
			} elseif ( true !== $exclude && ( ! is_array( $exclude ) || ! array_is_list( $exclude ) || count( array_filter( $exclude, '_gutenberg_is_field_support_condition' ) ) !== count( $exclude ) ) ) {
				$error = __( 'The `exclude_supports` of a field collection must be true, or a list of support names and of support and argument pairs.', 'gutenberg' );
			}
		}

		if ( null !== $error ) {
			_doing_it_wrong(
				__FUNCTION__,
				/* translators: 1: The name of a field collection. 2: The error. */
				sprintf( __( 'The field collection "%1$s" is skipped. %2$s', 'gutenberg' ), $slug, $error ),
				'7.2.0'
			);
			continue;
		}

		$fields = array();
		foreach ( gutenberg_get_field_collection_fields( dirname( $file ) ) as $id => $field ) {
			$universal = null === $config['name'];
			if ( $universal && ! _gutenberg_is_field_support_condition( $field['supports'] ?? null ) ) {
				$error = __( 'A field of a collection for every entity of the kind must set `supports` to a support name, or a support and argument pair.', 'gutenberg' );
			} elseif ( ! $universal && array_key_exists( 'supports', $field ) ) {
				$error = __( 'Only the fields of a collection for every entity of the kind can set `supports`.', 'gutenberg' );
			} else {
				$fields[] = $field;
				continue;
			}

			_doing_it_wrong(
				__FUNCTION__,
				/* translators: 1: The id of a field. 2: The name of a field collection. 3: The error. */
				sprintf( __( 'The field "%1$s" of the collection "%2$s" is skipped. %3$s', 'gutenberg' ), $id, $slug, $error ),
				'7.2.0'
			);
		}

		$collections[] = array_merge(
			$config,
			array(
				'module'           => $config['module'] ?? null,
				'exclude_supports' => $config['exclude_supports'] ?? array(),
				'fields'           => $fields,
			)
		);
	}

	return $collections;
}

/**
 * Registers the fields of the collections of the fields WordPress core
 * registers, see {@see _gutenberg_get_field_collections()} for their format.
 *
 * The fields of the post types depend on their supports, which are not final
 * until `init` completes, hence the `fields_api_init` action, which the
 * registry fires on its first read, after `init`. At priority 0, so a plugin
 * hooking the action at the default priority sees the core fields
 * registered.
 *
 * Each post type exposed in the REST API gets, in this order:
 *
 * 1. The fields of the collections of every post type (`name` null) whose
 *    `supports` condition it meets, except those whose `supports` the
 *    collections of the post type exclude.
 * 2. The fields of the collections of the post type.
 *
 * Collections of the same step follow the alphabetical order of their
 * folders, and the fields of a collection that of theirs. The `supports` of
 * a field only decides where it applies: it is not registered.
 *
 * There is no precedence between collections: a collection that redefines a
 * field of the collections of every post type must exclude its `supports`,
 * or the registry refuses its fields as it refuses any field registered
 * twice.
 *
 * When called by the `fields_api_init` action, the collections are the ones
 * the build copies to build/scripts/core-fields. In other scenarios (tests),
 * the directory is given directly.
 *
 * @param Gutenberg_Fields_Registry $registry  The registry being read.
 * @param string|null               $directory The directory of the
 *                                             collections. Defaults to the
 *                                             built core collections.
 */
function _gutenberg_register_core_field_collections( $registry, $directory = null ) {
	if ( null === $directory ) {
		$directory = __DIR__ . '/../../../build/scripts/core-fields';
	}
	if ( ! is_dir( $directory ) ) {
		return;
	}

	$universal = array();
	$entities  = array();
	foreach ( _gutenberg_get_field_collections( $directory ) as $collection ) {
		if ( null === $collection['name'] ) {
			$universal[] = $collection;
		} else {
			$entities[] = $collection;
		}
	}

	$post_types = get_post_types( array( 'show_in_rest' => true ) );

	foreach ( $universal as $collection ) {
		foreach ( $post_types as $post_type ) {
			$excluded = array();
			foreach ( $entities as $entity ) {
				if ( 'postType' !== $entity['kind'] || $post_type !== $entity['name'] ) {
					continue;
				}
				if ( true === $entity['exclude_supports'] ) {
					// No field of the collections of every post type applies.
					continue 2;
				}
				$excluded = array_merge( $excluded, $entity['exclude_supports'] );
			}

			$fields = array();
			foreach ( $collection['fields'] as $field ) {
				if ( in_array( $field['supports'], $excluded, true ) || ! _gutenberg_post_type_meets_field_support( $post_type, $field['supports'] ) ) {
					continue;
				}
				unset( $field['supports'] );
				$fields[] = $field;
			}

			if ( ! empty( $fields ) ) {
				$registry->register( $collection['origin'], 'postType', $post_type, $fields, $collection['module'] );
			}
		}
	}

	foreach ( $entities as $collection ) {
		// Like the collections of every post type, only the post types
		// exposed in the REST API.
		if ( 'postType' === $collection['kind'] && ! in_array( $collection['name'], $post_types, true ) ) {
			continue;
		}
		if ( ! empty( $collection['fields'] ) ) {
			$registry->register( $collection['origin'], $collection['kind'], $collection['name'], $collection['fields'], $collection['module'] );
		}
	}
}
add_action( 'fields_api_init', '_gutenberg_register_core_field_collections', 0 );
