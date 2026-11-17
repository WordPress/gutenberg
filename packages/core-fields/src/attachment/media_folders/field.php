<?php
/**
 * The folders the media is filed under, from the `wp_media_folder` taxonomy.
 * Its JavaScript parts (`Edit` and `render`) are in `field.tsx`, next to this
 * file.
 *
 * The taxonomy is registered by the media folders experiment, so it is often
 * absent. Returning anything but an array leaves the field out of the
 * collection, see WP_Entity_Fields_Registry::get_collection_fields(), and the
 * form entry for a field that was not registered is dropped by the editor.
 *
 * The id matches the `rest_base` of the taxonomy, which is the property the
 * field reads and writes on the attachment record.
 *
 * Sorting is left off: the value is a list of term ids, so it would sort on
 * the ids rather than the folder names.
 *
 * Filtering is on. The field id is the taxonomy's `rest_base`, which is also
 * the collection parameter of `/wp/v2/media`, so a filter on the field reaches
 * the query; the `getElements` in `field.tsx` supplies the folder names the
 * filter UI lists.
 *
 * @package WordPress
 */

// `wp_entity_fields_api_init` fires after `init`, so the taxonomy has been
// registered by now if it is going to be.
if ( ! taxonomy_exists( 'wp_media_folder' ) ) {
	return null;
}

return array(
	'id'            => 'media-folders',
	'label'         => __( 'Folders' ),
	'placeholder'   => __( '(no folders)' ),
	'enableSorting' => false,
	'filterBy'      => array(
		'operators' => array( 'isAny', 'isNone', 'isAll' ),
	),
);
