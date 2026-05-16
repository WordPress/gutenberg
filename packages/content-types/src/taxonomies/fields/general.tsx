/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { Field, Form } from '@wordpress/dataviews';
import { addQueryArgs } from '@wordpress/url';
// eslint-disable-next-line @wordpress/use-recommended-components -- Used here because it supports rendering as a `span` via the `render` prop to avoid invalid HTML.
import { Link, Notice, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { TAXONOMY_ENTITY } from '../../constants';
import {
	createBooleanField,
	createDescriptionField,
	SlugEdit,
} from '../../utils/fields';
import { OverflowingBadges } from '../../utils/overflowing-badges';
import { usePublicPostTypes } from '../utils';
import type { TaxonomyFormData } from '../types';

export const descriptionField = createDescriptionField(
	__(
		'Optional summary of the taxonomy. Shown in admin UIs that surface taxonomy details.'
	)
);

export const hierarchicalField = createBooleanField(
	'hierarchical',
	__( 'Hierarchical' ),
	{
		description: __(
			'When on, terms behave like categories with parent-child relationships. When off, terms behave like tags.'
		),
	}
);

const SLUG_MAX_LENGTH = 32;

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
					// We only need to query for `drafts` because published
					// taxonomies are checked through `registeredTaxonomies` above.
					const drafts = await resolveSelect(
						coreStore
					).getEntityRecords( 'postType', TAXONOMY_ENTITY, {
						slug,
						status: 'draft',
						_fields: 'id,name',
						per_page: 1,
					} );
					return drafts?.length
						? __( 'This taxonomy key is already in use.' )
						: null;
				},
			},
			Edit: SlugEdit,
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
					<OverflowingBadges
						items={ slugs.map( ( s ) => ( {
							key: s,
							label: labelMap[ s ] ?? s,
						} ) ) }
					/>
				);
			},
			isValid: { required: true },
			filterBy: { operators: [ 'isAny' ] },
		};
	}, [ publicPostTypes ] );
}

export const countField: Field< TaxonomyFormData > = {
	id: 'count',
	label: __( 'Terms' ),
	type: 'integer',
	readOnly: true,
	render: ( { item } ) => {
		const count = item.count;
		if ( item.status !== 'publish' || ! count ) {
			return <span aria-hidden="true">—</span>;
		}
		const postType = item.config.object_type?.[ 0 ];
		// `edit-tags.php` requires a `post_type` arg, so a taxonomy with no
		// attached post types can't be linked even when it has terms.
		if ( ! postType ) {
			return count;
		}
		return (
			<Link
				href={ addQueryArgs( 'edit-tags.php', {
					taxonomy: item.slug,
					post_type: postType,
				} ) }
			>
				{ count }
			</Link>
		);
	},
	enableSorting: false,
	filterBy: false,
};

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
