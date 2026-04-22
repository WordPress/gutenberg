/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Field, Form } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import {
	usePublicPostTypes,
	useTakenTaxonomySlugs,
	type TaxonomyFormData,
} from './utils';

export const titleField: Field< TaxonomyFormData > = {
	id: 'title',
	label: __( 'Title' ),
	type: 'text',
	enableGlobalSearch: true,
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( { title: { raw: String( value ?? '' ) } } ),
	isValid: { required: true },
	filterBy: false,
	enableHiding: false,
};

export const pluralLabelField: Field< TaxonomyFormData > = {
	id: 'plural_name',
	label: __( 'Plural label' ),
	type: 'text',
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( { title: { raw: String( value ?? '' ) } } ),
	isValid: { required: true },
};

export const singularLabelField: Field< TaxonomyFormData > = {
	id: 'singular_name',
	label: __( 'Singular label' ),
	type: 'text',
	getValue: ( { item } ) => item.config.labels.singular_name,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			labels: {
				...item.config.labels,
				singular_name: String( value ?? '' ),
			},
		},
	} ),
	isValid: { required: true },
	enableSorting: false,
};

export const publicField: Field< TaxonomyFormData > = {
	id: 'public',
	label: __( 'Public' ),
	type: 'boolean',
	description: __(
		'Whether a taxonomy is intended for use publicly either via the admin interface or by front-end users.'
	),
	getValue: ( { item } ) => item.config.public,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, public: !! value },
	} ),
	filterBy: false,
	enableSorting: false,
};

export const hierarchicalField: Field< TaxonomyFormData > = {
	id: 'hierarchical',
	label: __( 'Hierarchical' ),
	type: 'boolean',
	description: __(
		'When on, terms behave like categories with parent-child relationships. When off, terms behave like tags.'
	),
	getValue: ( { item } ) => item.config.hierarchical,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, hierarchical: !! value },
	} ),
	filterBy: false,
	enableSorting: false,
};

export const statusField: Field< TaxonomyFormData > = {
	id: 'status',
	label: __( 'Status' ),
	description: __(
		'Active taxonomies are enabled and registered with WordPress.'
	),
	elements: [
		{ value: 'publish', label: __( 'Active' ) },
		{ value: 'draft', label: __( 'Inactive' ) },
	],
	enableSorting: false,
};

export function useSlugField(
	originalSlug?: string,
	currentValue?: string
): Field< TaxonomyFormData > {
	const takenSlugs = useTakenTaxonomySlugs( originalSlug );
	const showRenameWarning =
		originalSlug !== undefined && currentValue !== originalSlug;
	return useMemo< Field< TaxonomyFormData > >(
		() => ( {
			id: 'slug',
			label: __( 'Slug' ),
			type: 'text',
			enableGlobalSearch: true,
			description: (
				<Stack direction="column" gap="sm">
					{ showRenameWarning && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Changing the key renames the taxonomy — existing terms may become inaccessible until a migration updates the database.'
							) }
						</Notice>
					) }
					<span>
						{ __(
							'Lower case letters, numbers, underscores, and dashes only. Maximum length: 32 characters.'
						) }
					</span>
				</Stack>
			),
			isValid: {
				required: true,
				pattern: '^[a-z0-9_-]{1,32}$',
				custom: ( value: TaxonomyFormData ) =>
					takenSlugs.has( value.slug )
						? __( 'This taxonomy key is already in use.' )
						: null,
			},
			filterBy: false,
			enableSorting: false,
		} ),
		[ takenSlugs, showRenameWarning ]
	);
}

export function useObjectTypeField(): Field< TaxonomyFormData > {
	const publicPostTypes = usePublicPostTypes();
	return useMemo< Field< TaxonomyFormData > >( () => {
		const elements = ( publicPostTypes ?? [] ).map( ( pt: any ) => ( {
			value: pt.slug as string,
			label: pt.name as string,
		} ) );
		const labelMap: Record< string, string > = Object.fromEntries(
			elements.map( ( e ) => [ e.value, e.label ] )
		);
		return {
			id: 'object_type',
			label: __( 'Post types' ),
			type: 'array',
			description: __(
				'One or more post types with which the taxonomy should be associated.'
			),
			elements,
			enableSorting: false,
			getValue: ( { item } ) => item.config.object_type,
			setValue: ( { item, value } ) => ( {
				config: {
					...item.config,
					object_type: Array.isArray( value ) ? value : [],
				},
			} ),
			render: ( { item } ) => {
				const slugs = item.config.object_type;
				if ( ! slugs || slugs.length === 0 ) {
					return <span aria-hidden="true">—</span>;
				}
				return (
					<>
						{ slugs
							.map( ( s ) => labelMap[ s ] ?? s )
							.join( ', ' ) }
					</>
				);
			},
			isValid: { required: true },
			filterBy: false,
		};
	}, [ publicPostTypes ] );
}

// --- Form layout ---------------------------------------------------------

export const defaultForm: Form = {
	layout: { type: 'regular' },
	fields: [
		'plural_name',
		'singular_name',
		'slug',
		'object_type',
		'public',
		'hierarchical',
		'status',
	],
};
