/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalGrid as Grid,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Flex,
	Icon,
} from '@wordpress/components';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, memo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useViewportMatch } from '@wordpress/compose';
import {
	archive,
	blockMeta,
	calendar,
	category,
	commentAuthorAvatar,
	edit,
	home,
	layout,
	list,
	media,
	notFound,
	page,
	pin,
	verse,
	search,
	tag,
} from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

/**
 * Internal dependencies
 */
import AddCustomTemplateModalContent from './add-custom-template-modal-content';
import {
	useExistingTemplates,
	useDefaultTemplateTypes,
	useTaxonomiesMenuItems,
	usePostTypeMenuItems,
	useAuthorMenuItem,
	usePostTypeArchiveMenuItems,
} from './utils';
import AddCustomGenericTemplateModalContent from './add-custom-generic-template-modal-content';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

const DEFAULT_TEMPLATE_SLUGS = [
	'front-page',
	'home',
	'single',
	'page',
	'index',
	'archive',
	'author',
	'category',
	'date',
	'tag',
	'search',
	'404',
];

const TEMPLATE_ICONS = {
	'front-page': home,
	home: verse,
	single: pin,
	page,
	archive,
	search,
	404: notFound,
	index: list,
	category,
	author: commentAuthorAvatar,
	taxonomy: blockMeta,
	date: calendar,
	tag,
	attachment: media,
};

function TemplateListItem( {
	title,
	direction,
	className,
	description,
	icon,
	onClick,
	children,
} ) {
	return (
		<Button
			className={ className }
			onClick={ onClick }
			label={ description }
			showTooltip={ !! description }
		>
			<Flex
				as="span"
				spacing={ 2 }
				align="center"
				justify="center"
				style={ { width: '100%' } }
				direction={ direction }
			>
				<div className="edit-site-add-new-template__template-icon">
					<Icon icon={ icon } />
				</div>
				<VStack
					className="edit-site-add-new-template__template-name"
					alignment="center"
					spacing={ 0 }
				>
					<Text
						align="center"
						weight={ 500 }
						lineHeight={ 1.53846153846 } // 20px
					>
						{ title }
					</Text>
					{ children }
				</VStack>
			</Flex>
		</Button>
	);
}

const modalContentMap = {
	templatesList: 1,
	customTemplate: 2,
	customGenericTemplate: 3,
};

