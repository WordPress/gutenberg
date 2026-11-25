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
 * @return array<string, mixed> The default quick edit form configuration for post types.
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
 * @return void
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

/**
 * Returns the ids of the fields of a form, including the children of combined
 * fields.
 *
 * @since 7.3.0
 *
 * @param mixed $fields The `fields` of a form configuration.
 * @return string[] The field ids.
 */
function _gutenberg_get_view_config_form_field_ids( $fields ) {
	if ( ! is_array( $fields ) ) {
		return array();
	}

	$ids = array();
	foreach ( $fields as $field ) {
		if ( is_string( $field ) ) {
			$ids[] = $field;
			continue;
		}
		if ( ! is_array( $field ) ) {
			continue;
		}
		if ( isset( $field['id'] ) && is_string( $field['id'] ) ) {
			$ids[] = $field['id'];
		}
		$ids = array_merge( $ids, _gutenberg_get_view_config_form_field_ids( $field['children'] ?? null ) );
	}

	return $ids;
}

/**
 * Adds the fields that plugins add to the form of a post type to the end of
 * its quick edit form.
 *
 * Before 7.3.0 the quick edit drawer used the form of the post type, so a
 * plugin offered a field for quick editing by adding it to `form`. The drawer
 * now has its own form, and a plugin that only knows about `form` would lose
 * its field there. A field of `form` counts as added by a plugin when the
 * default form of post types does not list it. Those the quick edit form
 * lists already keep their place.
 *
 * Only post types using the default form are affected: the others have no
 * default quick edit form, and the drawer uses their form when they have none.
 *
 * @since 7.3.0
 *
 * @param array<mixed> $config The view configuration of the entity.
 * @param string       $kind   The entity kind.
 * @param string       $name   The entity name.
 * @return array<mixed> The view configuration, with the fields added to the quick edit form.
 */
function gutenberg_add_form_fields_to_quick_edit_form( array $config, $kind, $name ) {
	if ( 'postType' !== $kind || in_array( $name, GUTENBERG_VIEW_CONFIG_POST_TYPES_WITH_OWN_FORM, true ) ) {
		return $config;
	}

	$quick_edit_form = $config['quick_edit_form'] ?? null;
	$form            = $config['form'] ?? null;
	if (
		! is_array( $quick_edit_form ) || ! isset( $quick_edit_form['fields'] ) || ! is_array( $quick_edit_form['fields'] ) || array() === $quick_edit_form['fields'] ||
		! is_array( $form ) || ! isset( $form['fields'] ) || ! is_array( $form['fields'] )
	) {
		return $config;
	}

	$listed_ids = array_merge(
		_gutenberg_get_view_config_form_field_ids( _gutenberg_get_default_posttype_form()['fields'] ),
		_gutenberg_get_view_config_form_field_ids( $quick_edit_form['fields'] )
	);

	$fields = $quick_edit_form['fields'];
	foreach ( $form['fields'] as $field ) {
		$ids = _gutenberg_get_view_config_form_field_ids( array( $field ) );
		if ( array() === $ids || in_array( $ids[0], $listed_ids, true ) ) {
			continue;
		}
		$fields[]   = $field;
		$listed_ids = array_merge( $listed_ids, $ids );
	}

	$quick_edit_form['fields'] = $fields;
	$config['quick_edit_form'] = $quick_edit_form;

	return $config;
}
