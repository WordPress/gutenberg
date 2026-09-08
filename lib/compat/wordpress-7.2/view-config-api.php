<?php
/**
 * Entity view configuration additions, layered on top of the base
 * configurations in `lib/compat/wordpress-7.1/view-config-api.php`.
 *
 * @package gutenberg
 */

/**
 * Adds the `reading_settings` field to the `wp_template` form configuration.
 *
 * The `fields` list is pinned rather than merged because a merged member is
 * appended to the end of the list, and the link belongs above the last edited
 * date. Keep it in sync with the list built in
 * _gutenberg_get_entity_view_config_posttype_wp_template().
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function _gutenberg_add_reading_settings_to_wp_template_view_config( $data ) {
	return $data->replace(
		array(
			'form' => array(
				'fields' => array(
					array(
						'id'     => 'description',
						'layout' => array(
							'type'          => 'panel',
							'labelPosition' => 'top',
						),
					),
					array(
						'id'     => 'description_readonly',
						'layout' => array(
							'type'          => 'regular',
							'labelPosition' => 'none',
						),
					),
					array(
						'id'     => 'reading_settings',
						'layout' => array(
							'type'          => 'regular',
							'labelPosition' => 'none',
						),
					),
					array(
						'id'     => 'last_edited_date',
						'layout' => array(
							'type'          => 'panel',
							'labelPosition' => 'none',
						),
					),
					'revisions',
					// The following fields are only meaningful in the `home`/`index`
					// template summary. They edit other entities (`root/site` and the
					// posts page); the editor merges those records into the form data
					// under a namespace and controls when the fields are shown.
					'posts_page_title',
					'posts_per_page',
					'default_comment_status',
				),
			),
		),
		1
	);
}

/**
 * Provides the view configuration for the `wp_navigation` post type.
 *
 * Core has no callback for this post type, so this is a base definition
 * rather than a layer on top of one.
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function _gutenberg_get_entity_view_config_posttype_wp_navigation( $data ) {
	$default_layouts = array(
		'list' => array(),
	);

	$default_view = array(
		'type'       => 'list',
		'filters'    => array(),
		'perPage'    => 20,
		'sort'       => array(
			'field'     => 'date',
			'direction' => 'desc',
		),
		'titleField' => 'title',
		'fields'     => array(),
	);

	// The base config already provides the "All" view titled with the post
	// type's `all_items` label, so only the default view and layouts change.
	$data->set(
		array(
			'default_view'    => $default_view,
			'default_layouts' => $default_layouts,
		),
		1
	);

	return $data;
}

/**
 * Post types whose base definition provides its own `form`, without the
 * `status` and `discussion` groups of the default post type form.
 *
 * @var string[]
 */
const GUTENBERG_VIEW_CONFIG_POST_TYPES_WITH_OWN_FORM = array( 'wp_block', 'wp_template', 'wp_template_part' );

/**
 * Makes the panel summary of the `status` and `discussion` groups explicit in
 * the default post type form.
 *
 * Both groups used to be summarized by the field sharing their id (`status`,
 * and the composite `discussion` field). A combined form field no longer
 * resolves its own id against the field definitions, so the summary field is
 * declared through `layout.summary` instead. The patch merges into the existing
 * group members by id, leaving the rest of the form untouched.
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function _gutenberg_add_group_summaries_to_default_posttype_form( $data ) {
	return $data->merge(
		array(
			'form' => array(
				'fields' => array(
					array(
						'id'     => 'status',
						'layout' => array(
							'type'    => 'panel',
							'summary' => 'status',
						),
					),
					array(
						'id'     => 'discussion',
						'layout' => array(
							'type'    => 'panel',
							'summary' => 'discussion',
						),
					),
				),
			),
		),
		1
	);
}

/**
 * Layers the group summaries on top of the view configuration of every post
 * type that uses the default form, including custom post types registered at
 * any point.
 *
 * The callback merges by member id, and a member that is absent would be
 * appended instead, so post types whose base definition provides its own form
 * are skipped.
 *
 * @param string $post_type The post type being registered.
 */
function gutenberg_register_default_posttype_form_summaries_7_2( $post_type ) {
	if ( in_array( $post_type, GUTENBERG_VIEW_CONFIG_POST_TYPES_WITH_OWN_FORM, true ) ) {
		return;
	}

	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', $post_type ),
		'_gutenberg_add_group_summaries_to_default_posttype_form',
		6,
		1
	);
}
add_action( 'registered_post_type', 'gutenberg_register_default_posttype_form_summaries_7_2' );

/**
 * Registers the entity view configuration filters that layer on top of the base
 * definitions, at a priority between those (5) and third-party callbacks (10),
 * and the base definitions for entities that gained one in 7.2, at the base
 * priority (5).
 */
function gutenberg_register_entity_view_config_filters_7_2() {
	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', 'wp_navigation' ),
		'_gutenberg_get_entity_view_config_posttype_wp_navigation',
		5,
		1
	);
	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', 'wp_template' ),
		'_gutenberg_add_reading_settings_to_wp_template_view_config',
		6,
		1
	);
}
add_action( 'init', 'gutenberg_register_entity_view_config_filters_7_2' );
