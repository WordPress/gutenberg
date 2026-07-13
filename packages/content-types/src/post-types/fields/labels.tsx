/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Form } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { createLabelField } from '../../utils/fields';
import {
	createLabelsActionsField,
	LABELS_ACTIONS_FIELD_ID,
} from '../../utils/labels';
import type { PostTypeFormData } from '../types';
import { deriveLabels, STRING_LABEL_KEYS } from '../utils';

export const menuNameField = createLabelField( 'menu_name', __( 'Menu name' ), {
	placeholder: __( 'Posts' ),
	description: __( 'Defaults to the plural label.' ),
} );
export const allItemsField = createLabelField( 'all_items', __( 'All items' ), {
	placeholder: __( 'All Posts' ),
} );
export const addNewField = createLabelField( 'add_new', __( 'Add new' ), {
	placeholder: __( 'Add New' ),
	description: __( 'Shown in the admin menu and on toolbar buttons.' ),
} );
export const addNewItemLabelField = createLabelField(
	'add_new_item',
	__( 'Add new item' ),
	{ placeholder: __( 'Add New Post' ) }
);
export const editItemField = createLabelField( 'edit_item', __( 'Edit item' ), {
	placeholder: __( 'Edit Post' ),
} );
export const newItemField = createLabelField( 'new_item', __( 'New item' ), {
	placeholder: __( 'New Post' ),
} );
export const viewItemField = createLabelField( 'view_item', __( 'View item' ), {
	placeholder: __( 'View Post' ),
} );
export const viewItemsField = createLabelField(
	'view_items',
	__( 'View items' ),
	{
		placeholder: __( 'View Posts' ),
		description: __( 'Used as the link label for the post type archive.' ),
	}
);
export const searchItemsField = createLabelField(
	'search_items',
	__( 'Search items' ),
	{ placeholder: __( 'Search Posts' ) }
);
export const notFoundField = createLabelField( 'not_found', __( 'Not found' ), {
	placeholder: __( 'No posts found.' ),
	description: __( 'Shown in the admin list when no posts match.' ),
} );
export const notFoundInTrashField = createLabelField(
	'not_found_in_trash',
	__( 'Not found in trash' ),
	{ placeholder: __( 'No posts found in Trash.' ) }
);
export const archivesField = createLabelField( 'archives', __( 'Archives' ), {
	placeholder: __( 'Post Archives' ),
	description: __(
		'Used in the navigation menus block when adding a link to the post type archive.'
	),
} );
export const attributesField = createLabelField(
	'attributes',
	__( 'Attributes' ),
	{
		placeholder: __( 'Post Attributes' ),
		description: __(
			'Title of the Attributes meta box. Not used on non-hierarchical post types.'
		),
		isVisible: ( item ) => item.config.hierarchical,
	}
);
export const parentItemColonField = createLabelField(
	'parent_item_colon',
	__( 'Parent item with colon' ),
	{
		placeholder: __( 'Parent Page:' ),
		description: __(
			'Shown above the parent dropdown. Not used on non-hierarchical post types.'
		),
		isVisible: ( item ) => item.config.hierarchical,
	}
);
export const insertIntoItemField = createLabelField(
	'insert_into_item',
	__( 'Insert into item' ),
	{
		placeholder: __( 'Insert into post' ),
		description: __( 'Shown in the media library uploader.' ),
	}
);
export const uploadedToThisItemField = createLabelField(
	'uploaded_to_this_item',
	__( 'Uploaded to this item' ),
	{
		placeholder: __( 'Uploaded to this post' ),
	}
);
export const featuredImageField = createLabelField(
	'featured_image',
	__( 'Featured image' ),
	{
		placeholder: __( 'Featured image' ),
	}
);
export const setFeaturedImageField = createLabelField(
	'set_featured_image',
	__( 'Set featured image' ),
	{
		placeholder: __( 'Set featured image' ),
	}
);
export const removeFeaturedImageField = createLabelField(
	'remove_featured_image',
	__( 'Remove featured image' ),
	{
		placeholder: __( 'Remove featured image' ),
	}
);
export const useFeaturedImageField = createLabelField(
	'use_featured_image',
	__( 'Use as featured image' ),
	{
		placeholder: __( 'Use as featured image' ),
	}
);
export const filterItemsListField = createLabelField(
	'filter_items_list',
	__( 'Filter items list' ),
	{
		placeholder: __( 'Filter posts list' ),
		description: __(
			'Screen reader text for the admin list filter controls.'
		),
	}
);
export const itemsListNavigationField = createLabelField(
	'items_list_navigation',
	__( 'Items list navigation' ),
	{
		placeholder: __( 'Posts list navigation' ),
		description: __( 'Screen reader text for the admin list pagination.' ),
	}
);
export const itemsListField = createLabelField(
	'items_list',
	__( 'Items list' ),
	{
		placeholder: __( 'Posts list' ),
		description: __( 'Screen reader text for the admin list table.' ),
	}
);

export const labelsActionsField = createLabelsActionsField< PostTypeFormData >(
	{
		labelKeys: STRING_LABEL_KEYS,
		deriveLabels,
		helpText: __(
			'Override the text WordPress shows in admin lists, menus, and forms. Auto-fill replaces every label below with values derived from the current plural and singular names — including any you have already customized. Clearing removes all overrides so WordPress falls back to its defaults. If you rename the post type after auto-filling, click Auto-fill again to keep them in sync.'
		),
	}
);

export const labelsForm: Form = {
	layout: { type: 'regular' },
	fields: [
		{
			id: LABELS_ACTIONS_FIELD_ID,
			layout: { type: 'regular', labelPosition: 'none' },
		},
		// singular_name lives in the General card, so exclude it here.
		...STRING_LABEL_KEYS.filter( ( key ) => key !== 'singular_name' ),
	],
};
