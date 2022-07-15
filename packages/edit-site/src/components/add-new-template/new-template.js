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
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
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
	layout as customGenericTemplateIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import AddCustomTemplateModal from './add-custom-template-modal';
import {
	useExistingTemplates,
	useDefaultTemplateTypes,
	entitiesConfig,
	usePostTypes,
	usePostTypePage,
	useTaxonomies,
	useTaxonomyCategory,
	useTaxonomyTag,
	useExtraTemplates,
} from './utils';
import AddCustomGenericTemplateModal from './add-custom-generic-template-modal';
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
	const [ showCustomTemplateModal, setShowCustomTemplateModal ] =
		useState( false );
	const [
		showCustomGenericTemplateModal,
		setShowCustomGenericTemplateModal,
	] = useState( false );
	const [ entityForSuggestions, setEntityForSuggestions ] = useState( {} );

	const history = useHistory();
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { setTemplate } = useDispatch( editSiteStore );

	async function createTemplate( template, isWPSuggestion = true ) {
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
					is_wp_suggestion: isWPSuggestion,
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

	const missingTemplates = useMissingTemplates(
		setEntityForSuggestions,
		setShowCustomTemplateModal
	);
	if ( ! missingTemplates.length ) {
		return null;
	}
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
						<MenuGroup>
							<MenuItem
								icon={ customGenericTemplateIcon }
								iconPosition="left"
								info={ __(
									'Custom templates can be applied to any post or page.'
								) }
								key="custom-template"
								onClick={ () =>
									setShowCustomGenericTemplateModal( true )
								}
							>
								{ __( 'Custom template' ) }
							</MenuItem>
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
			{ showCustomGenericTemplateModal && (
				<AddCustomGenericTemplateModal
					onClose={ () => setShowCustomGenericTemplateModal( false ) }
					createTemplate={ createTemplate }
				/>
			) }
		</>
	);
}

function useMissingTemplates(
	setEntityForSuggestions,
	setShowCustomTemplateModal
) {
	const postTypes = usePostTypes();
	const pagePostType = usePostTypePage();
	const taxonomies = useTaxonomies();
	const categoryTaxonomy = useTaxonomyCategory();
	const tagTaxonomy = useTaxonomyTag();

	const existingTemplates = useExistingTemplates();
	const defaultTemplateTypes = useDefaultTemplateTypes();

	const existingTemplateSlugs = ( existingTemplates || [] ).map(
		( { slug } ) => slug
	);

	const missingDefaultTemplates = ( defaultTemplateTypes || [] ).filter(
		( template ) =>
			DEFAULT_TEMPLATE_SLUGS.includes( template.slug ) &&
			! existingTemplateSlugs.includes( template.slug )
	);
	const onClickMenuItem = ( _entityForSuggestions ) => {
		setShowCustomTemplateModal( true );
		setEntityForSuggestions( _entityForSuggestions );
	};
	// TODO: find better names for these variables. `useExtraTemplates` returns an array of items.
	const categoryMenuItem = useExtraTemplates(
		categoryTaxonomy,
		entitiesConfig.category,
		onClickMenuItem
	);
	const tagMenuItem = useExtraTemplates(
		tagTaxonomy,
		entitiesConfig.tag,
		onClickMenuItem
	);
	const pageMenuItem = useExtraTemplates(
		pagePostType,
		entitiesConfig.page,
		onClickMenuItem
	);
	// We need to replace existing default template types with
	// the create specific template functionality. The original
	// info (title, description, etc.) is preserved in the
	// `useExtraTemplates` hook.
	const enhancedMissingDefaultTemplateTypes = [ ...missingDefaultTemplates ];
	[ categoryMenuItem, tagMenuItem, pageMenuItem ].forEach( ( menuItem ) => {
		if ( ! menuItem?.length ) {
			return;
		}
		const matchIndex = enhancedMissingDefaultTemplateTypes.findIndex(
			( template ) => template.slug === menuItem[ 0 ].slug
		);
		// Some default template types might have been filtered above from
		// `missingDefaultTemplates` because they only check for the general
		// template. So here we either replace or append the item, augmented
		// with the check if it has available specific item to create a
		// template for.
		if ( matchIndex > -1 ) {
			enhancedMissingDefaultTemplateTypes.splice(
				matchIndex,
				1,
				menuItem[ 0 ]
			);
		} else {
			enhancedMissingDefaultTemplateTypes.push( menuItem[ 0 ] );
		}
	} );
	// Update the sort order to match the DEFAULT_TEMPLATE_SLUGS order.
	enhancedMissingDefaultTemplateTypes?.sort( ( template1, template2 ) => {
		return (
			DEFAULT_TEMPLATE_SLUGS.indexOf( template1.slug ) -
			DEFAULT_TEMPLATE_SLUGS.indexOf( template2.slug )
		);
	} );
	const extraPostTypeTemplates = useExtraTemplates(
		postTypes,
		entitiesConfig.postType,
		onClickMenuItem
	);
	const extraTaxonomyTemplates = useExtraTemplates(
		taxonomies,
		entitiesConfig.taxonomy,
		onClickMenuItem
	);
	const missingTemplates = [
		...enhancedMissingDefaultTemplateTypes,
		...extraPostTypeTemplates,
		...extraTaxonomyTemplates,
	];
	return missingTemplates;
}
