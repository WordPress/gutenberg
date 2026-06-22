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
} from '@wordpress/components';
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronLeft, plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Link, useInvalidate, useNavigate } from '@wordpress/route';
import { Card, CollapsibleCard, Text } from '@wordpress/ui';

import { isPageApplicableTemplate } from './template-utils';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const OTHER_PAGE_LAYOUT_TYPE = 'other';
const PAGE_LAYOUT_PREVIEW_VIEWPORT_WIDTH = 720;

type PageStartMode = 'layout' | 'scratch';
type PageLayoutTypeSlug =
	| 'homepage'
	| 'landing-page'
	| 'event'
	| 'link-in-bio'
	| 'personal'
	| 'coming-soon'
	| 'other';

interface AddPageFlowProps {
	onClose: () => void;
}

interface PageLayoutType {
	slug: PageLayoutTypeSlug;
	label: string;
}

interface BlockPattern {
	name: string;
	title: string;
	content: string;
	description?: string;
	blockTypes?: string[];
	postTypes?: string[];
	pageTypes?: string[];
	categories?: string[];
	inserter?: boolean;
	viewportWidth?: number;
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

function getPageLayoutTypes(): PageLayoutType[] {
	return [
		{ slug: 'homepage', label: __( 'Homepages' ) },
		{ slug: 'landing-page', label: __( 'Landing pages' ) },
		{ slug: 'event', label: __( 'Events' ) },
		{ slug: 'link-in-bio', label: __( 'Link in bio' ) },
		{ slug: 'personal', label: __( 'Personal' ) },
		{ slug: 'coming-soon', label: __( 'Coming soon' ) },
		{ slug: OTHER_PAGE_LAYOUT_TYPE, label: __( 'Other layouts' ) },
	];
}

function normalizeLayoutText( value?: string ) {
	return decodeEntities( value || '' ).toLowerCase();
}

function getKnownPageLayoutType( slug?: string ): PageLayoutTypeSlug | null {
	switch ( slug ) {
		case 'homepage':
		case 'homepages':
		case 'home':
		case 'front-page':
		case 'frontpage':
			return 'homepage';
		case 'landing-page':
		case 'landing-pages':
		case 'landing':
			return 'landing-page';
		case 'event':
		case 'events':
			return 'event';
		case 'link-in-bio':
		case 'linkinbio':
		case 'link-in-bios':
			return 'link-in-bio';
		case 'personal':
		case 'bio':
		case 'cv':
		case 'resume':
			return 'personal';
		case 'coming-soon':
		case 'comingsoon':
			return 'coming-soon';
		case OTHER_PAGE_LAYOUT_TYPE:
			return OTHER_PAGE_LAYOUT_TYPE;
		default:
			return null;
	}
}

function inferPageLayoutTypes( pattern: BlockPattern ): PageLayoutTypeSlug[] {
	const explicitTypes = ( pattern.pageTypes || [] )
		.map( getKnownPageLayoutType )
		.filter( Boolean ) as PageLayoutTypeSlug[];

	if ( explicitTypes.length ) {
		return [ ...new Set( explicitTypes ) ];
	}

	const categories = pattern.categories || [];
	const categoryTypes = categories
		.map( getKnownPageLayoutType )
		.filter( Boolean ) as PageLayoutTypeSlug[];

	if ( categoryTypes.length ) {
		return [ ...new Set( categoryTypes ) ];
	}

	const patternText = [
		normalizeLayoutText( pattern.name ),
		normalizeLayoutText( pattern.title ),
		...( pattern.categories || [] ).map( normalizeLayoutText ),
	].join( ' ' );

	if (
		patternText.includes( 'event rsvp' ) ||
		patternText.includes( 'event-rsvp' ) ||
		patternText.includes( 'landing page for event' ) ||
		patternText.includes( 'landing-event' )
	) {
		return [ 'event' ];
	}

	if (
		patternText.includes( 'link in bio' ) ||
		patternText.includes( 'link-in-bio' )
	) {
		return [ 'link-in-bio' ];
	}

	if (
		patternText.includes( 'coming soon' ) ||
		patternText.includes( 'coming-soon' )
	) {
		return [ 'coming-soon' ];
	}

	if (
		patternText.includes( 'cv/bio' ) ||
		patternText.includes( 'cv bio' ) ||
		patternText.includes( 'cv-bio' )
	) {
		return [ 'personal' ];
	}

	if (
		patternText.includes( 'business homepage' ) ||
		patternText.includes( 'business-home' ) ||
		patternText.includes( 'portfolio homepage' ) ||
		patternText.includes( 'portfolio-home' ) ||
		patternText.includes( 'shop homepage' ) ||
		patternText.includes( 'shop-home' )
	) {
		return [ 'homepage' ];
	}

	if (
		patternText.includes( 'landing page for book' ) ||
		patternText.includes( 'landing-book' ) ||
		patternText.includes( 'landing page for podcast' ) ||
		patternText.includes( 'landing-podcast' )
	) {
		return [ 'landing-page' ];
	}

	return [ OTHER_PAGE_LAYOUT_TYPE ];
}

interface TemplateRecord {
	id: number | string;
	slug: string;
	is_custom?: boolean;
	post_types?: string[];
	postTypes?: string[];
	site_editor_template_context?: {
		post_type?: string;
	} | null;
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

