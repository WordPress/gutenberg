/**
 * WordPress dependencies
 */
import type { Field, Option } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { resolveSelect } from '@wordpress/data';
import type { WpTemplate } from '@wordpress/core-data';
import { store as coreDataStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

const EMPTY_ARRAY: [] = [];

const templateField: Field< BasePost > = {
	id: 'template',
	type: 'text',
	label: __( 'Template' ),
	getElements: async ( args ) => {
		// LIST OF CUSTOM TEMPLATES
		// This uses the same logic as the editor inspector
		// (useAvailableTemplates hook at packages/editor/src/components/post-template/hooks.js).
		const templates: WpTemplate[] =
			( await resolveSelect( coreDataStore ).getEntityRecords(
				'postType',
				'wp_template',
				{
					per_page: -1,
					post_type: args?.item?.type || 'page',
				}
			) ) ?? EMPTY_ARRAY;
		const templateElements = templates
			.filter(
				( template ) => template.is_custom && !! template.content.raw // Skip empty templates.
			)
			.map( ( { slug, title } ) => ( {
				value: slug,
				label: title.rendered || slug,
			} ) );

		// CURRENT TEMPLATE
		// This uses the same logic as the editor inspector
		// (BlockThemeControl at packages/editor/src/components/post-template/block-theme.js)
		let slugToCheck;
		const postType = args?.item?.type;
		const slug = args?.item?.slug;
		// In `draft` status we might not have a slug available, so we use the `single`
		// post type templates slug(ex page, single-post, single-product etc..).
		// Pages do not need the `single` prefix in the slug to be prioritized
		// through template hierarchy.
		if ( slug ) {
			slugToCheck =
				postType === 'page'
					? `${ postType }-${ slug }`
					: `single-${ postType }-${ slug }`;
		} else {
			slugToCheck = postType === 'page' ? 'page' : `single-${ postType }`;
		}

		let currentTemplateElement: Option | undefined;
		if ( postType ) {
			const templateId = await resolveSelect(
				coreDataStore
			).getDefaultTemplateId( {
				slug: slugToCheck,
			} );

			const currentTemplate = ( await resolveSelect(
				coreDataStore
			).getEntityRecord( 'postType', 'wp_template', templateId ) ) as
				| WpTemplate
				| undefined;
			if ( currentTemplate ) {
				currentTemplateElement = {
					// If the template field is empty it means it'll be matched to a template from the hierarchy,
					// which is the current template. Instead of using the currentTemplate.slug as value,
					// we want to use the empty string so that this element is the one selected in the control.
					// And, inversely, when selecting this element, the user will be resetting the template
					// to the default value.
					value: '',
					label: decodeEntities( currentTemplate.title.rendered ),
				};
			}
		}

		return [ currentTemplateElement, ...templateElements ].filter(
			( item ): item is Option => !! item
		);
	},
	enableSorting: false,
	filterBy: false,
};

/**
 * Template field for BasePost.
 */
export default templateField;
