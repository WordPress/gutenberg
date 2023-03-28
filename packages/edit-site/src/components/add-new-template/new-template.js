/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Tooltip,
	VisuallyHidden,
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
	plus,
	post,
	postAuthor,
	postDate,
	search,
	tag,
	layout as customGenericTemplateIcon,
} from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import AddCustomTemplateModal from './add-custom-template-modal';
import {
	useExistingTemplates,
	useDefaultTemplateTypes,
	useTaxonomiesMenuItems,
	usePostTypeMenuItems,
	useAuthorMenuItem,
	usePostTypeArchiveMenuItems,
} from './utils';
import AddCustomGenericTemplateModal from './add-custom-generic-template-modal';
import TemplateActionsLoadingScreen from './template-actions-loading-screen';
import { useHistory } from '../routes';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../private-apis';

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

export default function NewTemplate( {
	postType,
	toggleProps,
	showIcon = true,
} ) {
	const [ showCustomTemplateModal, setShowCustomTemplateModal ] =
		useState( false );
	const [
		showCustomGenericTemplateModal,
		setShowCustomGenericTemplateModal,
	] = useState( false );
	const [ entityForSuggestions, setEntityForSuggestions ] = useState( {} );
	const [ isCreatingTemplate, setIsCreatingTemplate ] = useState( false );

	const history = useHistory();
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { setTemplate } = unlock( useDispatch( editSiteStore ) );
	async function createTemplate( template, isWPSuggestion = true ) {
		if ( isCreatingTemplate ) {
			return;
		}
		setIsCreatingTemplate( true );
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
				canvas: 'edit',
			} );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created template e.g: "Category".
					__( '"%s" successfully created.' ),
					newTemplate.title?.rendered || title
				),
				{
					type: 'snackbar',
				}
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the template.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		} finally {
			setIsCreatingTemplate( false );
		}
	}

	const missingTemplates = useMissingTemplates(
		setEntityForSuggestions,
		setShowCustomTemplateModal
	);
	if ( ! missingTemplates.length ) {
		return null;
	}

	const customTemplateDescription = __(
		'A custom template can be manually applied to any post or page.'
	);

	return (
		<>
			<DropdownMenu
				className="edit-site-new-template-dropdown"
				icon={ showIcon ? plus : null }
				text={ showIcon ? null : postType.labels.add_new }
				label={ postType.labels.add_new_item }
				popoverProps={ {
					noArrow: false,
				} }
				toggleProps={ toggleProps }
			>
				{ () => (
					<>
						{ isCreatingTemplate && (
							<TemplateActionsLoadingScreen />
						) }
						<div className="edit-site-new-template-dropdown__menu-groups">
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
										<Tooltip
											key={ slug }
											position="top right"
											text={ description }
											className="edit-site-new-template-dropdown__menu-item-tooltip"
										>
											<MenuItem
												icon={
													icon ||
													TEMPLATE_ICONS[ slug ] ||
													post
												}
												iconPosition="left"
												onClick={ () =>
													onClick
														? onClick( template )
														: createTemplate(
																template
														  )
												}
											>
												{ title }
												{ /* TODO: This probably won't be needed if the <Tooltip> component is accessible.
												 * @see https://github.com/WordPress/gutenberg/issues/48222 */ }
												<VisuallyHidden>
													{ description }
												</VisuallyHidden>
											</MenuItem>
										</Tooltip>
									);
								} ) }
							</MenuGroup>
							<MenuGroup>
								<Tooltip
									position="top right"
									text={ customTemplateDescription }
									className="edit-site-new-template-dropdown__menu-item-tooltip"
								>
									<MenuItem
										icon={ customGenericTemplateIcon }
										iconPosition="left"
										onClick={ () =>
											setShowCustomGenericTemplateModal(
												true
											)
										}
									>
										{ __( 'Custom template' ) }
										{ /* TODO: This probably won't be needed if the <Tooltip> component is accessible.
										 * @see https://github.com/WordPress/gutenberg/issues/48222 */ }
										<VisuallyHidden>
											{ customTemplateDescription }
										</VisuallyHidden>
									</MenuItem>
								</Tooltip>
							</MenuGroup>
						</div>
					</>
				) }
			</DropdownMenu>
			{ showCustomTemplateModal && (
				<AddCustomTemplateModal
					onClose={ () => setShowCustomTemplateModal( false ) }
					onSelect={ createTemplate }
					entityForSuggestions={ entityForSuggestions }
					isCreatingTemplate={ isCreatingTemplate }
				/>
			) }
			{ showCustomGenericTemplateModal && (
				<AddCustomGenericTemplateModal
					onClose={ () => setShowCustomGenericTemplateModal( false ) }
					createTemplate={ createTemplate }
					isCreatingTemplate={ isCreatingTemplate }
				/>
			) }
		</>
	);
}

function useMissingTemplates(
	setEntityForSuggestions,
	setShowCustomTemplateModal
) {
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
	// We need to replace existing default template types with
	// the create specific template functionality. The original
	// info (title, description, etc.) is preserved in the
	// used hooks.
	const enhancedMissingDefaultTemplateTypes = [ ...missingDefaultTemplates ];
	const { defaultTaxonomiesMenuItems, taxonomiesMenuItems } =
		useTaxonomiesMenuItems( onClickMenuItem );
	const { defaultPostTypesMenuItems, postTypesMenuItems } =
		usePostTypeMenuItems( onClickMenuItem );

	const authorMenuItem = useAuthorMenuItem( onClickMenuItem );
	[
		...defaultTaxonomiesMenuItems,
		...defaultPostTypesMenuItems,
		authorMenuItem,
	].forEach( ( menuItem ) => {
		if ( ! menuItem ) {
			return;
		}
		const matchIndex = enhancedMissingDefaultTemplateTypes.findIndex(
			( template ) => template.slug === menuItem.slug
		);
		// Some default template types might have been filtered above from
		// `missingDefaultTemplates` because they only check for the general
		// template. So here we either replace or append the item, augmented
		// with the check if it has available specific item to create a
		// template for.
		if ( matchIndex > -1 ) {
			enhancedMissingDefaultTemplateTypes[ matchIndex ] = menuItem;
		} else {
			enhancedMissingDefaultTemplateTypes.push( menuItem );
		}
	} );
	// Update the sort order to match the DEFAULT_TEMPLATE_SLUGS order.
	enhancedMissingDefaultTemplateTypes?.sort( ( template1, template2 ) => {
		return (
			DEFAULT_TEMPLATE_SLUGS.indexOf( template1.slug ) -
			DEFAULT_TEMPLATE_SLUGS.indexOf( template2.slug )
		);
	} );
	const missingTemplates = [
		...enhancedMissingDefaultTemplateTypes,
		...usePostTypeArchiveMenuItems(),
		...postTypesMenuItems,
		...taxonomiesMenuItems,
	];
	return missingTemplates;
}
