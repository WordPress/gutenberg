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
import { POST_TYPE_ENTITY } from '../../constants';
import { SUPPORT_FEATURES, usePublicTaxonomies } from '../utils';
import type { PostTypeFormData, SupportFeature } from '../types';

const { ValidatedInputControl } = unlock( componentsPrivateApis );

const SUPPORT_LABELS: Record< SupportFeature, string > = {
	title: __( 'Title' ),
	editor: __( 'Editor' ),
	thumbnail: __( 'Featured image' ),
	excerpt: __( 'Excerpt' ),
	comments: __( 'Comments' ),
	revisions: __( 'Revisions' ),
	author: __( 'Author' ),
	'page-attributes': __( 'Page attributes' ),
	'custom-fields': __( 'Custom fields' ),
	trackbacks: __( 'Trackbacks' ),
	'post-formats': __( 'Post formats' ),
};

export const titleField: Field< PostTypeFormData > = {
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

export const pluralLabelField: Field< PostTypeFormData > = {
	id: 'plural_name',
	label: __( 'Plural label' ),
	type: 'text',
	getValue: ( { item } ) => item.title.raw,
	setValue: ( { value } ) => ( { title: { raw: String( value ?? '' ) } } ),
	isValid: { required: true },
};

export const singularLabelField: Field< PostTypeFormData > = {
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

export const descriptionField: Field< PostTypeFormData > = {
	id: 'description',
	label: __( 'Description' ),
	type: 'text',
	Edit: { control: 'textarea', rows: 3 },
	description: __(
		'Optional summary of the post type. Shown in admin UIs that surface post type details.'
	),
	getValue: ( { item } ) => item.config.description,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, description: String( value ?? '' ) },
	} ),
	enableSorting: false,
};

export const publicField: Field< PostTypeFormData > = {
	id: 'public',
	label: __( 'Public' ),
	type: 'boolean',
	description: __(
		'Whether the post type is intended for use publicly either via the admin interface or by front-end users.'
	),
	getValue: ( { item } ) => item.config.public,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, public: !! value },
	} ),
	filterBy: false,
	enableSorting: false,
};

export const hierarchicalField: Field< PostTypeFormData > = {
	id: 'hierarchical',
	label: __( 'Hierarchical' ),
	type: 'boolean',
	description: __(
		'When on, posts of this type can have parent-child relationships like pages, and the parent picker is shown in the editor. When off, they behave like posts.'
	),
	getValue: ( { item } ) => item.config.hierarchical,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, hierarchical: !! value },
	} ),
	filterBy: false,
	enableSorting: false,
};

export const hasArchiveField: Field< PostTypeFormData > = {
	id: 'has_archive',
	label: __( 'Has archive' ),
	type: 'boolean',
	description: __(
		'Whether the post type has an archive page (e.g. /book/). Requires permalink rewrite rules to be flushed after enabling.'
	),
	getValue: ( { item } ) => item.config.has_archive,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, has_archive: !! value },
	} ),
	filterBy: false,
	enableSorting: false,
};

export const showInRestField: Field< PostTypeFormData > = {
	id: 'show_in_rest',
	label: __( 'Show in REST API' ),
	type: 'boolean',
	description: __(
		'Required for the block editor. Disable only if posts of this type should not be available via the REST API.'
	),
	getValue: ( { item } ) => item.config.show_in_rest,
	setValue: ( { item, value } ) => ( {
		config: { ...item.config, show_in_rest: !! value },
	} ),
	filterBy: false,
	enableSorting: false,
};

export const supportsField: Field< PostTypeFormData > = {
	id: 'supports',
	label: __( 'Supports' ),
	type: 'array',
	description: __(
		'Editor features and metadata enabled for posts of this type.'
	),
	elements: SUPPORT_FEATURES.map( ( feature ) => ( {
		value: feature,
		label: SUPPORT_LABELS[ feature ],
	} ) ),
	enableSorting: false,
	getValue: ( { item } ) => item.config.supports,
	setValue: ( { item, value } ) => ( {
		config: {
			...item.config,
			supports: Array.isArray( value )
				? ( value.filter( ( v ): v is SupportFeature =>
						SUPPORT_FEATURES.includes( v as SupportFeature )
				  ) as SupportFeature[] )
				: [],
		},
	} ),
	render: ( { item } ) => {
		const features = item.config.supports;
		if ( ! features || features.length === 0 ) {
			return <span aria-hidden="true">—</span>;
		}
		return (
			<>
				{ features
					.map( ( f ) => SUPPORT_LABELS[ f ] ?? f )
					.join( ', ' ) }
			</>
		);
	},
	filterBy: false,
};

