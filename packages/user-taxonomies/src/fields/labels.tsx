/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field, Form } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { StoredLabels, TaxonomyFormData } from '../types';

type LabelFieldOptions = {
	placeholder?: string;
	description?: string;
	isVisible?: ( item: TaxonomyFormData ) => boolean;
};

function labelField(
	id: keyof StoredLabels,
	label: string,
	options: LabelFieldOptions = {}
): Field< TaxonomyFormData > {
	const field: Field< TaxonomyFormData > = {
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
	placeholder: __( 'Defaults to the plural label' ),
	description: __( 'The menu name text. Defaults to the value of name.' ),
} );
export const allItemsField = labelField( 'all_items', __( 'All items' ), {
	placeholder: __( 'All Categories' ),
	description: __( 'The all items text.' ),
} );
export const editItemField = labelField( 'edit_item', __( 'Edit item' ), {
	placeholder: __( 'Edit Category' ),
	description: __( 'The edit item text.' ),
} );
export const viewItemField = labelField( 'view_item', __( 'View item' ), {
	placeholder: __( 'View Category' ),
	description: __( 'The view item text.' ),
} );
export const updateItemField = labelField( 'update_item', __( 'Update item' ), {
	placeholder: __( 'Update Category' ),
	description: __( 'The update item text.' ),
} );
export const addNewItemLabelField = labelField(
	'add_new_item',
	__( 'Add new item' ),
	{
		placeholder: __( 'Add New Category' ),
		description: __( 'The add new item text.' ),
	}
);
export const newItemNameField = labelField(
	'new_item_name',
	__( 'New item name' ),
	{
		placeholder: __( 'New Category Name' ),
		description: __( 'The new item name text.' ),
	}
);
export const searchItemsField = labelField(
	'search_items',
	__( 'Search items' ),
	{
		placeholder: __( 'Search Categories' ),
		description: __( 'The search items text.' ),
	}
);
export const notFoundField = labelField( 'not_found', __( 'Not found' ), {
	placeholder: __( 'No categories found.' ),
	description: __(
		'The text displayed when no terms are available in the term meta box and tag cloud.'
	),
} );
export const backToItemsField = labelField(
	'back_to_items',
	__( 'Back to items' ),
	{
		placeholder: __( '← Back to Categories' ),
		description: __( 'Label displayed after a term has been updated.' ),
	}
);
export const parentItemField = labelField( 'parent_item', __( 'Parent item' ), {
	placeholder: __( 'Parent Category' ),
	description: __(
		'The parent item text. Not used on non-hierarchical taxonomies.'
	),
	isVisible: ( item ) => item.config.hierarchical,
} );
export const popularItemsField = labelField(
	'popular_items',
	__( 'Popular items' ),
	{
		placeholder: __( 'Popular Tags' ),
		description: __( 'The popular items text.' ),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);
export const separateItemsField = labelField(
	'separate_items_with_commas',
	__( 'Separate items with commas' ),
	{
		placeholder: __( 'Separate tags with commas' ),
		description: __(
			'The separate items with commas text used in the taxonomy meta box. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);
// Rare label overrides — appear last in the form.
export const parentItemColonField = labelField(
	'parent_item_colon',
	__( 'Parent item with colon' ),
	{
		placeholder: __( 'Parent Category:' ),
		description: __( 'The same as parent item, with a colon at the end.' ),
		isVisible: ( item ) => item.config.hierarchical,
	}
);
export const addOrRemoveItemsField = labelField(
	'add_or_remove_items',
	__( 'Add or remove items' ),
	{
		placeholder: __( 'Add or remove tags' ),
		description: __(
			'The add or remove items text used in the meta box when JavaScript is disabled. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);
export const chooseFromMostUsedField = labelField(
	'choose_from_most_used',
	__( 'Choose from the most used' ),
	{
		placeholder: __( 'Choose from the most used tags' ),
		description: __(
			'The choose from most used text used in the taxonomy meta box. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);

export const labelsForm: Form = {
	layout: { type: 'regular' },
	fields: [
		'menu_name',
		'all_items',
		'edit_item',
		'view_item',
		'update_item',
		'add_new_item',
		'new_item_name',
		'search_items',
		'not_found',
		'back_to_items',
		'parent_item',
		'popular_items',
		'separate_items_with_commas',
		'parent_item_colon',
		'add_or_remove_items',
		'choose_from_most_used',
	],
};
