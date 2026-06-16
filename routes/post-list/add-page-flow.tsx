/**
 * WordPress dependencies
 */
import { BlockPreview } from '@wordpress/block-editor';
import { __unstableSerializeAndClean, parse } from '@wordpress/blocks';
import {
	Button,
	CheckboxControl,
	DropdownMenu,
	Icon as WCIcon,
	MenuItem,
	Modal,
	Notice,
	SelectControl,
	TextControl,
	Tooltip as WCTooltip,
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronLeft, plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { useInvalidate, useNavigate } from '@wordpress/route';
import { Card, CollapsibleCard, Text } from '@wordpress/ui';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const SCRATCH_LAYOUT_ID = '_scratch';

type PageStartMode = 'layout' | 'scratch';

interface AddPageFlowProps {
	onClose: () => void;
}

interface BlockPattern {
	name: string;
	title: string;
	content: string;
	description?: string;
	blockTypes?: string[];
	postTypes?: string[];
	categories?: string[];
	inserter?: boolean;
	viewportWidth?: number;
	blocks?: unknown[];
}

interface ScratchLayout {
	name: string;
	title: string;
	description: string;
	isScratch: true;
}

interface PostRecord {
	id: number;
	link?: string;
	slug?: string;
	status?: string;
	title?: {
		raw?: string;
		rendered?: string;
	};
	content?: {
		raw?: string;
		rendered?: string;
	};
}

interface TemplateRecord {
	id: number | string;
	slug: string;
	is_custom?: boolean;
	title?: {
		rendered?: string;
		raw?: string;
	};
	content?: {
		raw?: string;
	};
}

function getRecordTitle( record: PostRecord | TemplateRecord ) {
	return decodeEntities(
		record.title?.rendered || record.title?.raw || __( '(no title)' )
	);
}

function isPageLayoutPattern( pattern: BlockPattern ) {
	if ( pattern.inserter === false ) {
		return false;
	}

	if ( pattern.postTypes?.includes( 'page' ) ) {
		return true;
	}

	if ( pattern.blockTypes?.includes( 'core/post-content' ) ) {
		return true;
	}

	return !! pattern.categories?.some( ( category ) =>
		[ 'page', 'pages' ].includes( category )
	);
}

function serializeNavigationForPages( pages: PostRecord[] ) {
	return pages.map( getNavigationLinkBlockMarkup ).join( '\n\n' );
}

function serializeBlockAttributes( attributes: Record< string, unknown > ) {
	return JSON.stringify( attributes )
		.replaceAll( '\\\\', '\\u005c' )
		.replaceAll( '--', '\\u002d\\u002d' )
		.replaceAll( '<', '\\u003c' )
		.replaceAll( '>', '\\u003e' )
		.replaceAll( '&', '\\u0026' )
		.replaceAll( '\\"', '\\u0022' );
}

function getNavigationLinkBlockMarkup( pageRecord: PostRecord ) {
	const attributes: Record< string, unknown > = {
		label: getRecordTitle( pageRecord ),
		type: 'page',
		id: pageRecord.id,
		kind: 'post-type',
		metadata: {
			bindings: {
				url: {
					source: 'core/post-data',
					args: {
						field: 'link',
					},
				},
			},
		},
	};

	if ( pageRecord.link ) {
		attributes.url = pageRecord.link;
	}

	return `<!-- wp:navigation-link ${ serializeBlockAttributes(
		attributes
	) } /-->`;
}

function hasNavigationLinkForPage(
	navigationMenu: PostRecord,
	pageId: number
) {
	return ( navigationMenu.content?.raw || '' ).includes( `"id":${ pageId }` );
}

function getPatternContent( pattern?: BlockPattern ) {
	if ( ! pattern ) {
		return '';
	}

	const blocks = pattern.blocks?.length
		? pattern.blocks
		: parse( pattern.content );

	return __unstableSerializeAndClean( blocks as any );
}

function replacePostContentBlocks(
	blocks: any[],
	contentBlocks: any[]
): { blocks: any[]; didReplace: boolean } {
	let didReplace = false;
	const nextBlocks = blocks.flatMap( ( block ) => {
		if ( block.name === 'core/post-content' ) {
			didReplace = true;
			return contentBlocks;
		}

		const replacedInnerBlocks = replacePostContentBlocks(
			block.innerBlocks || [],
			contentBlocks
		);
		if ( replacedInnerBlocks.didReplace ) {
			didReplace = true;
		}

		return [
			{
				...block,
				innerBlocks: replacedInnerBlocks.blocks,
			},
		];
	} );

	return {
		blocks: nextBlocks,
		didReplace,
	};
}

function getPatternPreviewBlocks(
	pattern: BlockPattern,
	pageTemplateContent?: string
) {
	const patternBlocks = pattern.blocks?.length
		? pattern.blocks
		: parse( pattern.content );

	if ( ! pageTemplateContent ) {
		return patternBlocks;
	}

	const templateBlocks = parse( pageTemplateContent );
	const preview = replacePostContentBlocks(
		templateBlocks,
		patternBlocks as any[]
	);

	return preview.didReplace ? preview.blocks : patternBlocks;
}

function usePageLayoutPatterns() {
	const patterns = useSelect(
		( select ) => select( coreStore ).getBlockPatterns() as BlockPattern[],
		[]
	);

	return useMemo(
		() =>
			( patterns || [] )
				.filter( isPageLayoutPattern )
				.map( ( pattern ) => ( {
					...pattern,
					blocks: pattern.blocks || parse( pattern.content ),
				} ) ),
		[ patterns ]
	);
}

function usePageTemplates() {
	const { records: templates, isResolving } = useEntityRecords(
		'postType',
		'wp_template',
		{
			per_page: -1,
			post_type: 'page',
		}
	);

	const options = useMemo(
		() => [
			{
				label: __( 'Default template' ),
				value: '',
			},
			...( ( templates as TemplateRecord[] ) || [] )
				.filter(
					( template ) =>
						template.is_custom && !! template.content?.raw
				)
				.map( ( template ) => ( {
					label: getRecordTitle( template ),
					value: template.slug,
				} ) ),
		],
		[ templates ]
	);

	return {
		options,
		isResolving,
	};
}

export function AddPageFlow( { onClose }: AddPageFlowProps ) {
	const navigate = useNavigate();
	const invalidate = useInvalidate();
	const [ selectedPath, setSelectedPath ] = useState<
		PageStartMode | undefined
	>();
	const [ selectedLayout, setSelectedLayout ] = useState<
		BlockPattern | undefined
	>();
	const [ pageTitle, setPageTitle ] = useState( '' );
	const [ publishImmediately, setPublishImmediately ] = useState( true );
	const [ addToMenu, setAddToMenu ] = useState( false );
	const [ selectedTemplateSlug, setSelectedTemplateSlug ] = useState( '' );
	const [ isBusy, setIsBusy ] = useState( false );
	const [ validationError, setValidationError ] = useState< string >();
	const pageLayoutPatterns = usePageLayoutPatterns();
	const pageTemplates = usePageTemplates();
	const pageTemplateContent = useSelect( ( select ) => {
		const store = select( coreStore ) as any;
		const templateId = store.getDefaultTemplateId( { slug: 'page' } );
		const template = templateId
			? ( store.getEntityRecord(
					'postType',
					'wp_template',
					templateId
			  ) as TemplateRecord )
			: undefined;

		return template?.content?.raw;
	}, [] );

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const {
		records: navigationMenus,
		hasResolved: hasResolvedNavigationMenus,
	} = useEntityRecords( 'postType', NAVIGATION_POST_TYPE, {
		per_page: -1,
		status: 'publish',
	} );

	const { records: publishedPages } = useEntityRecords( 'postType', 'page', {
		per_page: 100,
		status: 'publish',
		orderby: 'menu_order',
		order: 'asc',
	} );

	const layoutOptions = useMemo(
		() => [
			...pageLayoutPatterns,
			{
				name: SCRATCH_LAYOUT_ID,
				title: __( 'Start from scratch' ),
				description: __(
					'Create a blank page and add content as you go'
				),
				isScratch: true,
			} as ScratchLayout,
		],
		[ pageLayoutPatterns ]
	);
	const layoutPreviewBlocks = useMemo( () => {
		const previews = new Map< string, unknown[] >();
		for ( const pattern of pageLayoutPatterns ) {
			previews.set(
				pattern.name,
				getPatternPreviewBlocks( pattern, pageTemplateContent )
			);
		}
		return previews;
	}, [ pageLayoutPatterns, pageTemplateContent ] );

	const handleSelectPath = ( path: PageStartMode ) => {
		setSelectedPath( path );
		setSelectedLayout( undefined );
		setPageTitle( '' );
		setSelectedTemplateSlug( '' );
		setValidationError( undefined );
	};

	const handleFooterBack = () => {
		if ( selectedPath === 'layout' && ! selectedLayout ) {
			setSelectedPath( undefined );
			return;
		}

		setSelectedPath( undefined );
		setSelectedLayout( undefined );
		setPageTitle( '' );
		setSelectedTemplateSlug( '' );
		setValidationError( undefined );
	};

	const handleSelectLayout = ( option: BlockPattern | ScratchLayout ) => {
		if ( 'isScratch' in option ) {
			setSelectedPath( 'scratch' );
			setSelectedLayout( undefined );
			setPageTitle( '' );
			return;
		}

		setSelectedLayout( option );
		setPageTitle( option.title );
	};

	const persistPageInNavigation = async ( newPage: PostRecord ) => {
		const firstNavigationMenu = ( navigationMenus as PostRecord[] )?.[ 0 ];

		if ( firstNavigationMenu ) {
			if ( hasNavigationLinkForPage( firstNavigationMenu, newPage.id ) ) {
				return;
			}

			const existingContent = (
				firstNavigationMenu.content?.raw || ''
			).trim();
			const newBlockContent = getNavigationLinkBlockMarkup( newPage );

			await saveEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				{
					id: firstNavigationMenu.id,
					content: [ existingContent, newBlockContent ]
						.filter( Boolean )
						.join( '\n\n' ),
				},
				{ throwOnError: true }
			);
			return;
		}

		if ( ! hasResolvedNavigationMenus ) {
			throw new Error(
				__( 'Navigation menus are still loading. Try again.' )
			);
		}

		const menuPages = [ ...( ( publishedPages as PostRecord[] ) || [] ) ];
		if (
			! menuPages.some( ( pageRecord ) => pageRecord.id === newPage.id )
		) {
			menuPages.push( newPage );
		}

		await saveEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			{
				title: __( 'Navigation' ),
				content: serializeNavigationForPages( menuPages ),
				status: 'publish',
			},
			{ throwOnError: true }
		);
	};

	const createPage = async ( editAfterCreate: boolean ) => {
		const trimmedTitle = pageTitle.trim();

		if ( ! trimmedTitle ) {
			setValidationError( __( 'Enter a page title.' ) );
			return;
		}

		setIsBusy( true );
		setValidationError( undefined );

		try {
			let newPage = ( await saveEntityRecord(
				'postType',
				'page',
				{
					title: trimmedTitle,
					content: selectedLayout
						? getPatternContent( selectedLayout )
						: '',
					status: publishImmediately ? 'publish' : 'draft',
					...( selectedTemplateSlug
						? { template: selectedTemplateSlug }
						: {} ),
				},
				{ throwOnError: true }
			) ) as PostRecord;

			if ( publishImmediately && newPage.status !== 'publish' ) {
				newPage = ( await saveEntityRecord(
					'postType',
					'page',
					{
						id: newPage.id,
						status: 'publish',
					},
					{ throwOnError: true }
				) ) as PostRecord;
			}

			if ( addToMenu ) {
				await persistPageInNavigation( newPage );
			}

			invalidate();
			createSuccessNotice(
				sprintf(
					/* translators: %s: Title of the created page. */
					__( '"%s" successfully created.' ),
					decodeEntities(
						newPage.title?.rendered ||
							newPage.title?.raw ||
							trimmedTitle
					)
				),
				{ type: 'snackbar' }
			);

			onClose();

			if ( editAfterCreate ) {
				const editPath = `/types/page/edit/${ encodeURIComponent(
					String( newPage.id )
				) }`;
				const search = {
					skipStartPageOptions: true,
				};
				if ( selectedPath === 'scratch' ) {
					navigate( {
						to: editPath,
						search: {
							...search,
							inserter: 'blocks',
						},
					} );
					return;
				}
				navigate( {
					to: editPath,
					search,
				} );
			}
		} catch ( error: any ) {
			const message =
				error?.message ||
				__( 'An error occurred while creating the page.' );
			createErrorNotice( message, { type: 'snackbar' } );
			setValidationError( message );
		} finally {
			setIsBusy( false );
		}
	};

	const canCreate = pageTitle.trim().length > 0;
	const isChoosingLayout = selectedPath === 'layout' && ! selectedLayout;
	const isShowingForm = selectedPath === 'scratch' || !! selectedLayout;

	return (
		<Modal
			title={ __( 'Add a new page' ) }
			onRequestClose={ onClose }
			className="apm-modal"
			size="large"
		>
			<div className="apm-modal-body">
				{ isChoosingLayout && (
					<Text
						variant="body-sm"
						className="modal-subtitle apm-modal-subtitle"
					>
						{ __(
							'Choose from predefined layouts built using Patterns that you can customize.'
						) }
					</Text>
				) }
				{ ! selectedPath && (
					<>
						<div className="apm-options">
							<Button
								variant="secondary"
								className="apm-option-card"
								onClick={ () => handleSelectPath( 'layout' ) }
								__next40pxDefaultSize
							>
								<div className="apm-option-preview apm-preview-layout">
									<div className="apm-preview-wireframe">
										<div className="apm-wireframe-header" />
										<div className="apm-wireframe-content">
											<div className="apm-wireframe-sidebar" />
											<div className="apm-wireframe-main" />
										</div>
									</div>
								</div>
								<Text
									variant="body-md"
									className="apm-option-title"
								>
									{ __( 'Choose a layout' ) }
								</Text>
								<Text
									variant="body-sm"
									className="apm-option-desc"
								>
									{ __(
										'Start with a pre-designed page layout'
									) }
								</Text>
							</Button>
							<Button
								variant="secondary"
								className="apm-option-card"
								onClick={ () => handleSelectPath( 'scratch' ) }
								__next40pxDefaultSize
							>
								<div className="apm-option-preview apm-preview-scratch">
									<div className="apm-preview-icon">
										<WCIcon icon={ plus } />
									</div>
								</div>
								<Text
									variant="body-md"
									className="apm-option-title"
								>
									{ __( 'Start from scratch' ) }
								</Text>
								<Text
									variant="body-sm"
									className="apm-option-desc"
								>
									{ __(
										'Create a blank page and add sections as you go'
									) }
								</Text>
							</Button>
						</div>
						<Text variant="body-sm" className="apm-tutorial-hint">
							{ __( 'Unsure where to start?' ) }{ ' ' }
							<a
								href="https://learn.wordpress.org/lesson/setting-up-your-pages-posts-site-logo-and-navigation-menu/"
								target="_blank"
								rel="noopener noreferrer"
								className="apm-tutorial-link"
							>
								{ __( 'Begin with a tutorial' ) }
							</a>
						</Text>
					</>
				) }
				{ isChoosingLayout && (
					<div className="apm-layouts-grid">
						{ layoutOptions.map( ( option ) => (
							<WCTooltip
								key={ option.name }
								text={ option.description || '' }
							>
								<Button
									variant="secondary"
									className={ `apm-layout-card ${
										'isScratch' in option
											? 'apm-layout-scratch'
											: ''
									}` }
									onClick={ () =>
										handleSelectLayout( option )
									}
									__next40pxDefaultSize
								>
									<div className="apm-layout-preview">
										{ 'isScratch' in option ? (
											<div className="pattern-scratch-icon">
												<WCIcon icon={ plus } />
											</div>
										) : (
											<BlockPreview.Async
												placeholder={
													<div className="block-editor-block-patterns-list__item is-placeholder" />
												}
											>
												<BlockPreview
													blocks={
														layoutPreviewBlocks.get(
															option.name
														) as any
													}
													viewportWidth={
														option.viewportWidth ||
														960
													}
												/>
											</BlockPreview.Async>
										) }
									</div>
									<Text
										variant="body-sm"
										className="apm-layout-name"
									>
										{ option.title }
									</Text>
								</Button>
							</WCTooltip>
						) ) }
					</div>
				) }
				{ isShowingForm && (
					<div className="apm-form">
						{ validationError && (
							<Notice
								status="error"
								isDismissible
								onRemove={ () =>
									setValidationError( undefined )
								}
							>
								{ validationError }
							</Notice>
						) }
						<TextControl
							label={ __( 'Page title' ) }
							value={ pageTitle }
							onChange={ setPageTitle }
							placeholder={ __( 'Enter page title' ) }
							required
							disabled={ isBusy }
							autoComplete="off"
							className="apm-page-title"
							__next40pxDefaultSize
						/>
						<div className="apm-checkbox-group">
							<div className="apm-checkbox-item">
								<CheckboxControl
									label={ __( 'Publish immediately' ) }
									checked={ publishImmediately }
									onChange={ setPublishImmediately }
									disabled={ isBusy }
								/>
								<Text
									variant="body-sm"
									className="apm-checkbox-help"
								>
									{ __(
										'Your page will be visible to visitors immediately'
									) }
								</Text>
							</div>
							<div className="apm-checkbox-item">
								<CheckboxControl
									label={ __( 'Add to navigation menu' ) }
									checked={ addToMenu }
									onChange={ setAddToMenu }
									disabled={ isBusy }
								/>
								<Text
									variant="body-sm"
									className="apm-checkbox-help"
								>
									{ __(
										"Include this page in your site's main navigation"
									) }
								</Text>
							</div>
						</div>
						<CollapsibleCard.Root
							defaultOpen={ false }
							className="apm-panel"
						>
							<CollapsibleCard.Header>
								<Card.Title>{ __( 'Advanced' ) }</Card.Title>
							</CollapsibleCard.Header>
							<CollapsibleCard.Content>
								<SelectControl
									label={ __( 'Page Template' ) }
									value={ selectedTemplateSlug }
									options={ pageTemplates.options }
									onChange={ ( value ) =>
										setSelectedTemplateSlug(
											String( value )
										)
									}
									disabled={
										isBusy || pageTemplates.isResolving
									}
									help={ __(
										'Choose a template to control the layout and structure of this page'
									) }
									className="apm-page-template-select"
									__next40pxDefaultSize
								/>
							</CollapsibleCard.Content>
						</CollapsibleCard.Root>
					</div>
				) }
			</div>

			<div className="modal-footer apm-modal-footer">
				{ selectedPath && (
					<Button
						variant="tertiary"
						onClick={ handleFooterBack }
						disabled={ isBusy }
						accessibleWhenDisabled
						icon={ chevronLeft }
						__next40pxDefaultSize
					>
						{ __( 'Back to options' ) }
					</Button>
				) }
				<div className="apm-modal-footer-actions">
					{ isShowingForm && (
						<div className="split-button">
							<Button
								variant="primary"
								onClick={ () => createPage( true ) }
								disabled={ isBusy || ! canCreate }
								accessibleWhenDisabled
								aria-busy={ isBusy }
								className="split-button-main"
								__next40pxDefaultSize
							>
								{ __( 'Create and Edit' ) }
							</Button>
							<DropdownMenu
								icon={ chevronDown }
								label={ __( 'More options' ) }
								className="split-button-dropdown"
								popoverProps={ { placement: 'bottom-end' } }
								toggleProps={ {
									disabled: isBusy || ! canCreate,
									variant: 'primary',
									className: 'split-button-toggle',
									__next40pxDefaultSize: true,
									accessibleWhenDisabled: true,
								} }
							>
								{ ( { onClose: closeMenu } ) => (
									<MenuItem
										onClick={ () => {
											createPage( false );
											closeMenu();
										} }
									>
										{ __( 'Create only' ) }
									</MenuItem>
								) }
							</DropdownMenu>
						</div>
					) }
				</div>
			</div>
		</Modal>
	);
}
