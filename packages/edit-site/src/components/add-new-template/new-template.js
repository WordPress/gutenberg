/**
 * External dependencies
 */
import { filter, find, includes, map } from 'lodash';

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
	home,
	post,
	page,
	archive,
	search,
	close as closeIcon,
	list,
	category,
	postAuthor,
	postDate,
	postTerms,
	tag,
	media,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { useHistory } from '../routes';

const DEFAULT_TEMPLATE_SLUGS = [
	'front-page',
	'single-post',
	'page',
	'index',
	'archive',
	'attachment',
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
	'single-post': post,
	page,
	archive,
	search,
	404: closeIcon,
	index: list,
	category,
	author: postAuthor,
	taxonomy: postTerms,
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
	const { getLastEntitySaveError } = useSelect( coreStore );

	async function createTemplate( { slug } ) {
		try {
			const { title, description } = find( defaultTemplateTypes, {
				slug,
			} );

			const template = await saveEntityRecord(
				'postType',
				'wp_template',
				{
					excerpt: description,
					// Slugs need to be strings, so this is for template `404`
					slug: slug.toString(),
					status: 'publish',
					title,
				}
			);

			const lastEntitySaveError = getLastEntitySaveError(
				'postType',
				'wp_template',
				template.id
			);
			if ( lastEntitySaveError ) {
				throw lastEntitySaveError;
			}

			// Navigate to the created template editor.
			history.push( {
				postId: template.id,
				postType: template.type,
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
						{ map(
							missingTemplates,
							( { title, description, slug } ) => (
								<MenuItem
									icon={ TEMPLATE_ICONS[ slug ] }
									iconPosition="left"
									info={ description }
									key={ slug }
									onClick={ () => {
										createTemplate( { slug } );
										// We will be navigated way so no need to close the dropdown.
									} }
								>
									{ title }
								</MenuItem>
							)
						) }
					</MenuGroup>
				</NavigableMenu>
			) }
		</DropdownMenu>
	);
}
