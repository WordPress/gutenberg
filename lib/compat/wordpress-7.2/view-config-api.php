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
 * Removes the `active`, `slug`, and `theme` fields from the `wp_template`
 * default view.
 *
 * They were rendered by the template activation experiment, which has been
 * removed. No field with those ids is registered for templates anymore.
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function _gutenberg_remove_stale_fields_from_wp_template_view_config( $data ) {
	return $data->remove(
		array(
			'default_view' => array(
				'fields' => array( 'active', 'slug', 'theme' ),
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
 * Provides the view configuration for the `root`/`site` entity.
 *
 * The site settings are a singleton record edited through a form (the site
 * editor's Identity screen) rather than listed in a view, so only the `form`
 * is defined here. The generic `default_view`, `default_layouts`, and
 * `view_list` built by gutenberg_get_entity_view_config() are left untouched.
 *
 * Core has no callback for this entity, so this is a base definition rather
 * than a layer on top of one.
 *
 * @param Gutenberg_View_Config_Data $data The view configuration container for the entity.
 * @return Gutenberg_View_Config_Data The updated view configuration container.
 */
function _gutenberg_get_entity_view_config_root_site( $data ) {
	return $data->set(
		array(
			'form' => array(
				'layout' => array(
					'type'          => 'regular',
					'labelPosition' => 'top',
				),
				'fields' => array(
					'title',
					'description',
					'site_logo',
					'site_icon',
				),
			),
		),
		1
	);
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
 * Adds the item count of each view to a post type's view list.
 *
 * Runs on the view list as the client receives it, after every view config
 * filter, so a count always describes the view it sits on. Only a view whose
 * total a status count answers gets one: a view without filters, which lists
 * every status but trash, and a view whose only filter is on the status. A view
 * narrowed by anything else, such as a date filter a plugin added, is left
 * without a count rather than showing a total it does not hold.
 *
 * `wp_count_posts()` answers every view from one cached query, and its
 * `readable` permission argument keeps private posts the current user cannot
 * read out of the totals.
 *
 * @param string $post_type The post type the view list belongs to.
 * @param array  $view_list The view list.
 * @return array The view list, with a count on each view a status total answers.
 */
function _gutenberg_add_counts_to_view_list( $post_type, $view_list ) {
	$counts = (array) wp_count_posts( $post_type, 'readable' );

	foreach ( $view_list as $index => $entry ) {
		$statuses = _gutenberg_get_view_list_entry_statuses( $entry );
		if ( null === $statuses ) {
			continue;
		}

		$count = 0;
		foreach ( $statuses as $status ) {
			$count += isset( $counts[ $status ] ) ? (int) $counts[ $status ] : 0;
		}
		$view_list[ $index ]['count'] = $count;
	}

	return $view_list;
}

/**
 * Returns the statuses a view list entry lists, when the status is all it
 * filters by.
 *
 * The entry comes from view config filters, so its shape is not trusted.
 *
 * @param mixed $entry A view list entry.
 * @return string[]|null The statuses, or null when the view filters by anything
 *                       else or its shape is not recognized.
 */
function _gutenberg_get_view_list_entry_statuses( $entry ) {
	if ( ! is_array( $entry ) ) {
		return null;
	}

	$view = isset( $entry['view'] ) ? (array) $entry['view'] : array();
	if ( ! empty( $view['search'] ) ) {
		return null;
	}

	$filters = isset( $view['filters'] ) ? $view['filters'] : array();
	if ( ! is_array( $filters ) ) {
		return null;
	}
	if ( empty( $filters ) ) {
		// Every status but trash, matching what a view without filters queries.
		return array( 'publish', 'future', 'draft', 'pending', 'private' );
	}
	if ( 1 !== count( $filters ) ) {
		return null;
	}

	$filter = (array) reset( $filters );
	if (
		! isset( $filter['field'], $filter['operator'], $filter['value'] ) ||
		'status' !== $filter['field'] ||
		! in_array( $filter['operator'], array( 'is', 'isAny' ), true )
	) {
		return null;
	}

	$statuses = is_array( $filter['value'] ) ? $filter['value'] : array( $filter['value'] );
	foreach ( $statuses as $status ) {
		if ( ! is_string( $status ) ) {
			return null;
		}
	}

	return $statuses;
}

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
		gutenberg_get_entity_view_config_hook_name( 'root', 'site' ),
		'_gutenberg_get_entity_view_config_root_site',
		5,
		1
	);
	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', 'wp_template' ),
		'_gutenberg_add_reading_settings_to_wp_template_view_config',
		6,
		1
	);
	add_filter(
		gutenberg_get_entity_view_config_hook_name( 'postType', 'wp_template' ),
		'_gutenberg_remove_stale_fields_from_wp_template_view_config',
		6,
		1
	);
}
add_action( 'init', 'gutenberg_register_entity_view_config_filters_7_2' );
