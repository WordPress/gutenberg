/**
 * WordPress dependencies
 */
import type { Form } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createLabelField } from '../../utils/fields';
import {
	createLabelsActionsField,
	LABELS_ACTIONS_FIELD_ID,
} from '../../utils/labels';
import type { TaxonomyFormData } from '../types';
import { deriveLabels, STRING_LABEL_KEYS } from '../utils';

export const menuNameField = createLabelField( 'menu_name', __( 'Menu name' ), {
	placeholder: __( 'Categories' ),
	description: __( 'Defaults to the plural label.' ),
} );
export const allItemsField = createLabelField( 'all_items', __( 'All items' ), {
	placeholder: __( 'All Categories' ),
} );
export const editItemField = createLabelField( 'edit_item', __( 'Edit item' ), {
	placeholder: __( 'Edit Category' ),
} );
export const viewItemField = createLabelField( 'view_item', __( 'View item' ), {
	placeholder: __( 'View Category' ),
} );
export const updateItemField = createLabelField(
	'update_item',
	__( 'Update item' ),
	{ placeholder: __( 'Update Category' ) }
);
export const addNewItemLabelField = createLabelField(
	'add_new_item',
	__( 'Add new item' ),
	{ placeholder: __( 'Add New Category' ) }
);
export const newItemNameField = createLabelField(
	'new_item_name',
	__( 'New item name' ),
	{ placeholder: __( 'New Category Name' ) }
);
export const searchItemsField = createLabelField(
	'search_items',
	__( 'Search items' ),
	{ placeholder: __( 'Search Categories' ) }
);
export const notFoundField = createLabelField( 'not_found', __( 'Not found' ), {
	placeholder: __( 'No categories found.' ),
	description: __(
		'The text displayed when no terms are available in the term meta box and tag cloud.'
	),
} );
export const backToItemsField = createLabelField(
	'back_to_items',
	__( 'Back to items' ),
	{
		placeholder: __( '← Back to Categories' ),
		description: __( 'Label displayed after a term has been updated.' ),
	}
);
export const parentItemField = createLabelField(
	'parent_item',
	__( 'Parent item' ),
	{
		placeholder: __( 'Parent Category' ),
		description: __( 'Not used on non-hierarchical taxonomies.' ),
		isVisible: ( item ) => item.config.hierarchical,
	}
);
export const popularItemsField = createLabelField(
	'popular_items',
	__( 'Popular items' ),
	{
		placeholder: __( 'Popular Tags' ),
		description: __(
			'The popular items text. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);
export const separateItemsField = createLabelField(
	'separate_items_with_commas',
	__( 'Separate items with commas' ),
	{
		placeholder: __( 'Separate tags with commas' ),
		description: __(
			'Shown in the taxonomy meta box. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);
// Rare label overrides — appear last in the form.
export const parentItemColonField = createLabelField(
	'parent_item_colon',
	__( 'Parent item with colon' ),
	{
		placeholder: __( 'Parent Category:' ),
		description: __( 'Same as Parent item, with a colon at the end.' ),
		isVisible: ( item ) => item.config.hierarchical,
	}
);
export const addOrRemoveItemsField = createLabelField(
	'add_or_remove_items',
	__( 'Add or remove items' ),
	{
		placeholder: __( 'Add or remove tags' ),
		description: __(
			'Shown in the meta box when JavaScript is disabled. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);
export const chooseFromMostUsedField = createLabelField(
	'choose_from_most_used',
	__( 'Choose from the most used' ),
	{
		placeholder: __( 'Choose from the most used tags' ),
		description: __(
			'Shown in the taxonomy meta box. Not used on hierarchical taxonomies.'
		),
		isVisible: ( item ) => ! item.config.hierarchical,
	}
);

export const labelsActionsField = createLabelsActionsField< TaxonomyFormData >(
	{
		labelKeys: STRING_LABEL_KEYS,
		deriveLabels,
		helpText: __(
			'Override the text WordPress shows in admin lists, menus, and forms. Auto-fill replaces every label below with values derived from the current plural and singular names — including any you have already customized. Clearing removes all overrides so WordPress falls back to its defaults. If you rename the taxonomy after auto-filling, click Auto-fill again to keep them in sync.'
		),
	}
);

export const labelsFormFields: Form[ 'fields' ] = [
	{
		id: LABELS_ACTIONS_FIELD_ID,
		layout: { type: 'regular', labelPosition: 'none' },
	},
	// singular_name lives in the General card, so exclude it here.
	...STRING_LABEL_KEYS.filter( ( key ) => key !== 'singular_name' ),
];
