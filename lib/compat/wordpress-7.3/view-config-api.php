<?php
/**
 * View Config API: WordPress 7.3 additions.
 *
 * @package gutenberg
 */

/**
 * Returns the default form of the quick edit drawer for post types.
 *
 * Opening the drawer is already the choice to edit, so the frequently edited
 * fields render their controls inline, the status as a compact select, and the
 * rest keep a panel, pinned below them. The fields come from the default form
 * of post types, without the scheduled date, which the date panel edits too.
 *
 * @since 7.3.0
 *
 * @return array The default quick edit form configuration for post types.
 */
function _gutenberg_get_default_posttype_quick_edit_form() {
	$top_label = array(
		'type'          => 'regular',
		'labelPosition' => 'top',
	);

	return array(
		'layout' => array( 'type' => 'panel' ),
		'fields' => array(
			array(
				'id'     => 'featured_media',
				'layout' => array(
					'type'          => 'regular',
					'labelPosition' => 'none',
				),
			),
			array(
				'id'     => 'post-content-info',
				'layout' => array(
					'type'          => 'regular',
					'labelPosition' => 'none',
				),
			),
			array(
				'id'     => 'excerpt',
				'layout' => $top_label,
			),
			array(
				'id'     => 'status',
				'layout' => $top_label,
				'config' => array( 'compact' => true ),
			),
			array(
				'id'     => 'sticky',
				'layout' => $top_label,
			),
			array(
				'id'     => 'slug',
				'layout' => $top_label,
			),
			array(
				'id'     => 'author',
				'layout' => $top_label,
			),
			array(
				'id'     => 'template',
				'layout' => $top_label,
			),
			'date',
			array(
				'id'       => 'discussion',
				'label'    => __( 'Discussion', 'gutenberg' ),
				'layout'   => array(
					'type'    => 'panel',
					'summary' => 'discussion',
				),
				'children' => array(
					array(
						'id'     => 'comment_status',
						'layout' => array(
							'type'          => 'regular',
							'labelPosition' => 'none',
						),
					),
					'ping_status',
				),
			),
			'password',
			'parent',
			'format',
			'revisions',
		),
	);
}

/**
 * Provides the default quick edit form for a post type.
 *
 * @since 7.3.0
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function _gutenberg_add_default_quick_edit_form_to_posttype_view_config( $data ) {
	return $data->merge(
		array(
			'quick_edit_form' => _gutenberg_get_default_posttype_quick_edit_form(),
		),
		1
	);
}

/**
 * Provides the default quick edit form to every post type that uses the
 * default form, including custom post types registered at any point.
 *
 * The post types providing their own form have no quick edit form by default,
 * so the drawer uses their form instead.
 *
 * @since 7.3.0
 *
 * @param string $post_type The post type being registered.
 */
function gutenberg_register_default_posttype_quick_edit_form_7_3( $post_type ) {
	if ( in_array( $post_type, GUTENBERG_VIEW_CONFIG_POST_TYPES_WITH_OWN_FORM, true ) ) {
		return;
	}

	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', $post_type ),
		'_gutenberg_add_default_quick_edit_form_to_posttype_view_config',
		5,
		1
	);
}
add_action( 'registered_post_type', 'gutenberg_register_default_posttype_quick_edit_form_7_3' );
