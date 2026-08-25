<?php
/**
 * Entity view configuration additions.
 *
 * Layers changes on top of the base configurations built in
 * `lib/compat/wordpress-7.1/view-config-api.php`, through the same
 * `get_entity_view_config_{$kind}_{$name}` filters.
 *
 * @package gutenberg
 */

/**
 * Adds the `reading_settings` field to the `wp_template` form configuration.
 *
 * The field links to the Reading settings screen from the Front Page template
 * summary; the field definition hides it for every other template.
 *
 * The `fields` list is pinned rather than merged because a merged member is
 * appended to the end of the list, and the link belongs above the last edited
 * date. Keep it in sync with the list built in
 * _gutenberg_get_entity_view_config_posttype_wp_template().
 *
 * @since 7.2.0
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
 * Registers the entity view configuration filters that layer on top of the
 * base definitions.
 *
 * Runs on `init` after gutenberg_register_entity_view_config_filters(), which
 * installs those base definitions at priority 5. These callbacks are registered
 * at priority 6 so they compose on top of the base definitions while still
 * running before third-party callbacks at the default priority.
 *
 * @since 7.2.0
 */
function gutenberg_register_entity_view_config_filters_7_2() {
	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', 'wp_template' ),
		'_gutenberg_add_reading_settings_to_wp_template_view_config',
		6,
		1
	);
}
add_action( 'init', 'gutenberg_register_entity_view_config_filters_7_2' );