	const blocks = parse( pattern.content );

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
	const patternBlocks = parse( pattern.content );

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
	const { patterns, isResolving } = useSelect( ( select ) => {
		const store = select( coreStore ) as any;
		return {
			patterns: store.getBlockPatterns() as BlockPattern[],
			isResolving: store.isResolving( 'getBlockPatterns' ),
		};
	}, [] );

	const pageLayoutPatterns = useMemo(
		() => ( patterns || [] ).filter( isPageLayoutPattern ),
		[ patterns ]
	);

	return {
		patterns: pageLayoutPatterns,
		isResolving,
	};
}

function PageLayoutPreviewPlaceholder() {
	return (
		<svg
			className="apm-layout-preview-placeholder"
			viewBox="0 0 720 960"
			preserveAspectRatio="xMidYMin slice"
			aria-hidden="true"
			focusable="false"
		>
			<rect
				className="apm-layout-preview-placeholder__page"
				width="720"
				height="960"
				rx="10"
			/>
			<rect
				className="apm-layout-preview-placeholder__heading"
				x="72"
				y="70"
				width="258"
				height="24"
				rx="4"
			/>
			<rect
				className="apm-layout-preview-placeholder__line"
				x="426"
				y="76"
				width="68"
				height="12"
				rx="6"
			/>
			<rect
				className="apm-layout-preview-placeholder__line"
				x="518"
				y="76"
				width="68"
				height="12"
				rx="6"
			/>
			<rect
				className="apm-layout-preview-placeholder__image"
				x="72"
				y="150"
				width="576"
				height="260"
				rx="10"
			/>
			<rect
				className="apm-layout-preview-placeholder__title"
				x="72"
				y="468"
				width="410"
				height="42"
				rx="5"
			/>
			<rect
				className="apm-layout-preview-placeholder__line"
				x="72"
				y="548"
				width="520"
				height="16"
				rx="8"
			/>
			<rect
				className="apm-layout-preview-placeholder__line"
				x="72"
				y="582"
				width="470"
				height="16"
				rx="8"
			/>
			<rect
				className="apm-layout-preview-placeholder__line"
				x="72"
				y="616"
				width="320"
				height="16"
				rx="8"
			/>
			<rect
				className="apm-layout-preview-placeholder__image"
				x="72"
				y="710"
				width="248"
				height="170"
				rx="8"
			/>
			<rect
				className="apm-layout-preview-placeholder__image"
				x="400"
				y="710"
				width="248"
				height="170"
				rx="8"
			/>
		</svg>
	);
}

function PageLayoutSidebarPlaceholder() {
	return (
		<svg
			className="apm-layout-categories-placeholder"
			viewBox="0 0 240 340"
			preserveAspectRatio="none"
			aria-hidden="true"
			focusable="false"
		>
			<rect
				className="apm-layout-categories-placeholder__selected"
				x="0"
				y="0"
				width="240"
				height="46"
				rx="2"
			/>
			{ [ 0, 1, 2, 3, 4, 5 ].map( ( index ) => (
				<g key={ index } transform={ `translate(0 ${ index * 58 })` }>
					<rect
						className="apm-layout-categories-placeholder__label"
						x="16"
						y="17"
						width={ index === 0 ? 118 : 150 - index * 10 }
						height="12"
						rx="6"
					/>
					<rect
						className="apm-layout-categories-placeholder__count"
						x="206"
						y="17"
						width="18"
						height="12"
						rx="6"
					/>
				</g>
			) ) }
		</svg>
	);
}

function PageLayoutCardPlaceholder() {
	return (
		<div className="apm-layout-card-placeholder" aria-hidden="true">
			<div className="apm-layout-preview">
				<div className="apm-layout-preview-page">
					<PageLayoutPreviewPlaceholder />
				</div>
			</div>
			<div className="apm-layout-card-placeholder__content">
				<div className="apm-layout-card-placeholder__title" />
				<div className="apm-layout-card-placeholder__line" />
				<div className="apm-layout-card-placeholder__line is-short" />
			</div>
		</div>
	);
}

function PageLayoutResultsPlaceholder() {
	return (
		<div
			className="apm-layouts-grid apm-layouts-grid-placeholder"
			aria-hidden="true"
		>
			{ [ 0, 1, 2, 3 ].map( ( index ) => (
				<PageLayoutCardPlaceholder key={ index } />
			) ) }
		</div>
	);
}

function useVisiblePreview() {
	const previewRef = useRef< HTMLDivElement | null >( null );
	const [ isVisible, setIsVisible ] = useState( false );

	useEffect( () => {
		if ( isVisible ) {
			return;
		}

		const previewElement = previewRef.current;
		if (
			! previewElement ||
			typeof window.IntersectionObserver === 'undefined'
		) {
			setIsVisible( true );
			return;
		}

		const observer = new window.IntersectionObserver(
			( entries ) => {
				if ( entries.some( ( entry ) => entry.isIntersecting ) ) {
					setIsVisible( true );
					observer.disconnect();
				}
			},
			{
				rootMargin: '360px',
			}
		);

		observer.observe( previewElement );

		return () => observer.disconnect();
	}, [ isVisible ] );

	return { previewRef, isVisible };
}

function PageLayoutPreview( {
	pattern,
	pageTemplateContent,
}: {
	pattern: BlockPattern;
	pageTemplateContent?: string;
} ) {
	const { previewRef, isVisible } = useVisiblePreview();
	const previewBlocks = useMemo(
		() =>
			isVisible
				? getPatternPreviewBlocks( pattern, pageTemplateContent )
				: undefined,
		[ isVisible, pageTemplateContent, pattern ]
	);

	return (
		<div ref={ previewRef } className="apm-layout-preview">
			<div className="apm-layout-preview-page">
				{ ! previewBlocks && <PageLayoutPreviewPlaceholder /> }
				{ !! previewBlocks && (
					<BlockPreview.Async
						placeholder={ <PageLayoutPreviewPlaceholder /> }
					>
						<BlockPreview
							blocks={ previewBlocks as any }
							viewportWidth={
								pattern.viewportWidth
									? Math.min(
											pattern.viewportWidth,
											PAGE_LAYOUT_PREVIEW_VIEWPORT_WIDTH
									  )
									: PAGE_LAYOUT_PREVIEW_VIEWPORT_WIDTH
							}
						/>
					</BlockPreview.Async>
				) }
			</div>
		</div>
	);
}

function PageLayoutCard( {
	pattern,
	pageTemplateContent,
	onSelect,
}: {
	pattern: BlockPattern;
	pageTemplateContent?: string;
	onSelect: ( pattern: BlockPattern ) => void;
} ) {
	return (
		<Button
			variant="secondary"
			className="apm-layout-card"
			onClick={ () => onSelect( pattern ) }
			__next40pxDefaultSize
		>
			<PageLayoutPreview
				pattern={ pattern }
				pageTemplateContent={ pageTemplateContent }
			/>
			<span className="apm-layout-card-content">
				<Text variant="body-sm" className="apm-layout-name">
					{ decodeEntities( pattern.title ) }
				</Text>
				{ !! pattern.description && (
					<Text variant="body-sm" className="apm-layout-description">
						{ decodeEntities( pattern.description ) }
					</Text>
				) }
			</span>
		</Button>
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
						template.is_custom &&
						!! template.content?.raw &&
						isPageApplicableTemplate( template )
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

function getPageLayoutGroups( patterns: BlockPattern[] ) {
	const groups = getPageLayoutTypes().map( ( type ) => ( {
		...type,
		patterns: [] as BlockPattern[],
	} ) );
	const groupBySlug = new Map(
		groups.map( ( group ) => [ group.slug, group ] )
	);

	for ( const pattern of patterns ) {
		for ( const pageType of inferPageLayoutTypes( pattern ) ) {
			const group =
				groupBySlug.get( pageType ) ||
				groupBySlug.get( OTHER_PAGE_LAYOUT_TYPE );

			if ( group && ! group.patterns.includes( pattern ) ) {
				group.patterns.push( pattern );
			}
		}
	}

	return groups.filter( ( group ) => group.patterns.length );
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
	const [ selectedPageType, setSelectedPageType ] =
		useState< PageLayoutTypeSlug >();
	const [ isBusy, setIsBusy ] = useState( false );
	const [ validationError, setValidationError ] = useState< string >();
	const {
		patterns: pageLayoutPatterns,
		isResolving: isResolvingPageLayoutPatterns,
	} = usePageLayoutPatterns();
	const pageLayoutGroups = useMemo(
		() => getPageLayoutGroups( pageLayoutPatterns ),
		[ pageLayoutPatterns ]
	);
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

	const activePageType =
		selectedPageType ||
		pageLayoutGroups[ 0 ]?.slug ||
		OTHER_PAGE_LAYOUT_TYPE;
	const activePageLayoutGroup = pageLayoutGroups.find(
		( group ) => group.slug === activePageType
	);
	const isLoadingPageLayouts =
		isResolvingPageLayoutPatterns && ! pageLayoutGroups.length;
	const hasActivePageLayouts = !! activePageLayoutGroup?.patterns.length;

	useEffect( () => {
		if ( selectedPath !== 'layout' || ! pageLayoutGroups.length ) {
			return;
		}

		if (
			! selectedPageType ||
			! pageLayoutGroups.some(
				( group ) => group.slug === selectedPageType
			)
		) {
			setSelectedPageType( pageLayoutGroups[ 0 ].slug );
		}
	}, [ pageLayoutGroups, selectedPageType, selectedPath ] );

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

	const handleStartBlank = () => {
		setSelectedPath( 'scratch' );
		setSelectedLayout( undefined );
		setPageTitle( '' );
		setValidationError( undefined );
	};

	const handleSelectLayout = ( pattern: BlockPattern ) => {
		setSelectedLayout( pattern );
		setPageTitle( pattern.title );
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
			title={
				isChoosingLayout
					? __( 'Choose a layout' )
					: __( 'Add a new page' )
			}
			onRequestClose={ onClose }
			className={ `apm-modal ${
				isChoosingLayout ? 'is-layout-picker' : ''
			}` }
			size="large"
			headerActions={
				isChoosingLayout ? (
					<Button
						variant="secondary"
						onClick={ handleStartBlank }
						__next40pxDefaultSize
					>
						{ __( 'Start blank' ) }
					</Button>
				) : null
			}
		>
			<div className="apm-modal-body">
				{ isChoosingLayout && (
					<Text
						variant="body-sm"
						className="modal-subtitle apm-modal-subtitle"
					>
						{ __(
							'Choose a page layout built with Patterns, or start with a blank page.'
						) }{ ' ' }
						<Link to="/patterns/list/all">
							{ __( 'View all Patterns' ) }
						</Link>
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
								onClick={ handleStartBlank }
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
					<div className="apm-layout-picker">
						<div className="apm-layout-browser">
							{ isLoadingPageLayouts ? (
								<PageLayoutSidebarPlaceholder />
							) : (
								<div
									className="apm-layout-categories"
									aria-label={ __( 'Page types' ) }
								>
									{ pageLayoutGroups.map( ( group ) => (
										<Button
											key={ group.slug }
											variant="tertiary"
											className={ `apm-layout-category ${
												group.slug === activePageType
													? 'is-selected'
													: ''
											}` }
											onClick={ () =>
												setSelectedPageType(
													group.slug
												)
											}
											aria-current={
												group.slug === activePageType
													? 'true'
													: undefined
											}
											__next40pxDefaultSize
										>
											<span>{ group.label }</span>
											<span className="apm-layout-category-count">
												{ group.patterns.length }
											</span>
										</Button>
									) ) }
								</div>
							) }
							<div className="apm-layout-results">
								{ isLoadingPageLayouts && (
									<PageLayoutResultsPlaceholder />
								) }
								{ ! isLoadingPageLayouts &&
									! hasActivePageLayouts && (
										<div className="apm-layout-empty">
											<Text variant="body-md">
												{ __(
													'No layouts found for this page type.'
												) }
											</Text>
											<Button
												variant="secondary"
												onClick={ handleStartBlank }
												__next40pxDefaultSize
											>
												{ __( 'Start blank' ) }
											</Button>
										</div>
									) }
								{ ! isLoadingPageLayouts &&
									hasActivePageLayouts && (
										<div className="apm-layouts-grid">
											{ activePageLayoutGroup.patterns.map(
												( pattern ) => (
													<PageLayoutCard
														key={ pattern.name }
														pattern={ pattern }
														pageTemplateContent={
															pageTemplateContent
														}
														onSelect={
															handleSelectLayout
														}
													/>
												)
											) }
										</div>
									) }
							</div>
						</div>
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
