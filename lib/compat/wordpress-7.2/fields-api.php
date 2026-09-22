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
 *                 order.
 */
function gutenberg_get_registered_fields( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered( $kind, $name );
}

/**
 * Returns the ids of the script modules registered for the given entity.
 *
 * @param string $kind The entity kind (e.g. `postType`).
 * @param string $name The entity name (e.g. `page`).
 * @return string[] The module ids, unique and in registration order.
 */
function gutenberg_get_registered_field_modules( $kind, $name ) {
	return Gutenberg_Fields_Registry::get_instance()->get_registered_field_modules( $kind, $name );
}

/**
 * Returns the ids of all script modules registered for any entity.
 *
 * @return string[] The module ids, unique and in registration order.
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
 * It runs early on `admin_init`: after `init`, so the fields and their script
 * modules are registered, and before the pages rendered outside the admin
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

	// TODO:
	// Field registration as well as actions live in packages/editor/src/dataviews/store/private-actions.ts
	// which means any screen that wants to use this mechanism needs to load the editor script.
	// This is fine for our current use cases (site editor, post editor), but regular wp-admin screens
	// that want to use the fields API will need to load the editor script as well, which is not ideal.
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
 * Whether a post type supports editor notes.
 *
 * Notes are declared as an argument of the `editor` support, e.g.
 * `'supports' => array( 'editor' => array( 'notes' => true ) )`, which
 * WordPress stores as a list of argument arrays.
 *
 * @param string $post_type The post type.
 * @return bool Whether the post type supports editor notes.
 */
function _gutenberg_post_type_supports_notes( $post_type ) {
	$supports = get_all_post_type_supports( $post_type );

	if ( ! isset( $supports['editor'] ) || ! is_array( $supports['editor'] ) ) {
		return false;
	}

	foreach ( $supports['editor'] as $args ) {
		if ( is_array( $args ) && ! empty( $args['notes'] ) ) {
			return true;
		}
	}

	return false;
}

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
 * The fields depend on the supports of the post type, hence it runs late on
 * `init`: after the post types registered at the default priority. A plugin
 * that wants to alter the defaults with gutenberg_register_fields() or
 * gutenberg_unregister_fields() hooks `init` at a later priority.
 *
 * The post types whose fields differ from the defaults derived from their
 * supports (templates, attachments) adjust them in their own step, hooked
 * right after this one.
 */
function _gutenberg_register_posttype_fields() {
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

		if ( _gutenberg_post_type_supports_notes( $post_type ) ) {
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

/**
 * Core post types registered on `init` at 0 priority,
 * see https://github.com/oandregal/wordpress-develop/blob/b528aeff3b96f089993c17f6dfb3d7aa96433a8b/src/wp-includes/default-filters.php#L592
 * Custom Post Types are usually registered on `init` at the default priority (10).
 *
 * Even though core registers/unregisters most supports at the same time as post type registration,
 * some are changed later, see https://github.com/oandregal/wordpress-develop/blob/b528aeff3b96f089993c17f6dfb3d7aa96433a8b/src/wp-admin/includes/admin-filters.php#L89
 *
 * Alternatively, we could have registered the fields upon post type registration (`register_post_type` hook),
 * but we risk not having the right supports (because they are registered/unregistered later).
 */
add_action( 'init', '_gutenberg_register_posttype_fields', 99 );

/**
 * Adjusts the default fields of templates.
 *
 * Templates support authors, so they get the default author field like any
 * other post type. Yet they have their own author field, declared
 * client-side in packages/fields/src/fields/template-author/index.tsx, which
 * reads the theme or plugin that provides them instead of the post author.
 *
 * It runs right after the default fields are registered, on `init` at
 * priority 100, so a plugin hooking `init` later still sees the final
 * defaults.
 */
function _gutenberg_register_wp_template_fields() {
	gutenberg_unregister_fields( 'postType', 'wp_template', array( 'author' ) );
}
add_action( 'init', '_gutenberg_register_wp_template_fields', 100 );

/**
 * Adjusts the default fields of template parts.
 *
 * Template parts support authors, so they get the default author field like
 * any other post type. Yet they have their own author field, declared
 * client-side in packages/fields/src/fields/template-author/index.tsx, which
 * reads the theme or plugin that provides them instead of the post author.
 *
 * It runs right after the default fields are registered, on `init` at
 * priority 100, so a plugin hooking `init` later still sees the final
 * defaults.
 */
function _gutenberg_register_wp_template_part_fields() {
	gutenberg_unregister_fields( 'postType', 'wp_template_part', array( 'author' ) );
}
add_action( 'init', '_gutenberg_register_wp_template_part_fields', 100 );

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
 * It runs right after the default fields are registered, on `init` at
 * priority 100, so a plugin hooking `init` later still sees the final
 * defaults.
 */
function _gutenberg_register_attachment_fields() {
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
add_action( 'init', '_gutenberg_register_attachment_fields', 100 );
