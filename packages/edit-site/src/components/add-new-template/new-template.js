/**
 * External dependencies
 */
import { filter, includes, map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import {
	archive,
	blockMeta,
	category,
	home,
	list,
	media,
	notFound,
	page,
	post,
	postAuthor,
	postDate,
	search,
	tag,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';
import { store as editSiteStore } from '../../store';

const DEFAULT_TEMPLATE_SLUGS = [
	'front-page',
	'single',
	'page',
	'index',
	'archive',
	'author',
	'category',
	'date',
	'tag',
	'taxonomy',
	'search',
	'404',
];

const TEMPLATE_ICONS = {
	'front-page': home,
	single: post,
	page,
	archive,
	search,
	404: notFound,
	index: list,
	category,
	author: postAuthor,
	taxonomy: blockMeta,
	date: postDate,
	tag,
	attachment: media,
};

export default function NewTemplate( { postType } ) {
	const history = useHistory();
	const { templates, defaultTemplateTypes } = useSelect(
		( select ) => ( {
			templates: select( coreStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			),
			defaultTemplateTypes: select(
				editorStore
			).__experimentalGetDefaultTemplateTypes(),
		} ),
		[]
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { setTemplate } = useDispatch( editSiteStore );

	async function createTemplate( template ) {
		try {
			const { title, description, slug } = template;

			const newTemplate = await saveEntityRecord(
				'postType',
				'wp_template',
				{
					description,
					// Slugs need to be strings, so this is for template `404`
					slug: slug.toString(),
					status: 'publish',
					title,
					// This adds a post meta field in template that is part of `is_custom` value calculation.
					is_wp_suggestion: true,
				},
				{ throwOnError: true }
			);

			// Set template before navigating away to avoid initial stale value.
			setTemplate( newTemplate.id, newTemplate.slug );

			// Navigate to the created template editor.
			history.push( {
				postId: newTemplate.id,
				postType: newTemplate.type,
			} );

			// TODO: Add a success notice?
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the template.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	}

	const existingTemplateSlugs = map( templates, 'slug' );

	const missingTemplates = filter(
		defaultTemplateTypes,
		( template ) =>
			includes( DEFAULT_TEMPLATE_SLUGS, template.slug ) &&
			! includes( existingTemplateSlugs, template.slug )
	);

	if ( ! missingTemplates.length ) {
		return null;
	}

	// Update the sort order to match the DEFAULT_TEMPLATE_SLUGS order.
	missingTemplates.sort( ( template1, template2 ) => {
		return (
			DEFAULT_TEMPLATE_SLUGS.indexOf( template1.slug ) -
			DEFAULT_TEMPLATE_SLUGS.indexOf( template2.slug )
		);
	} );

	return (
		<DropdownMenu
			className="edit-site-new-template-dropdown"
			icon={ null }
			text={ postType.labels.add_new }
			label={ postType.labels.add_new_item }
			popoverProps={ {
				noArrow: false,
			} }
			toggleProps={ {
				variant: 'primary',
			} }
		>
			{ () => (
				<NavigableMenu className="edit-site-new-template-dropdown__popover">
					<MenuGroup label={ postType.labels.add_new_item }>
						{ map( missingTemplates, ( template ) => {
							const { title, description, slug } = template;
							return (
								<MenuItem
									icon={ TEMPLATE_ICONS[ slug ] }
									iconPosition="left"
									info={ description }
									key={ slug }
									onClick={ () => {
										createTemplate( template );
										// We will be navigated way so no need to close the dropdown.
									} }
								>
									{ title }
								</MenuItem>
							);
						} ) }
					</MenuGroup>
				</NavigableMenu>
			) }
		</DropdownMenu>
	);
}
