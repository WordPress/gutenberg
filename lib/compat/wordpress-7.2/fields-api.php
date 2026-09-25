<?php
/**
 * Entity fields API.
 *
 * A field definition is the serializable subset of the DataViews Field API:
 * every property that is plain data (`id`, `type`, `label`, `elements`,
 * `filterBy`, `isValid`, …). Properties that are JavaScript callbacks or
 * components (`render`, `Edit` as a component, `getValue`, `setValue`,
 * `sort`, `isVisible`, `getElements`, …) cannot be declared here. They are
 * provided by a script module registered for the entity along with its
 * fields: its default export maps field ids to the properties of each field
 * that are JavaScript. An entity can have several modules. Each module applies to
 * the fields it was registered with, see gutenberg_get_registered_field_modules().
 *
 * @package gutenberg
 */

/**
 * Registers fields for the given entity.
 *
 * @param string      $kind          The entity kind (e.g. `postType`).
 * @param string      $name          The entity name (e.g. `page`).
 * @param array[]     $fields        The list of field definitions.
 * @param string|null $script_module Optional. The id of the script module
 *                                   providing the JavaScript parts of the
 *                                   fields (e.g. `my-plugin/page-fields`),
 *                                   registered with
 *                                   wp_register_script_module().
 * @return bool Whether the fields were registered. False when an argument is
 *              invalid, in which case none of the fields is registered.
 */
function gutenberg_register_fields( $kind, $name, $fields, $script_module = null ) {
	return Gutenberg_Fields_Registry::get_instance()->register( $kind, $name, $fields, $script_module );
}

/**
 * Unregisters fields of the given entity.
 *
 * Without ids, the entity is reset and it no longer has any field or script modules registered.
 *
 * @param string        $kind The entity kind (e.g. `postType`).
 * @param string        $name The entity name (e.g. `page`).
 * @param string[]|null $ids  The ids of the fields to unregister. Default
 *                            null, every field of the entity.
 * @return bool Whether any field was unregistered.
 */
function gutenberg_unregister_fields( $kind, $name, $ids = null ) {
	return Gutenberg_Fields_Registry::get_instance()->unregister( $kind, $name, $ids );
}

/**
 * Returns the fields registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array[] The list of registered field definitions, in registration
 *                 order. Empty before the `init` action has run, when the
 *                 registry does not exist yet.
 */
function gutenberg_get_registered_fields( $kind, $name ) {
	$registry = Gutenberg_Fields_Registry::get_instance();
	if ( null === $registry ) {
		return array();
	}

	return $registry->get_registered( $kind, $name );
}

/**
 * Returns the ids of the script modules registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return array<string, string[]> The ids of the fields each module applies
 *                                 to, keyed by module id, in registration
 *                                 order. Empty before the `init` action has
 *                                 run, when the registry does not exist yet.
 */
function gutenberg_get_registered_field_modules( $kind, $name ) {
	$registry = Gutenberg_Fields_Registry::get_instance();
	if ( null === $registry ) {
		return array();
	}

	return $registry->get_registered_field_modules( $kind, $name );
}

/**
 * Returns the ids of all script modules registered for any entity.
 *
 * @return array<string, string[]> The lists of module ids, keyed by
 *                                 `{$kind}/{$name}`. Empty before the `init`
 *                                 action has run, when the registry does not
 *                                 exist yet.
 */
