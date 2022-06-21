/**
 * External dependencies
 */
import { filter, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	NavigableMenu,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
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
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import AddCustomTemplateModal from './add-custom-template-modal';
import { usePostTypes, usePostTypesEntitiesInfo } from './utils';
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
	const postTypes = usePostTypes();
	const [ showCustomTemplateModal, setShowCustomTemplateModal ] =
		useState( false );
	const [ entityForSuggestions, setEntityForSuggestions ] = useState( {} );
	const { existingTemplates, defaultTemplateTypes } = useSelect(
		( select ) => ( {
			existingTemplates: select( coreStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			),
			defaultTemplateTypes:
				select( editorStore ).__experimentalGetDefaultTemplateTypes(),
		} ),
		[]
	);
	const postTypesEntitiesInfo = usePostTypesEntitiesInfo( existingTemplates );
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
	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);
	const missingTemplates = filter(
		defaultTemplateTypes,
		( template ) =>
			includes( DEFAULT_TEMPLATE_SLUGS, template.slug ) &&
			! includes( existingTemplateSlugs, template.slug )
	);

	const extraTemplates = ( postTypes || [] ).reduce(
		( accumulator, _postType ) => {
			const { slug, labels, icon } = _postType;
			const hasGeneralTemplate = existingTemplateSlugs?.includes(
				`single-${ slug }`
			);
			const hasEntities = postTypesEntitiesInfo?.[ slug ]?.hasEntities;
			const menuItem = {
				slug: `single-${ slug }`,
				title: sprintf(
					// translators: %s: Name of the post type e.g: "Post".
					__( 'Single item: %s' ),
					labels.singular_name
				),
				description: sprintf(
					// translators: %s: Name of the post type e.g: "Post".
					__( 'Displays a single item: %s.' ),
					labels.singular_name
				),
				// `icon` is the `menu_icon` property of a post type. We
				// only handle `dashicons` for now, even if the `menu_icon`
				// also supports urls and svg as values.
				icon: icon?.startsWith( 'dashicons-' )
					? icon.slice( 10 )
					: null,
			};
			// We have a different template creation flow only if they have entities.
			if ( hasEntities ) {
				menuItem.onClick = ( template ) => {
					setShowCustomTemplateModal( true );
					setEntityForSuggestions( {
						type: 'postType',
						slug,
						labels,
						hasGeneralTemplate,
						template,
						postsToExclude:
							postTypesEntitiesInfo[ slug ].existingPosts,
					} );
				};
			}
			// We don't need to add the menu item if there are no
			// entities and the general template exists.
			if ( ! hasGeneralTemplate || hasEntities ) {
				accumulator.push( menuItem );
			}
			return accumulator;
		},
		[]
	);
	if ( ! missingTemplates.length && ! extraTemplates.length ) {
		return null;
	}
	// Update the sort order to match the DEFAULT_TEMPLATE_SLUGS order.
	missingTemplates?.sort( ( template1, template2 ) => {
		return (
			DEFAULT_TEMPLATE_SLUGS.indexOf( template1.slug ) -
			DEFAULT_TEMPLATE_SLUGS.indexOf( template2.slug )
		);
	} );
	// Append all extra templates at the end of the list for now.
	missingTemplates.push( ...extraTemplates );
	return (
		<>
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
							{ missingTemplates.map( ( template ) => {
								const {
									title,
									description,
									slug,
									onClick,
									icon,
								} = template;
								return (
									<MenuItem
										icon={
											icon ||
											TEMPLATE_ICONS[ slug ] ||
											post
										}
										iconPosition="left"
										info={ description }
										key={ slug }
										onClick={ () =>
											onClick
												? onClick( template )
												: createTemplate( template )
										}
									>
										{ title }
									</MenuItem>
								);
							} ) }
						</MenuGroup>
					</NavigableMenu>
				) }
			</DropdownMenu>
			{ showCustomTemplateModal && (
				<AddCustomTemplateModal
					onClose={ () => setShowCustomTemplateModal( false ) }
					onSelect={ createTemplate }
					entityForSuggestions={ entityForSuggestions }
				/>
			) }
		</>
	);
}
