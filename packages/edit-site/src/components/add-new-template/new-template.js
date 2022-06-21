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
import { useSelect } from '@wordpress/data';
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

/**
 * Internal dependencies
 */
import AddCustomTemplateModal from './add-custom-template-modal';
import { usePostTypes, usePostTypesEntitiesInfo } from './utils';
import { useHistory } from '../routes';

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
	const [ showCustomTemplateModal, setShowCustomTemplateModal ] = useState(
		false
	);
	const [ entityForSuggestions, setEntityForSuggestions ] = useState( {} );
	const { existingTemplates, defaultTemplateTypes, theme } = useSelect(
		( select ) => ( {
			existingTemplates: select( coreStore ).getEntityRecords(
				'postType',
				'wp_template',
				{ per_page: -1 }
			),
			defaultTemplateTypes: select(
				editorStore
			).__experimentalGetDefaultTemplateTypes(),
			theme: select( coreStore ).getCurrentTheme(),
		} ),
		[]
	);
	const postTypesEntitiesInfo = usePostTypesEntitiesInfo( existingTemplates );

	async function createTemplate( template ) {
		const { slug } = template;
		history.push( {
			postId: theme.stylesheet + '//' + slug.toString(),
			postType: 'wp_template',
		} );
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