function gutenberg_get_all_registered_field_modules() {
	$registry = Gutenberg_Fields_Registry::get_instance();
	if ( null === $registry ) {
		return array();
	}

	return $registry->get_all_registered_field_modules();
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
 * Reading the registry fires `gutenberg_fields_api_init`, so the fields and their
 * script modules are registered on demand. It still has to run after `init`,
 * for the supports the default fields derive from to be final, and it runs
 * early on `admin_init`: before the pages rendered outside the admin
 * template, which render and exit on `admin_init` at the default priority.
 * A field registered later is not covered.
 *
 * When called by the `admin_init` action, which passes no arguments,
 * `$scripts` is an empty string and the global registry is used.
 * In other scenarios (tests), the scripts are given directly.
 *
 * @param WP_Scripts|null $scripts The scripts registry. Defaults to the global one.
 */
function _gutenberg_add_field_modules_to_editor_script( $scripts = null ) {
	if ( ! $scripts instanceof WP_Scripts ) {
		$scripts = wp_scripts();
	}

	// Field registration as well as actions live in packages/editor/src/dataviews/store/private-actions.ts
	// which means any screen that wants to use this mechanism needs to load the editor script.
	if ( ! $scripts->query( 'wp-editor', 'registered' ) ) {
		return;
	}

	$entities = gutenberg_get_all_registered_field_modules();
	if ( empty( $entities ) ) {
		return;
	}

	$dependencies = $scripts->get_data( 'wp-editor', 'module_dependencies' );
	$dependencies = is_array( $dependencies ) ? $dependencies : array();

	$declared = array();
	foreach ( $dependencies as $dependency ) {
		$declared[] = is_array( $dependency ) ? $dependency['id'] : $dependency;
	}

	$added = false;
	foreach ( $entities as $modules ) {
		foreach ( $modules as $module ) {
			if ( ! in_array( $module, $declared, true ) ) {
				$dependencies[] = array(
					'id'      => $module,
					'dynamic' => true,
				);
				$declared[]     = $module;
				$added          = true;
			}
		}
	}

	if ( $added ) {
		// `add_data()` replaces the value, hence the merge above.
		$scripts->add_data( 'wp-editor', 'module_dependencies', $dependencies );
	}
}
add_action( 'admin_init', '_gutenberg_add_field_modules_to_editor_script', 5 );

/**
 * Registers the default fields of every post type exposed in the REST API.
 *
 * These are the fields ported to the server so far; the editor still derives
 * the rest client-side in packages/editor/src/dataviews/store/private-actions.ts
 * and merges these into them. The JavaScript parts of the fields that have
 * any (the author field: its render component, elements, value setter, and
 * visibility) ship in the `@wordpress/fields/server-fields` script module,
 * see packages/fields/src/server-fields.ts, registered along with the field.
 *
 * The fields depend on the supports of the post type, which are not final
 * until `init` completes: core registers its post types on `init` at
 * priority 0, see
 * https://github.com/WordPress/wordpress-develop/blob/b528aeff3b96f089993c17f6dfb3d7aa96433a8b/src/wp-includes/default-filters.php#L592,
 * custom post types are usually registered at the default priority (10),
 * and plugins add or remove supports on `init` too, with
 * add_post_type_support() and remove_post_type_support(). Hence it runs on
 * `gutenberg_fields_api_init`, which the registry fires on its first read, after
 * `init`: while handling a REST request, or on `admin_init` when the editor
 * script is wired up. At priority 0, so a plugin altering the defaults with
 * gutenberg_register_fields() or gutenberg_unregister_fields() at the
 * default priority sees them registered.
 *
 * The post types whose fields differ from the defaults derived from their
 * supports (templates, attachments) adjust them in their own step, hooked
 * to the same action at priority 9, right after this one.
 */
function _gutenberg_register_posttype_supports_fields() {
	$post_types = get_post_types( array( 'show_in_rest' => true ) );
	foreach ( $post_types as $post_type ) {
		if ( post_type_supports( $post_type, 'author' ) ) {
			// packages/fields/src/fields/author/index.tsx: `render`,
			// `getElements`, `setValue`, and `isVisible` come from the script
			// module.
			gutenberg_register_fields(
				'postType',
				$post_type,
				array(
					array(
						'id'       => 'author',
						'type'     => 'integer',
						'label'    => __( 'Author', 'gutenberg' ),
						'filterBy' => array(
							'operators' => array( 'isAny', 'isNone' ),
						),
					),
				),
				'@wordpress/fields/server-fields'
			);
		}

		// The remaining default fields are plain data: no script module.
		$fields = array();

		if ( post_type_supports( $post_type, 'comments' ) ) {
			// packages/fields/src/fields/comment-status/index.tsx
			$fields[] = array(
				'id'            => 'comment_status',
				'type'          => 'text',
				'label'         => __( 'Comments', 'gutenberg' ),
				'Edit'          => 'radio',
				'enableSorting' => false,
				'enableHiding'  => false,
				'filterBy'      => false,
				'elements'      => array(
					array(
						'value'       => 'open',
						'label'       => __( 'Open', 'gutenberg' ),
						'description' => __( 'Visitors can add new comments and replies.', 'gutenberg' ),
					),
					array(
						'value'       => 'closed',
						'label'       => __( 'Closed', 'gutenberg' ),
						'description' => __( 'Visitors cannot add new comments or replies. Existing comments remain visible.', 'gutenberg' ),
					),
				),
			);
		}

		// Notes are declared as an argument of the `editor` support, e.g.
		// `'supports' => array( 'editor' => array( 'notes' => true ) )`, which
		// WordPress stores as a list of argument arrays. A bare `editor`
		// support is stored as `true`, hence the array check.
		$editor_args = get_all_post_type_supports( $post_type )['editor'] ?? null;
		if ( is_array( $editor_args ) && array_filter( array_column( $editor_args, 'notes' ) ) ) {
			// packages/fields/src/fields/notes/index.tsx
			$fields[] = array(
				'id'            => 'notesCount',
				'type'          => 'integer',
				'label'         => __( 'Notes', 'gutenberg' ),
				'enableSorting' => false,
				'filterBy'      => false,
			);
		}

		if ( empty( $fields ) ) {
			continue;
		}

		gutenberg_register_fields( 'postType', $post_type, $fields );
	}
}
add_action( 'gutenberg_fields_api_init', '_gutenberg_register_posttype_supports_fields', 0 );

/**
 * Adjusts the default fields of templates.
 *
 * Templates support authors, so they get the default author field like any
 * other post type. Yet they have their own author field, declared
 * client-side in packages/fields/src/fields/template-author/index.tsx, which
 * reads the theme or plugin that provides them instead of the post author.
 *
 * It runs right after the default fields are registered, on
 * `gutenberg_fields_api_init` at priority 9, so a plugin hooking the action at
 * the default priority sees the final defaults.
 */
function _gutenberg_register_posttype_wp_template_fields() {
	gutenberg_unregister_fields( 'postType', 'wp_template', array( 'author' ) );
}
add_action( 'gutenberg_fields_api_init', '_gutenberg_register_posttype_wp_template_fields', 9 );

/**
 * Adjusts the default fields of template parts.
 *
 * Template parts support authors, so they get the default author field like
 * any other post type. Yet they have their own author field, declared
 * client-side in packages/fields/src/fields/template-author/index.tsx, which
 * reads the theme or plugin that provides them instead of the post author.
 *
 * It runs right after the default fields are registered, on
 * `gutenberg_fields_api_init` at priority 9, so a plugin hooking the action at
 * the default priority sees the final defaults.
 */
function _gutenberg_register_posttype_wp_template_part_fields() {
	gutenberg_unregister_fields( 'postType', 'wp_template_part', array( 'author' ) );
}
add_action( 'gutenberg_fields_api_init', '_gutenberg_register_posttype_wp_template_part_fields', 9 );

/**
 * Replaces the default fields of attachments with the media fields.
 *
 * Attachments support authors and comments, so they get the default author
 * and comment status fields like any other post type. Yet the media editor
 * shows its own set of fields, declared client-side in
 * packages/media-fields/src, none of which is a default one. The default
 * fields are dropped and the media fields ported to the server so far are
 * registered instead.
 *
 * It runs right after the default fields are registered, on
 * `gutenberg_fields_api_init` at priority 9, so a plugin hooking the action at
 * the default priority sees the final defaults.
 */
function _gutenberg_register_posttype_attachment_fields() {
	$post_type = get_post_type_object( 'attachment' );
	if ( ! $post_type || ! $post_type->show_in_rest ) {
		return;
	}

	// Remove all default fields registered for postType attachment.
	gutenberg_unregister_fields( 'postType', 'attachment' );
	gutenberg_register_fields(
		'postType',
		'attachment',
		array(
			// packages/media-fields/src/date_added/index.tsx
			array(
				'id'       => 'date',
				'type'     => 'datetime',
				'label'    => __( 'Date added', 'gutenberg' ),
				'filterBy' => array(
					'operators' => array( 'before', 'after' ),
				),
				'readOnly' => true,
			),
		)
	);
}
add_action( 'gutenberg_fields_api_init', '_gutenberg_register_posttype_attachment_fields', 9 );
