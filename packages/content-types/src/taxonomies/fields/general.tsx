/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type {
	DataFormControlProps,
	Field,
	FieldValidity,
	Form,
} from '@wordpress/dataviews';
// eslint-disable-next-line @wordpress/use-recommended-components -- Used here because it supports rendering as a `span` via the `render` prop to avoid invalid HTML.
import { Badge, Notice, Stack } from '@wordpress/ui';
import { cleanForSlug } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { TAXONOMY_ENTITY } from '../../constants';
import { usePublicPostTypes } from '../utils';
import type { TaxonomyFormData } from '../types';
import { booleanField } from './utils';

const { ValidatedInputControl } = unlock( componentsPrivateApis );

export const titleField: Field< TaxonomyFormData > = {
	id: 'title',
	label: __( 'Title' ),
	type: 'text',
	enableGlobalSearch: true,
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( { title: { raw: String( value ?? '' ) } } ),
	isValid: { required: true, maxLength: 200 },
	filterBy: false,
	enableHiding: false,
};

export const pluralLabelField: Field< TaxonomyFormData > = {
	id: 'plural_name',
	label: __( 'Plural label' ),
	type: 'text',
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( { title: { raw: String( value ?? '' ) } } ),
	isValid: { required: true, maxLength: 200 },
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
	isValid: { required: true, maxLength: 200 },
	enableSorting: false,
};

export const descriptionField: Field< TaxonomyFormData > = {
	id: 'description',
	label: __( 'Description' ),
	type: 'text',
	Edit: { control: 'textarea', rows: 3 },
	description: __(
		'Optional summary of the taxonomy. Shown in admin UIs that surface taxonomy details.'
	),
	getValue: ( { item } ) => item.config.description,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, description: String( value ?? '' ) },
	} ),
	isValid: { maxLength: 1000 },
	enableSorting: false,
};

export const hierarchicalField = booleanField(
	'hierarchical',
	__( 'Hierarchical' ),
	{
		description: __(
			'When on, terms behave like categories with parent-child relationships. When off, terms behave like tags.'
		),
	}
);

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
	render: ( { item } ) => {
		const isActive = item.status === 'publish';
		return (
			<Badge intent={ isActive ? 'stable' : 'draft' }>
				{ isActive ? __( 'Active' ) : __( 'Inactive' ) }
			</Badge>
		);
	},
	enableSorting: false,
};

const SLUG_MAX_LENGTH = 32;
// Slug field has required + pattern + maxLength + a custom (slug-taken) check.
// Surface them in priority order: structural rules first, async slug-taken last.
// `required` only overrides the native browser message when our rule supplies
// one of its own.
function getSlugCustomValidity( validity?: FieldValidity ) {
	if ( validity?.required?.message ) {
		return validity.required;
	}
	if ( validity?.pattern ) {
		return validity.pattern;
	}
	if ( validity?.maxLength ) {
		return validity.maxLength;
	}
	return validity?.custom;
}
export function useSlugField(
	originalSlug?: string,
	currentValue?: string
): Field< TaxonomyFormData > {
	const registeredTaxonomies = useSelect(
		( select ) => select( coreStore ).getTaxonomies(),
		[]
	);
	const showRenameWarning =
		originalSlug !== undefined && currentValue !== originalSlug;
	return useMemo< Field< TaxonomyFormData > >(
		() => ( {
			id: 'slug',
			label: __( 'Taxonomy key' ),
			type: 'text',
			enableGlobalSearch: true,
			description: (
				<Stack direction="column" gap="sm" render={ <span /> }>
					{ showRenameWarning && (
						<Notice.Root intent="warning" render={ <span /> }>
							<Notice.Description>
								{ __(
									'Changing the key renames the taxonomy — existing terms may become inaccessible until a migration updates the database.'
								) }
							</Notice.Description>
						</Notice.Root>
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
				pattern: '^[a-z0-9_\\-]+$',
				maxLength: SLUG_MAX_LENGTH,
				custom: async ( value: TaxonomyFormData ) => {
					const slug = value.slug;
					if ( originalSlug !== undefined && slug === originalSlug ) {
						return null;
					}
					const slugTaken = ( registeredTaxonomies ?? [] ).some(
						( t: any ) => t.slug === slug
					);
					if ( slugTaken ) {
						return __( 'This taxonomy key is already in use.' );
					}
					// We only need to query for `drafts` because published taxonomies are checked through `registeredTaxonomies` above.
					const drafts = await resolveSelect(
						coreStore
					).getEntityRecords( 'postType', TAXONOMY_ENTITY, {
						slug,
						status: 'draft',
						_fields: 'id,name',
						per_page: 1,
					} );
					return !! drafts?.length
						? __( 'This taxonomy key is already in use.' )
						: null;
				},
			},
			Edit: function SlugEdit( {
				data,
				field,
				onChange,
				hideLabelFromVision,
				markWhenOptional,
				validity,
			}: DataFormControlProps< TaxonomyFormData > ) {
				const { label, description, getValue, setValue, isValid } =
					field;
				const value =
					( getValue( { item: data } ) as string | undefined ) ?? '';
				const handleChange = ( newValue: string ) =>
					onChange( setValue( { item: data, value: newValue } ) );
				const onFocus = () => {
					if ( data.id !== undefined || data.slug ) {
						return;
					}
					const singular = data.config.labels.singular_name?.trim();
					if ( ! singular ) {
						return;
					}
					const cleaned = cleanForSlug( singular );
					// On a fresh record fill the input from the singular label.
					// Skip auto-fill if cleanForSlug retained non-ASCII to match
					// the server's sanitize_key charset.
					if ( /[^a-z0-9_-]/.test( cleaned ) ) {
						return;
					}
					const trimmed = cleaned
						.slice( 0, SLUG_MAX_LENGTH )
						// Slicing can introduce a trailing hyphen — strip it.
						.replace( /-+$/, '' );
					if ( trimmed ) {
						handleChange( trimmed );
					}
				};
				return (
					<ValidatedInputControl
						__next40pxDefaultSize
						required={ !! isValid.required }
						markWhenOptional={ markWhenOptional }
						customValidity={ getSlugCustomValidity( validity ) }
						label={ label }
						value={ value }
						help={ description }
						onChange={ handleChange }
						onFocus={ onFocus }
						hideLabelFromVision={ hideLabelFromVision }
						pattern={ isValid.pattern?.constraint }
						maxLength={ isValid.maxLength?.constraint }
					/>
				);
			},
			filterBy: false,
			enableSorting: false,
		} ),
		[ registeredTaxonomies, originalSlug, showRenameWarning ]
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
			filterBy: { operators: [ 'isAny' ] },
		};
	}, [ publicPostTypes ] );
}

// The minimal form used by the quick-edit modal.
export const defaultForm: Form = {
	layout: { type: 'regular' },
	fields: [
		'plural_name',
		'singular_name',
		'slug',
		'object_type',
		'hierarchical',
		'status',
	],
};

export const generalFormFields: Form[ 'fields' ] = [
	'plural_name',
	'singular_name',
	'slug',
	'object_type',
	'description',
	'hierarchical',
	'status',
];
