/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import type { DataFormControlProps, Field, Form } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';

import { Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { StoredLabels, TaxonomyFormData } from '../types';
import { deriveLabels, STRING_LABEL_KEYS } from '../utils';

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
		isValid: { maxLength: 200 },
		enableSorting: false,
	};
	if ( options.isVisible ) {
		field.isVisible = options.isVisible;
	}
	return field;
}

export const menuNameField = labelField( 'menu_name', __( 'Menu name' ), {
	placeholder: __( 'Categories' ),
	description: __( 'Defaults to the plural label.' ),
} );
export const allItemsField = labelField( 'all_items', __( 'All items' ), {
	placeholder: __( 'All Categories' ),
} );
export const editItemField = labelField( 'edit_item', __( 'Edit item' ), {
	placeholder: __( 'Edit Category' ),
} );
export const viewItemField = labelField( 'view_item', __( 'View item' ), {
	placeholder: __( 'View Category' ),
} );
export const updateItemField = labelField( 'update_item', __( 'Update item' ), {
	placeholder: __( 'Update Category' ),
} );
export const addNewItemLabelField = labelField(
	'add_new_item',
	__( 'Add new item' ),
	{
		placeholder: __( 'Add New Category' ),
	}
);
export const newItemNameField = labelField(
	'new_item_name',
	__( 'New item name' ),
	{
		placeholder: __( 'New Category Name' ),
	}
);
export const searchItemsField = labelField(
	'search_items',
	__( 'Search items' ),
	{
		placeholder: __( 'Search Categories' ),
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
	description: __( 'Not used on non-hierarchical taxonomies.' ),
	isVisible: ( item ) => item.config.hierarchical,
} );
export const popularItemsField = labelField(
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
export const separateItemsField = labelField(
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
export const parentItemColonField = labelField(
	'parent_item_colon',
	__( 'Parent item with colon' ),
	{
		placeholder: __( 'Parent Category:' ),
		description: __( 'Same as Parent item, with a colon at the end.' ),
		isVisible: ( item ) => item.config.hierarchical,
	}
);
export const addOrRemoveItemsField = labelField(
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
export const chooseFromMostUsedField = labelField(
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

function LabelsActionsEdit( {
	data,
	onChange,
}: DataFormControlProps< TaxonomyFormData > ) {
	const plural = data.title.raw.trim();
	const singular = data.config.labels.singular_name.trim();
	const canAutoFill = !! plural.length && !! singular.length;
	const hasOverrides = STRING_LABEL_KEYS.some(
		( key ) =>
			key !== 'singular_name' &&
			( data.config.labels[ key ] ?? '' ) !== ''
	);
	return (
		<Stack direction="column" gap="md">
			<Text variant="body-md" className="taxonomy-form__help-text">
				{ __(
					'Override the text WordPress shows in admin lists, menus, and forms. Auto-fill replaces every label below with values derived from the current plural and singular names — including any you have already customized. Clearing removes all overrides so WordPress falls back to its defaults. If you rename the taxonomy after auto-filling, click Auto-fill again to keep them in sync.'
				) }
			</Text>
			<Stack direction="row" justify="flex-end" gap="sm">
				<Button
					__next40pxDefaultSize
					variant="secondary"
					size="compact"
					accessibleWhenDisabled
					disabled={ ! canAutoFill }
					onClick={ () =>
						onChange( {
							config: {
								...data.config,
								labels: {
									...data.config.labels,
									...deriveLabels( plural, singular ),
								},
							},
						} )
					}
				>
					{ __( 'Auto-fill labels' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					size="compact"
					icon={ trash }
					isDestructive
					label={ __( 'Clear labels' ) }
					accessibleWhenDisabled
					disabled={ ! hasOverrides }
					onClick={ () => {
						const cleared: StoredLabels = {
							singular_name: data.config.labels.singular_name,
						};
						for ( const key of STRING_LABEL_KEYS ) {
							if ( key !== 'singular_name' ) {
								cleared[ key ] = '';
							}
						}
						onChange( {
							config: { ...data.config, labels: cleared },
						} );
					} }
				/>
			</Stack>
		</Stack>
	);
}

// TODO: Replace this phantom field once DataForm supports per-card header
// actions or arbitrary React among children. We register a no-value Field
// solely to render the Labels card's description and action buttons,
// suppressing its label via labelPosition: 'none'.
export const labelsActionsField: Field< TaxonomyFormData > = {
	id: '__labels_actions',
	label: '',
	getValue: () => '',
	setValue: () => ( {} ),
	Edit: LabelsActionsEdit,
	enableSorting: false,
	filterBy: false,
};

export const labelsForm: Form = {
	layout: { type: 'regular' },
	// singular_name lives in the General card, so exclude it here.
	fields: [
		{
			id: '__labels_actions',
			layout: { type: 'regular', labelPosition: 'none' },
		},
		...STRING_LABEL_KEYS.filter( ( key ) => key !== 'singular_name' ),
	],
};
