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
import { usePostTypes, usePostTypesHaveEntities } from './utils';
import { useHistory } from '../routes';
import { store as editSiteStore } from '../../store';

// TODO: check why we need info from `__experimentalGetDefaultTemplateTypes` and here in js..
const DEFAULT_TEMPLATE_SLUGS = [
	'front-page',
	// TODO: Info about this need to be change from `post` to make it clear we are creating `single` template.
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
	const postTypesHaveEntities = usePostTypesHaveEntities();
	const [ showCustomTemplateModal, setShowCustomTemplateModal ] = useState(
		false
	);
	const [ entityForSuggestions, setEntityForSuggestions ] = useState( {} );
	const { existingTemplates, defaultTemplateTypes } = useSelect(
		( select ) => ( {
			existingTemplates: select( coreStore ).getEntityRecords(
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

	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);

	// TODO: rename to missingDefaultTemplates(or combine these arrays like`missingPostTypeTemplates`).
	// Also it's weird that we don't have a single source of truth for the default templates. Needs looking..
	const missingTemplates = filter(
		defaultTemplateTypes,
		( template ) =>
			includes( DEFAULT_TEMPLATE_SLUGS, template.slug ) &&
			! includes( existingTemplateSlugs, template.slug )
	);

	// TODO: make all strings translatable.
	const extraTemplates = ( postTypes || [] ).reduce(
		( accumulator, _postType ) => {
			const {
				slug,
				labels: { singular_name: singularName },
				menu_icon: icon,
				name,
			} = _postType;
			const hasGeneralTemplate = existingTemplateSlugs?.includes(
				`single-${ slug }`
			);
			const hasEntities = postTypesHaveEntities?.[ slug ];
			const menuItem = {
				slug: `single-${ slug }`,
				title: sprintf(
					// translators: %s: Name of the post type e.g: "Post".
					__( 'Single %s' ),
					singularName
				),
				// title: `Single ${ singularName }`,
				description: sprintf(
					// translators: %s: Name of the post type e.g: "Post".
					__( 'Displays a single %s.' ),
					singularName
				),
				icon,
			};
			// We have a different template creation flow only if they have entities.
			if ( hasEntities ) {
				menuItem.onClick = ( template ) => {
					const slugsWithTemplates = (
						existingTemplates || []
					).reduce( ( _accumulator, existingTemplate ) => {
						const prefix = `single-${ slug }-`;
						if ( existingTemplate.slug.startsWith( prefix ) ) {
							_accumulator.push(
								existingTemplate.slug.substring( prefix.length )
							);
						}
						return _accumulator;
					}, [] );
					setShowCustomTemplateModal( true );
					setEntityForSuggestions( {
						type: 'postType',
						slug,
						labels: { singular: singularName, plural: name },
						hasGeneralTemplate,
						template,
						slugsWithTemplates,
					} );
				};
			}
			// We don't need to add the menu item if there are no
			// entities and the general template exists.
			if ( ! hasGeneralTemplate || hasEntities ) {
				accumulator.push( menuItem );
			}
			// Add conditionally the `archive-$post_type` item.
			// `post` is a special post type and doesn't have `archive-post`.
			if (
				slug !== 'post' &&
				! existingTemplateSlugs?.includes( `archive-${ slug }` )
			) {
				accumulator.push( {
					slug: `archive-${ slug }`,
					title: sprintf(
						// translators: %s: Name of the post type e.g: "Post".
						__( '%s archive' ),
						singularName
					),
					description: sprintf(
						// translators: %s: Name of the post type in plural e.g: "Posts".
						__( 'Displays archive of %s.' ),
						name
					),
					icon,
				} );
			}
			return accumulator;
		},
		[]
	);
	// TODO: better handling here.
	if ( ! missingTemplates.length && ! extraTemplates.length ) {
		return null;
	}
	// Update the sort order to match the DEFAULT_TEMPLATE_SLUGS order.
	// TODO: check sorting with new items.
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
											!! onClick
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
