<?php
/**
 * Registers the actions of WordPress core through the Entity actions API, like
 * a plugin registers its own.
 *
 * The data of each action is declared here; its JavaScript parts (callbacks,
 * modals, eligibility checks, icons) are in the `action.tsx` of the action, in
 * the script module of its folder.
 *
 * @package WordPress
 */

/**
 * Returns the definitions of the actions of WordPress core, in the order the
 * lists of items show them.
 *
 * @since 7.2.0
 *
 * @return array<string, array> The definitions, keyed by action id, each with
 *                              the id of the script module that provides its
 *                              JavaScript parts as `module`.
 */
function wp_get_core_action_definitions() {
	$defaults      = '@wordpress/core-actions/post_type_supports';
	$patterns      = '@wordpress/core-actions/wp_block';
	$template_part = '@wordpress/core-actions/wp_template_part';

	return array(
		'view-post'               => array(
			'module'     => $defaults,
			'definition' => array(
				'label'     => _x( 'View', 'verb', 'gutenberg' ),
				'isPrimary' => true,
			),
		),
		// Its label depends on the items, so it comes from the script module.
		'view-post-revisions'     => array(
			'module'     => $defaults,
			'definition' => array(
				'context' => 'list',
			),
		),
		'duplicate-post'          => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => _x( 'Duplicate…', 'action label', 'gutenberg' ),
				'modalHeader'       => _x( 'Duplicate', 'action label', 'gutenberg' ),
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'duplicate-template-part' => array(
			'module'     => $template_part,
			'definition' => array(
				'label'             => _x( 'Duplicate…', 'action label', 'gutenberg' ),
				'modalHeader'       => _x( 'Duplicate template part', 'action label', 'gutenberg' ),
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'duplicate-pattern'       => array(
			'module'     => $patterns,
			'definition' => array(
				'label'             => _x( 'Duplicate…', 'action label', 'gutenberg' ),
				'modalHeader'       => _x( 'Duplicate pattern', 'action label', 'gutenberg' ),
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'rename-post'             => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => __( 'Rename…', 'gutenberg' ),
				'modalHeader'       => __( 'Rename', 'gutenberg' ),
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'order-pages'             => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => __( 'Order…', 'gutenberg' ),
				'modalHeader'       => __( 'Order', 'gutenberg' ),
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'export-pattern'          => array(
			'module'     => $patterns,
			'definition' => array(
				'label'        => __( 'Export as JSON', 'gutenberg' ),
				'supportsBulk' => true,
			),
		),
		'restore'                 => array(
			'module'     => $defaults,
			'definition' => array(
				'label'        => __( 'Restore', 'gutenberg' ),
				'isPrimary'    => true,
				'supportsBulk' => true,
			),
		),
		'reset-post'              => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => __( 'Reset…', 'gutenberg' ),
				'supportsBulk'      => true,
				'hideModalHeader'   => true,
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'delete-post'             => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => __( 'Delete…', 'gutenberg' ),
				'isPrimary'         => true,
				'supportsBulk'      => true,
				'hideModalHeader'   => true,
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'move-to-trash'           => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => _x( 'Trash…', 'verb', 'gutenberg' ),
				'isPrimary'         => true,
				'supportsBulk'      => true,
				'hideModalHeader'   => true,
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
		'permanently-delete'      => array(
			'module'     => $defaults,
			'definition' => array(
				'label'             => __( 'Permanently delete…', 'gutenberg' ),
				'supportsBulk'      => true,
				'hideModalHeader'   => true,
				'modalFocusOnMount' => 'firstContentElement',
			),
		),
	);
}

/**
 * Registers the actions of WordPress core on each post type exposed in the
 * REST API, from what it supports and what the current user can do:
 *
 * - `view-post`, for the viewable post types.
 * - `view-post-revisions`, for the post types supporting `revisions`.
 * - `duplicate-post`, for the post types the user can create, except
 *   templates, template parts, and patterns.
 * - `duplicate-template-part`, for template parts, when the user can create
 *   them and the theme is a block theme.
 * - `duplicate-pattern`, for patterns, when the user can create them.
 * - `rename-post`, for the post types supporting `title`.
 * - `order-pages`, for the post types supporting `page-attributes`.
 * - `export-pattern`, for patterns.
 * - `restore`, `reset-post`, `delete-post`, `move-to-trash`, and
 *   `permanently-delete`, for every post type. Each one checks which posts it
 *   applies to.
 *
 * The actions of a post type are registered in the order of
 * wp_get_core_action_definitions(): each run of consecutive actions with the
 * same script module is a registration of its own, and a registration adds
 * its actions after the ones registered before.
 *
 * Hooked at priority 0, so a plugin hooking `wp_entity_actions_api_init` at
 * the default priority sees the core actions registered, and can unregister
 * them.
 *
 * @since 7.2.0
 */
function wp_register_core_actions() {
	$definitions = wp_get_core_action_definitions();

	foreach ( get_post_types( array( 'show_in_rest' => true ), 'objects' ) as $post_type ) {
		$slug       = $post_type->name;
		$can_create = current_user_can( $post_type->cap->create_posts );

		$applies = array(
			'view-post'               => is_post_type_viewable( $post_type ),
			'view-post-revisions'     => post_type_supports( $slug, 'revisions' ),
			'duplicate-post'          => $can_create && ! in_array( $slug, array( 'wp_block', 'wp_template_part', 'wp_template' ), true ),
			'duplicate-template-part' => $can_create && 'wp_template_part' === $slug && wp_is_block_theme(),
			'duplicate-pattern'       => $can_create && 'wp_block' === $slug,
			'rename-post'             => post_type_supports( $slug, 'title' ),
			'order-pages'             => post_type_supports( $slug, 'page-attributes' ),
			'export-pattern'          => 'wp_block' === $slug,
			'restore'                 => true,
			'reset-post'              => true,
			'delete-post'             => true,
			'move-to-trash'           => true,
			'permanently-delete'      => true,
		);

		// Groups the consecutive actions of the same script module, keeping
		// the order of the definitions.
		$runs = array();
		foreach ( array_intersect_key( $definitions, array_filter( $applies ) ) as $id => $action ) {
			$last = count( $runs ) - 1;
			if ( $last < 0 || $runs[ $last ]['module'] !== $action['module'] ) {
				$runs[] = array(
					'module'  => $action['module'],
					'actions' => array(),
				);
				++$last;
			}
			$runs[ $last ]['actions'][] = array( 'id' => $id ) + $action['definition'];
		}

		foreach ( $runs as $run ) {
			wp_register_entity_actions( 'core', 'postType', $slug, $run['actions'], $run['module'] );
		}
	}
}
add_action( 'wp_entity_actions_api_init', 'wp_register_core_actions', 0 );