function NewTemplateModal( { onClose } ) {
	const [ modalContent, setModalContent ] = useState(
		modalContentMap.templatesList
	);
	const [ entityForSuggestions, setEntityForSuggestions ] = useState( {} );
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const missingTemplates = useMissingTemplates( setEntityForSuggestions, () =>
		setModalContent( modalContentMap.customTemplate )
	);
	const history = useHistory();
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const isMobile = useViewportMatch( 'medium', '<' );

	const { homeUrl } = useSelect( ( select ) => {
		const {
			getUnstableBase, // Site index.
		} = select( coreStore );

		return {
			homeUrl: getUnstableBase()?.home,
		};
	}, [] );

	const TEMPLATE_SHORT_DESCRIPTIONS = {
		'front-page': homeUrl,
		date: sprintf(
			// translators: %s: The homepage url.
			__( 'E.g. %s' ),
			homeUrl + '/' + new Date().getFullYear()
		),
	};

	async function createTemplate( template, isWPSuggestion = true ) {
		if ( isSubmitting ) {
			return;
		}
		setIsSubmitting( true );
		try {
			const { title, description, slug } = template;
			const newTemplate = await saveEntityRecord(
				'postType',
				TEMPLATE_POST_TYPE,
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

			// Navigate to the created template editor.
			history.push( {
				postId: newTemplate.id,
				postType: TEMPLATE_POST_TYPE,
				canvas: 'edit',
			} );

			createSuccessNotice(
				sprintf(
					// translators: %s: Title of the created template e.g: "Category".
					__( '"%s" successfully created.' ),
					decodeEntities( newTemplate.title?.rendered || title )
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
			setIsSubmitting( false );
		}
	}
	const onModalClose = () => {
		onClose();
		setModalContent( modalContentMap.templatesList );
	};

	let modalTitle = __( 'Add template' );
	if ( modalContent === modalContentMap.customTemplate ) {
		modalTitle = sprintf(
			// translators: %s: Name of the post type e.g: "Post".
			__( 'Add template: %s' ),
			entityForSuggestions.labels.singular_name
		);
	} else if ( modalContent === modalContentMap.customGenericTemplate ) {
		modalTitle = __( 'Create custom template' );
	}

	return (
		<Modal
			title={ modalTitle }
			className={ clsx( 'edit-site-add-new-template__modal', {
				'edit-site-add-new-template__modal_template_list':
					modalContent === modalContentMap.templatesList,
				'edit-site-custom-template-modal':
					modalContent === modalContentMap.customTemplate,
			} ) }
			onRequestClose={ onModalClose }
			overlayClassName={
				modalContent === modalContentMap.customGenericTemplate
					? 'edit-site-custom-generic-template__modal'
					: undefined
			}
		>
			{ modalContent === modalContentMap.templatesList && (
				<Grid
					columns={ isMobile ? 2 : 3 }
					gap={ 4 }
					align="flex-start"
					justify="center"
					className="edit-site-add-new-template__template-list__contents"
				>
					<Flex className="edit-site-add-new-template__template-list__prompt">
						{ __(
							'Select what the new template should apply to:'
						) }
					</Flex>
					{ missingTemplates.map( ( template ) => {
						const { title, slug, onClick } = template;
						return (
							<TemplateListItem
								key={ slug }
								title={ title }
								direction="column"
								className="edit-site-add-new-template__template-button"
								description={
									TEMPLATE_SHORT_DESCRIPTIONS[ slug ]
								}
								icon={ TEMPLATE_ICONS[ slug ] || layout }
								onClick={ () =>
									onClick
										? onClick( template )
										: createTemplate( template )
								}
							/>
						);
					} ) }
					<TemplateListItem
						title={ __( 'Custom template' ) }
						direction="row"
						className="edit-site-add-new-template__custom-template-button"
						icon={ edit }
						onClick={ () =>
							setModalContent(
								modalContentMap.customGenericTemplate
							)
						}
					>
						<Text
							lineHeight={ 1.53846153846 } // 20px
						>
							{ __(
								'A custom template can be manually applied to any post or page.'
							) }
						</Text>
					</TemplateListItem>
				</Grid>
			) }
			{ modalContent === modalContentMap.customTemplate && (
				<AddCustomTemplateModalContent
					onSelect={ createTemplate }
					entityForSuggestions={ entityForSuggestions }
				/>
			) }
			{ modalContent === modalContentMap.customGenericTemplate && (
				<AddCustomGenericTemplateModalContent
					onClose={ onModalClose }
					createTemplate={ createTemplate }
				/>
			) }
		</Modal>
	);
}

function NewTemplate() {
	const [ showModal, setShowModal ] = useState( false );

	const { postType } = useSelect( ( select ) => {
		const { getPostType } = select( coreStore );

		return {
			postType: getPostType( TEMPLATE_POST_TYPE ),
		};
	}, [] );

	if ( ! postType ) {
		return null;
	}

	return (
		<>
			<Button
				variant="primary"
				onClick={ () => setShowModal( true ) }
				label={ postType.labels.add_new_item }
				__next40pxDefaultSize
			>
				{ postType.labels.add_new_item }
			</Button>
			{ showModal && (
				<NewTemplateModal onClose={ () => setShowModal( false ) } />
			) }
		</>
	);
}

function useMissingTemplates( setEntityForSuggestions, onClick ) {
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
		onClick?.();
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

export default memo( NewTemplate );
