/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field, Form } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { PostTypeFormData, StoredLabels } from '../types';
import { STRING_LABEL_KEYS } from '../utils';

type LabelFieldOptions = {
	placeholder?: string;
	description?: string;
	isVisible?: ( item: PostTypeFormData ) => boolean;
};

function labelField(
	id: keyof StoredLabels,
	label: string,
	options: LabelFieldOptions = {}
): Field< PostTypeFormData > {
	const field: Field< PostTypeFormData > = {
		id,
		label,
		type: 'text',
		placeholder: options.placeholder,
		description: options.description,
		getValue: ( { item } ) => item.config.labels[ id ] ?? '',
		setValue: ( { item, value } ) => ( {
			config: {
				...item.config,
				labels: {
					...item.config.labels,
					[ id ]: String( value ?? '' ),
				},
			},
		} ),
		enableSorting: false,
	};
	if ( options.isVisible ) {
		field.isVisible = options.isVisible;
	}
	return field;
}

export const menuNameField = labelField( 'menu_name', __( 'Menu name' ), {
	placeholder: __( 'Posts' ),
	description: __( 'Defaults to the plural label.' ),
} );
export const allItemsField = labelField( 'all_items', __( 'All items' ), {
	placeholder: __( 'All Posts' ),
} );
export const addNewField = labelField( 'add_new', __( 'Add new' ), {
	placeholder: __( 'Add New' ),
	description: __( 'Shown in the admin menu and on toolbar buttons.' ),
} );
export const addNewItemLabelField = labelField(
	'add_new_item',
	__( 'Add new item' ),
	{
		placeholder: __( 'Add New Post' ),
	}
);
export const editItemField = labelField( 'edit_item', __( 'Edit item' ), {
	placeholder: __( 'Edit Post' ),
} );
export const newItemField = labelField( 'new_item', __( 'New item' ), {
	placeholder: __( 'New Post' ),
} );
export const viewItemField = labelField( 'view_item', __( 'View item' ), {
	placeholder: __( 'View Post' ),
} );
export const viewItemsField = labelField( 'view_items', __( 'View items' ), {
	placeholder: __( 'View Posts' ),
	description: __( 'Used as the link label for the post type archive.' ),
} );
export const searchItemsField = labelField(
	'search_items',
	__( 'Search items' ),
	{
		placeholder: __( 'Search Posts' ),
	}
);
export const notFoundField = labelField( 'not_found', __( 'Not found' ), {
	placeholder: __( 'No posts found.' ),
	description: __( 'Shown in the admin list when no posts match.' ),
} );
export const notFoundInTrashField = labelField(
	'not_found_in_trash',
	__( 'Not found in trash' ),
	{
		placeholder: __( 'No posts found in Trash.' ),
	}
);
export const archivesField = labelField( 'archives', __( 'Archives' ), {
	placeholder: __( 'Post Archives' ),
	description: __(
		'Used in the navigation menus block when adding a link to the post type archive.'
	),
} );
export const attributesField = labelField( 'attributes', __( 'Attributes' ), {
	placeholder: __( 'Post Attributes' ),
	description: __(
		'Title of the Attributes meta box. Not used on non-hierarchical post types.'
	),
	isVisible: ( item ) => item.config.hierarchical,
} );
export const parentItemColonField = labelField(
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
export const insertIntoItemField = labelField(
	'insert_into_item',
	__( 'Insert into item' ),
	{
		placeholder: __( 'Insert into post' ),
		description: __( 'Shown in the media library uploader.' ),
	}
);
export const uploadedToThisItemField = labelField(
	'uploaded_to_this_item',
	__( 'Uploaded to this item' ),
	{
		placeholder: __( 'Uploaded to this post' ),
	}
);
export const featuredImageField = labelField(
	'featured_image',
	__( 'Featured image' ),
	{
		placeholder: __( 'Featured image' ),
	}
);
export const setFeaturedImageField = labelField(
	'set_featured_image',
	__( 'Set featured image' ),
	{
		placeholder: __( 'Set featured image' ),
	}
);
export const removeFeaturedImageField = labelField(
	'remove_featured_image',
	__( 'Remove featured image' ),
	{
		placeholder: __( 'Remove featured image' ),
	}
);
export const useFeaturedImageField = labelField(
	'use_featured_image',
	__( 'Use as featured image' ),
	{
		placeholder: __( 'Use as featured image' ),
	}
);
export const filterItemsListField = labelField(
	'filter_items_list',
	__( 'Filter items list' ),
	{
		placeholder: __( 'Filter posts list' ),
		description: __(
			'Screen reader text for the admin list filter controls.'
		),
	}
);
export const itemsListNavigationField = labelField(
	'items_list_navigation',
	__( 'Items list navigation' ),
	{
		placeholder: __( 'Posts list navigation' ),
		description: __( 'Screen reader text for the admin list pagination.' ),
	}
);
export const itemsListField = labelField( 'items_list', __( 'Items list' ), {
	placeholder: __( 'Posts list' ),
	description: __( 'Screen reader text for the admin list table.' ),
} );

export const labelsForm: Form = {
	layout: { type: 'regular' },
	// singular_name lives in the General card, so exclude it here.
	fields: STRING_LABEL_KEYS.filter( ( key ) => key !== 'singular_name' ),
};