export const statusField: Field< PostTypeFormData > = {
	id: 'status',
	label: __( 'Status' ),
	description: __(
		'Active post types are enabled and registered with WordPress.'
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

const SLUG_MAX_LENGTH = 20;
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
): Field< PostTypeFormData > {
	const registeredPostTypes = useSelect(
		( select ) => select( coreStore ).getPostTypes(),
		[]
	);
	const showRenameWarning =
		originalSlug !== undefined && currentValue !== originalSlug;
	return useMemo< Field< PostTypeFormData > >(
		() => ( {
			id: 'slug',
			label: __( 'Post type key' ),
			type: 'text',
			enableGlobalSearch: true,
			description: (
				<Stack direction="column" gap="sm" render={ <span /> }>
					{ showRenameWarning && (
						<Notice.Root intent="warning" render={ <span /> }>
							<Notice.Description>
								{ __(
									'Changing the key renames the post type — existing posts may become inaccessible until a migration updates the database.'
								) }
							</Notice.Description>
						</Notice.Root>
					) }
					<span>
						{ __(
							'Lower case letters, numbers, underscores, and dashes only. Maximum length: 20 characters.'
						) }
					</span>
				</Stack>
			),
			isValid: {
				required: true,
				pattern: '^[a-z0-9_\\-]+$',
				maxLength: SLUG_MAX_LENGTH,
				custom: async ( value: PostTypeFormData ) => {
					const slug = value.slug;
					if ( originalSlug !== undefined && slug === originalSlug ) {
						return null;
					}
					const slugTaken = ( registeredPostTypes ?? [] ).some(
						( pt: any ) => pt.slug === slug
					);
					if ( slugTaken ) {
						return __( 'This post type key is already in use.' );
					}
					// We only need to query for `drafts` because published post
					// types are checked through `registeredPostTypes` above.
					const drafts = await resolveSelect(
						coreStore
					).getEntityRecords( 'postType', POST_TYPE_ENTITY, {
						slug,
						status: 'draft',
						_fields: 'id,name',
						per_page: 1,
					} );
					return !! drafts?.length
						? __( 'This post type key is already in use.' )
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
			}: DataFormControlProps< PostTypeFormData > ) {
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
		[ registeredPostTypes, originalSlug, showRenameWarning ]
	);
}

export function useTaxonomiesField(): Field< PostTypeFormData > {
	const publicTaxonomies = usePublicTaxonomies();
	return useMemo< Field< PostTypeFormData > >( () => {
		const elements = ( publicTaxonomies ?? [] ).map( ( tax: any ) => ( {
			value: tax.slug as string,
			label: tax.name as string,
		} ) );
		const labelMap: Record< string, string > = Object.fromEntries(
			elements.map( ( e ) => [ e.value, e.label ] )
		);
		return {
			id: 'taxonomies',
			label: __( 'Taxonomies' ),
			type: 'array',
			description: __(
				'One or more taxonomies that should be associated with this post type.'
			),
			elements,
			enableSorting: false,
			getValue: ( { item } ) => item.config.taxonomies,
			setValue: ( { item, value } ) => ( {
				config: {
					...item.config,
					taxonomies: Array.isArray( value ) ? value : [],
				},
			} ),
			render: ( { item } ) => {
				const slugs = item.config.taxonomies;
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
			filterBy: false,
		};
	}, [ publicTaxonomies ] );
}

// The minimal form used by the quick-edit modal.
export const defaultForm: Form = {
	layout: { type: 'regular' },
	fields: [
		'plural_name',
		'singular_name',
		'slug',
		'taxonomies',
		'public',
		'hierarchical',
		'has_archive',
		'status',
	],
};

export const generalForm: Form = {
	layout: { type: 'regular' },
	fields: [
		'plural_name',
		'singular_name',
		'slug',
		'description',
		'taxonomies',
		'supports',
		'public',
		'hierarchical',
		'has_archive',
		'show_in_rest',
		'status',
	],
};
