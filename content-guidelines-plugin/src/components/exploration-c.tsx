/**
 * Exploration C — "Proactive Recommendations"
 *
 * Automatically scans guidelines on page load and surfaces lightweight
 * recommendation cards at the top. Clicking a recommendation opens and
 * scrolls to the relevant accordion where the diff can be reviewed
 * via the same Accept / Dismiss flow from Exploration B.
 */

/**
 * WordPress dependencies
 */
import { Page } from '../shims/page';
import { __, sprintf } from '@wordpress/i18n';
import {
	createElement,
	useCallback,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import {
	Button,
	Card,
	DropdownMenu,
	Icon,
	MenuGroup,
	MenuItem,
	Navigator,
	Spinner,
	TextareaControl,
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { Notice } from '../shims/notice';
import { useDispatch, useSelect } from '@wordpress/data';
import { chevronDown, moreVertical } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { fetchContentGuidelines, saveContentGuidelines } from '../api';
import { STORE_NAME } from '../store';
import { useAiGuidelines } from '../ai/use-ai-guidelines';
import type { SectionState } from '../ai/use-ai-guidelines';
import ActionsSection from './actions-section';
import BlockGuidelines from './block-guidelines';
import RevisionHistory from './revision-history';
import DiffEditor from './diff-editor';

const GUIDELINE_ITEMS = [
	{
		title: __( 'Site' ),
		description: __(
			"Describe your site's purpose, goals, and primary audience."
		),
		slug: 'site',
	},
	{
		title: __( 'Copy' ),
		description: __(
			'Set your writing standards for tone, voice, style, and formatting.'
		),
		slug: 'copy',
	},
	{
		title: __( 'Images' ),
		description: __(
			'Outline your style, dimensions, formats, mood and aesthetic preferences.'
		),
		slug: 'images',
	},
	{
		title: __( 'Blocks' ),
		description: __(
			'Create tailored guidelines for specific block types.'
		),
		slug: 'blocks',
	},
	{
		title: __( 'Additional' ),
		description: __( 'Add additional guidelines for your team.' ),
		slug: 'additional',
	},
];

// ── Local GuidelineAccordion (cloned to avoid modifying shared component) ──

interface LocalGuidelineAccordionProps {
	title: string;
	description: string;
	children: React.ReactNode;
	contentId?: string;
	headingId?: string;
	descriptionId?: string;
	isGenerating?: boolean;
	hasSuggestion?: boolean;
	forceOpenCounter?: number;
	showSpinnerOnlyWhenOpen?: boolean;
	isHighlighted?: boolean;
}

function GuidelineAccordion( {
	title,
	description,
	children,
	contentId,
	headingId,
	descriptionId,
	isGenerating,
	hasSuggestion,
	forceOpenCounter,
	showSpinnerOnlyWhenOpen,
	isHighlighted,
}: LocalGuidelineAccordionProps ) {
	const [ isOpen, setIsOpen ] = useState( false );

	useEffect( () => {
		if ( forceOpenCounter && forceOpenCounter > 0 ) {
			setIsOpen( true );
		}
	}, [ forceOpenCounter ] );

	const cardClassName = [
		'content-guidelines__accordion',
		isHighlighted ? 'content-guidelines__accordion--highlighted' : '',
	].filter( Boolean ).join( ' ' );

	return (
		<Card className={ cardClassName }>
			<Button
				className="content-guidelines__accordion-trigger"
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				aria-controls={ contentId }
				aria-describedby={ descriptionId }
				aria-label={
					isOpen
						? sprintf(
								/* translators: %s: Guideline title */
								__( 'Collapse %s guidelines' ),
								title
						  )
						: sprintf(
								/* translators: %s: Guideline title */
								__( 'Expand %s guidelines' ),
								title
						  )
				}
			>
				<HStack spacing={ 4 }>
					<VStack spacing={ 1 } style={ { minWidth: 0 } }>
						<Heading
							id={ headingId }
							className="content-guidelines__accordion-header"
							level={ 2 }
							size={ 15 }
							weight={ 400 }
						>
							{ title }
						</Heading>
						<Text
							id={ descriptionId }
							className="content-guidelines__accordion-description"
							size={ 13 }
							weight={ 400 }
							variant="muted"
						>
							{ description }
						</Text>
					</VStack>
					<HStack
						spacing={ 2 }
						expanded={ false }
						style={ { flexShrink: 0 } }
					>
						<span
							style={ {
								opacity:
									hasSuggestion &&
									! isGenerating &&
									! isOpen
										? 1
										: 0,
							} }
						>
							<span className="content-guidelines__badge">
								{ __( 'Suggestion' ) }
							</span>
						</span>
						{ isOpen && isGenerating && (
							<Spinner />
						) }
						<Icon
							icon={ chevronDown }
							className={
								isOpen
									? 'content-guidelines__accordion-chevron-up'
									: 'content-guidelines__accordion-chevron-down'
							}
						/>
					</HStack>
				</HStack>
			</Button>
			<div hidden={ ! isOpen }>{ children }</div>
		</Card>
	);
}


const MOCK_RECOMMENDATION_REASONS: Record< string, string > = {
	site: __( 'Add more detail about your target audience and site goals.' ),
	copy: __( 'Strengthen your tone and voice guidelines with specific examples.' ),
	images: __( 'Include format and dimension requirements for consistency.' ),
	additional: __( 'Add review process and content structure guidelines.' ),
};

const jetpackIcon = (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<g transform="translate(3,3)">
			<path
				d="M9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18Z"
				fill="#069E08"
			/>
			<path
				d="M14.0335 7.48851L9.53353 16.2141V7.48851H14.0335ZM8.6224 10.4944H4.13997L8.6224 1.78636V10.4944Z"
				fill="white"
			/>
		</g>
	</svg>
);

// ── Recommendations panel ──

interface RecommendationItem {
	slug: string;
	title: string;
	reason: string;
}

interface RecommendationsPanelProps {
	items: RecommendationItem[];
	isScanning: boolean;
	onClickItem: ( slug: string ) => void;
	onDismissItem: ( slug: string ) => void;
	onCheckAgain: () => void;
	onCancel: () => void;
}

function RecommendationsPanel( {
	items,
	isScanning,
	onClickItem,
	onDismissItem,
	onCheckAgain,
	onCancel,
}: RecommendationsPanelProps ) {
	// Track slugs dismissed via the sidebar kebab menu.
	const [ dismissedSlugs, setDismissedSlugs ] = useState< Set< string > >(
		new Set()
	);
	const [ hasCompleted, setHasCompleted ] = useState( false );
	const [ lastChecked, setLastChecked ] = useState< Date | null >( null );
	const prevIsScanning = useRef( isScanning );

	// Mark completion when scanning transitions from true → false.
	useEffect( () => {
		if ( prevIsScanning.current && ! isScanning ) {
			setHasCompleted( true );
			setLastChecked( new Date() );
		}
		prevIsScanning.current = isScanning;
	}, [ isScanning ] );

	// Show items from the live prop immediately as they arrive,
	// minus any locally dismissed from the sidebar.
	const displayItems = items.filter(
		( item ) => ! dismissedSlugs.has( item.slug )
	);

	const handleDismissItem = ( slug: string ) => {
		setDismissedSlugs( ( prev ) => new Set( prev ).add( slug ) );
		onDismissItem( slug );
	};

	const handleDismissAll = () => {
		setDismissedSlugs(
			new Set( items.map( ( item ) => item.slug ) )
		);
		for ( const item of items ) {
			if ( ! dismissedSlugs.has( item.slug ) ) {
				onDismissItem( item.slug );
			}
		}
	};

	const handleCheckAgain = () => {
		setHasCompleted( false );
		setDismissedSlugs( new Set() );
		onCheckAgain();
	};

	const showScanningMessage = isScanning && displayItems.length === 0;
	const showReadyMessage = displayItems.length > 0;
	const showEmptyState =
		hasCompleted && ! isScanning && displayItems.length === 0;

	const formatLastChecked = ( date: Date ) => {
		return date.toLocaleTimeString( undefined, {
			hour: 'numeric',
			minute: '2-digit',
		} );
	};

	return (
		<Card className="content-guidelines__recommendations">
			<VStack spacing={ 3 }>
				<HStack
					spacing={ 1 }
					alignment="center"
					justify="flex-start"
				>
					<Icon icon={ jetpackIcon } />
					<Heading
						level={ 2 }
						size={ 13 }
						weight={ 500 }
						style={ { flex: 1 } }
					>
						{ __( 'Guideline suggestions' ) }
					</Heading>
					{ isScanning && <Spinner /> }
				</HStack>
				{ showScanningMessage && (
					<Text
						size={ 13 }
						variant="muted"
					>
						{ __(
							"We're scanning your site to build personalized guideline suggestions."
						) }
					</Text>
				) }
				{ showReadyMessage && (
					<Text
						size={ 13 }
						variant="muted"
					>
						{ sprintf(
							/* translators: %d: Number of suggestions. */
							__( '%d suggestions ready.' ),
							displayItems.length
						) }
					</Text>
				) }
				{ displayItems.length > 0 && (
					/* eslint-disable jsx-a11y/no-redundant-roles */
					<ul
						role="list"
						className="content-guidelines__recommendations-list"
					>
						{ displayItems.map( ( item ) => (
							<li
								key={ item.slug }
								className="content-guidelines__recommendations-item"
							>
								<HStack
									alignment="top"
									spacing={ 0 }
								>
									<Button
										className="content-guidelines__recommendations-button"
										onClick={ () =>
											onClickItem( item.slug )
										}
									>
										<VStack spacing={ 0 }>
											<Text
												size={ 13 }
												weight={ 500 }
											>
												{ item.title }
											</Text>
											<Text
												size={ 13 }
												variant="muted"
											>
												{ item.reason }
											</Text>
										</VStack>
									</Button>
									<DropdownMenu
										icon={ moreVertical }
										label={ __( 'Actions' ) }
										className="content-guidelines__recommendations-kebab"
									>
										{ ( { onClose } ) => (
											<MenuGroup>
												<MenuItem
													onClick={ () => {
														onClickItem(
															item.slug
														);
														onClose();
													} }
												>
													{ __( 'Review' ) }
												</MenuItem>
												<MenuItem
													onClick={ () => {
														handleDismissItem(
															item.slug
														);
														onClose();
													} }
												>
													{ __( 'Dismiss' ) }
												</MenuItem>
											</MenuGroup>
										) }
									</DropdownMenu>
								</HStack>
							</li>
						) ) }
					</ul>
					/* eslint-enable jsx-a11y/no-redundant-roles */
				) }
				{ ! isScanning && displayItems.length > 0 && (
					<Button
						variant="secondary"
						size="small"
						style={ { alignSelf: 'flex-start' } }
						onClick={ handleDismissAll }
					>
						{ __( 'Dismiss all' ) }
					</Button>
				) }
				{ showEmptyState && lastChecked && (
					<>
						<Text
							size={ 13 }
							variant="muted"
						>
							{ sprintf(
								/* translators: %s: Time of last check (e.g. "11:49 AM"). */
								__( 'Your guidelines are up to date. Last checked today at %s.' ),
								formatLastChecked( lastChecked )
							) }
						</Text>
						<Button
							variant="secondary"
							size="small"
							style={ { alignSelf: 'flex-start' } }
							onClick={ handleCheckAgain }
						>
							{ __( 'Check again' ) }
						</Button>
					</>
				) }
			</VStack>
		</Card>
	);
}

// ── AccordionWithAi (same as Exploration B) ──

interface AccordionWithAiProps {
	title: string;
	description: string;
	slug: string;
	suggestion: string | undefined;
	sectionState: SectionState;
	isTextStreaming: boolean;
	onGenerateSection: ( slug: string ) => void;
	onAccept: ( slug: string ) => void;
	onDismiss: ( slug: string ) => void;
	accordionRef?: ( el: HTMLDivElement | null ) => void;
	forceOpenCounter?: number;
	isHighlighted?: boolean;
	onClearHighlight?: () => void;
}

function AccordionWithAi( {
	title,
	description,
	slug,
	suggestion,
	sectionState,
	isTextStreaming,
	onGenerateSection,
	onAccept,
	onDismiss,
	accordionRef,
	forceOpenCounter,
	isHighlighted,
	onClearHighlight,
}: AccordionWithAiProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	// @ts-ignore
	const { setGuideline } = useDispatch( STORE_NAME );
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	const { value } = useSelect(
		( select ) => ( {
			// @ts-ignore
			value: select( STORE_NAME ).getGuideline( slug ) as string,
		} ),
		[ slug ]
	);

	const [ draft, setDraft ] = useState( value );
	useEffect( () => setDraft( value ), [ value ] );

	// Force open when a recommendation is clicked.
	useEffect( () => {
		if ( forceOpenCounter && forceOpenCounter > 0 ) {
			setIsOpen( true );
		}
	}, [ forceOpenCounter ] );

	const preImproveDraft = useRef< string >( draft );

	// Capture the draft before generation starts — handles both button clicks
	// and sidebar-triggered scans where handleGenerate isn't called.
	const prevSectionState = useRef< string | undefined >( sectionState );
	useEffect( () => {
		if (
			prevSectionState.current !== 'requesting' &&
			sectionState === 'requesting'
		) {
			preImproveDraft.current = draft;
		}
		prevSectionState.current = sectionState;
	}, [ sectionState, draft ] );

	const isStreaming =
		sectionState === 'streaming' || sectionState === 'requesting';
	const showDiff = sectionState === 'done' && suggestion !== undefined;

	// Height tethering.
	const fieldContainerRef = useRef< HTMLDivElement >( null );
	const [ userFieldHeight, setUserFieldHeight ] = useState< number | null >(
		null
	);

	useEffect( () => {
		const container = fieldContainerRef.current;
		if ( ! container ) {
			return;
		}

		let tracking = false;

		const onMouseDown = () => {
			tracking = true;
		};
		const onMouseUp = () => {
			if ( ! tracking ) {
				return;
			}
			tracking = false;
			const el = container.querySelector(
				'textarea, .content-guidelines__diff-wrapper'
			) as HTMLElement | null;
			if ( el ) {
				setUserFieldHeight( el.offsetHeight );
			}
		};

		container.addEventListener( 'mousedown', onMouseDown );
		document.addEventListener( 'mouseup', onMouseUp );
		return () => {
			container.removeEventListener( 'mousedown', onMouseDown );
			document.removeEventListener( 'mouseup', onMouseUp );
		};
	}, [] );

	const handleSave = () => {
		setGuideline( slug, draft );
		setSaving( true );
		saveContentGuidelines()
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines saved.' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) => setError( e.message ) )
			.finally( () => setSaving( false ) );
	};

	const handleGenerate = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		( e.target as HTMLButtonElement ).blur();
		preImproveDraft.current = draft;
		onGenerateSection( slug );
	};

	const handleAccept = ( e?: React.MouseEvent ) => {
		e?.preventDefault();
		if ( suggestion ) {
			setDraft( suggestion );
			setGuideline( slug, suggestion );
		}
		onAccept( slug );
		onClearHighlight?.();
	};

	const handleDismiss = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		setDraft( preImproveDraft.current );
		setGuideline( slug, preImproveDraft.current );
		onDismiss( slug );
		onClearHighlight?.();
	};

	const labelSource = isStreaming ? preImproveDraft.current : draft;
	const generateLabel =
		labelSource.trim().length > 0
			? __( 'Improve guidelines' )
			: __( 'Generate guidelines' );

	const contentId = `content-guidelines-${ slug }`;
	const headingId = `content-guidelines-${ slug }-heading`;
	const descriptionId = `content-guidelines-${ slug }-description`;

	const cardClassName = [
		'content-guidelines__accordion',
		isHighlighted ? 'content-guidelines__accordion--highlighted' : '',
	].filter( Boolean ).join( ' ' );

	return (
		<div ref={ accordionRef }>
			<Card className={ cardClassName }>
				<Button
					className="content-guidelines__accordion-trigger"
					onClick={ () => setIsOpen( ! isOpen ) }
					aria-expanded={ isOpen }
					aria-controls={ contentId }
					aria-describedby={ descriptionId }
					aria-label={
						isOpen
							? sprintf(
									/* translators: %s: Guideline title */
									__( 'Collapse %s guidelines' ),
									title
							  )
							: sprintf(
									/* translators: %s: Guideline title */
									__( 'Expand %s guidelines' ),
									title
							  )
					}
				>
					<HStack spacing={ 4 }>
						<VStack
							spacing={ 1 }
							style={ { minWidth: 0 } }
						>
							<Heading
								id={ headingId }
								className="content-guidelines__accordion-header"
								level={ 2 }
								size={ 15 }
								weight={ 400 }
							>
								{ title }
							</Heading>
							<Text
								id={ descriptionId }
								className="content-guidelines__accordion-description"
								size={ 13 }
								weight={ 400 }
								variant="muted"
							>
								{ description }
							</Text>
						</VStack>
						<HStack
							spacing={ 2 }
							expanded={ false }
							style={ { flexShrink: 0 } }
						>
							<span
								style={ {
									opacity:
										showDiff && ! isOpen ? 1 : 0,
								} }
							>
								<span className="content-guidelines__badge">
									{ __( 'Suggestion' ) }
								</span>
							</span>
							<Icon
								icon={ chevronDown }
								className={
									isOpen
										? 'content-guidelines__accordion-chevron-up'
										: 'content-guidelines__accordion-chevron-down'
								}
							/>
						</HStack>
					</HStack>
				</Button>
				<div hidden={ ! isOpen }>
					<form
						id={ contentId }
						aria-labelledby={ headingId }
						aria-describedby={ descriptionId }
						onSubmit={ ( e ) => {
							e.preventDefault();
							handleSave();
						} }
						className="content-guidelines__accordion-form"
					>
						<VStack spacing={ 4 }>
							<div
								ref={ fieldContainerRef }
								className={ `content-guidelines__field-container${
									isStreaming && ! isTextStreaming
										? ' is-streaming'
										: ''
								}` }
								style={
									userFieldHeight
										? ( {
												'--cg-field-height': `${ userFieldHeight }px`,
										  } as React.CSSProperties )
										: undefined
								}
							>
								{ showDiff ? (
									/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
									<div
										className="content-guidelines__diff-wrapper has-suggestion"
										onClick={ () => handleAccept() }
									>
										<DiffEditor
											original={
												preImproveDraft.current
											}
											suggested={ suggestion || '' }
										/>
									</div>
								) : (
									<TextareaControl
										label={ sprintf(
											/* translators: %s: Guideline category. */
											__( '%s guidelines' ),
											slug
										) }
										hideLabelFromVision
										value={ draft }
										onChange={ setDraft }
										rows={ 6 }
									/>
								) }
							</div>
							{ error && (
								<Notice.Root intent="error">
									<Notice.Title>
										{ sprintf(
											/* translators: %s: Error message. */
											__(
												'Error saving guidelines: %s'
											),
											error
										) }
									</Notice.Title>
								</Notice.Root>
							) }
							{ showDiff ? (
								<HStack spacing={ 3 } justify="flex-start">
									<Button
										variant="primary"
										onClick={ handleAccept }
										__next40pxDefaultSize
									>
										{ __( 'Accept suggestion' ) }
									</Button>
									<Button
										variant="tertiary"
										onClick={ handleDismiss }
										__next40pxDefaultSize
									>
										{ __( 'Dismiss' ) }
									</Button>
								</HStack>
							) : (
								<HStack spacing={ 3 } justify="flex-start">
									<Button
										variant="primary"
										type="submit"
										disabled={ saving || isStreaming }
										accessibleWhenDisabled
										isBusy={ saving }
										__next40pxDefaultSize
									>
										{ __( 'Save guidelines' ) }
									</Button>
									<Button
										variant="tertiary"
										onClick={ handleGenerate }
										disabled={ isStreaming }
										accessibleWhenDisabled
										__next40pxDefaultSize
									>
										{ generateLabel }
									</Button>
								</HStack>
							) }
						</VStack>
					</form>
				</div>
			</Card>
		</div>
	);
}

// ── Main component ──

const DEFAULT_BLOCKS = [ 'core/paragraph', 'core/heading', 'core/image' ];

export default function ExplorationC() {
	const [ pageLoading, setPageLoading ] = useState( true );
	const [ pageError, setPageError ] = useState< string | null >( null );
	const [ scanTriggered, setScanTriggered ] = useState( false );
	const [ blocksLocalGenerate, setBlocksLocalGenerate ] = useState( false );
	const [ localGenerateSlugs, setLocalGenerateSlugs ] = useState< Set< string > >( () => new Set() );
	const [ isGlobalScanning, setIsGlobalScanning ] = useState( false );

	const {
		suggestions,
		sectionStates,
		blockSuggestions,
		blockGeneratingState,
		textStreamingKeys,
		generate,
		generateSection,
		generateBlock,
		generateAllBlocks,
		acceptSuggestion,
		dismissSuggestion,
		acceptBlockSuggestion,
		dismissBlockSuggestion,
		cancelAll,
		isGenerating,
	} = useAiGuidelines();

	const { isEmpty, blockGuidelineNames } = useSelect(
		( select ) => ( {
			// @ts-ignore
			isEmpty: select( STORE_NAME ).isGuidelinesEmpty(),
			// @ts-ignore
			blockGuidelineNames: Object.keys(
				select( STORE_NAME ).getBlockGuidelines() || {}
			),
		} ),
		[]
	);

	// Refs for scrolling to each section accordion.
	const sectionRefs = useRef< Record< string, HTMLDivElement | null > >( {} );
	const blocksAccordionRef = useRef< HTMLDivElement >( null );

	// Track which sections have been force-opened by clicking a recommendation.
	// Uses a counter so that clicking the same recommendation again re-triggers the effect.
	const [ forceOpenCounters, setForceOpenCounters ] = useState< Record< string, number > >( {} );

	// Track which accordion is highlighted after a sidebar click.
	const [ highlightedSlug, setHighlightedSlug ] = useState< string | null >( null );
	const mainColRef = useRef< HTMLDivElement >( null );

	// Click-outside listener to clear the highlight.
	useEffect( () => {
		if ( ! highlightedSlug ) {
			return;
		}
		const handleClickOutside = ( e: MouseEvent ) => {
			const target = e.target as HTMLElement;
			// If click is inside the highlighted accordion card, keep the highlight.
			const highlightedCard = mainColRef.current?.querySelector(
				'.content-guidelines__accordion--highlighted'
			);
			if ( highlightedCard?.contains( target ) ) {
				return;
			}
			setHighlightedSlug( null );
		};
		document.addEventListener( 'mousedown', handleClickOutside );
		return () => document.removeEventListener( 'mousedown', handleClickOutside );
	}, [ highlightedSlug ] );

	useEffect( () => {
		fetchContentGuidelines()
			.then( () => setPageError( null ) )
			.catch( ( e: Error ) => setPageError( e.message ) )
			.finally( () => setPageLoading( false ) );
	}, [] );

	// Auto-scan: trigger generation once data is loaded.
	useEffect( () => {
		if ( pageLoading || pageError || scanTriggered ) {
			return;
		}

		setScanTriggered( true );
		setIsGlobalScanning( true );
		generate();
		const blockNames =
			blockGuidelineNames.length > 0
				? blockGuidelineNames
				: DEFAULT_BLOCKS;
		generateAllBlocks( blockNames );
	}, [ pageLoading, pageError, scanTriggered ] );

	// Turn off global scanning flag when all generation completes.
	useEffect( () => {
		if ( isGlobalScanning && ! isGenerating ) {
			setIsGlobalScanning( false );
		}
	}, [ isGlobalScanning, isGenerating ] );

	// Build recommendation items from sections that have finished generating.
	const recommendationItems: RecommendationItem[] = [];
	for ( const item of GUIDELINE_ITEMS ) {
		if ( item.slug === 'blocks' ) {
			// Show a single recommendation for blocks if any have suggestions.
			// Only show if suggestions came from the auto-scan, not in-card generation.
			const blockSuggestionCount =
				Object.keys( blockSuggestions ).length;
			if ( blockSuggestionCount > 0 && ! blocksLocalGenerate ) {
				recommendationItems.push( {
					slug: 'blocks',
					title: item.title,
					reason: sprintf(
						/* translators: %d: Number of block guidelines with suggestions. */
						__( '%d block guidelines could be improved.' ),
						blockSuggestionCount
					),
				} );
			}
			continue;
		}
		if (
			sectionStates[ item.slug ] === 'done' &&
			suggestions[ item.slug ] !== undefined &&
			! localGenerateSlugs.has( item.slug )
		) {
			recommendationItems.push( {
				slug: item.slug,
				title: item.title,
				reason:
					MOCK_RECOMMENDATION_REASONS[ item.slug ] ||
					__( 'We found ways to improve this section.' ),
			} );
		}
	}

	const handleRecommendationClick = useCallback( ( slug: string ) => {
		setForceOpenCounters( ( prev ) => ( {
			...prev,
			[ slug ]: ( prev[ slug ] || 0 ) + 1,
		} ) );
		setHighlightedSlug( slug );

		// Scroll to the section after a brief delay to allow accordion to open.
		requestAnimationFrame( () => {
			const ref =
				slug === 'blocks'
					? blocksAccordionRef.current
					: sectionRefs.current[ slug ];
			ref?.scrollIntoView( { behavior: 'smooth', block: 'center' } );
		} );
	}, [] );

	const handleDismissRecommendation = useCallback( ( slug: string ) => {
		if ( slug === 'blocks' ) {
			for ( const blockName of Object.keys( blockSuggestions ) ) {
				dismissBlockSuggestion( blockName );
			}
		} else {
			dismissSuggestion( slug );
		}
	}, [ blockSuggestions, dismissBlockSuggestion, dismissSuggestion ] );

	// Banner removed from Exploration C — auto-scan always runs.

	return (
		<Page
			title={ __( 'Guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
		>
			{ pageError && (
				<div className="content-guidelines__content">
					<Notice.Root intent="error">
						<Notice.Title>
							{ sprintf(
								/* translators: %s: Error message. */
								__( 'Error loading guidelines: %s' ),
								pageError
							) }
						</Notice.Title>
						<Notice.Description>
							{ __(
								'Please try again. If the problem persists, contact support.'
							) }
						</Notice.Description>
					</Notice.Root>
				</div>
			) }
			{ pageLoading ? (
				<div className="content-guidelines__loading">
					<Spinner />
				</div>
			) : (
				! pageError && (
					<div className="content-guidelines__navigator-reset">
					<Navigator initialPath="/">
						<Navigator.Screen path="/">
							<VStack className="content-guidelines__content content-guidelines__content--two-col">
									<div className="content-guidelines__two-col">
									{ /* Main content column */ }
									<div className="content-guidelines__main-col" ref={ mainColRef }>
										{ /*
										 * Disable reason: The `list` ARIA role is redundant but
										 * Safari+VoiceOver won't announce the list otherwise.
										 */
										/* eslint-disable jsx-a11y/no-redundant-roles */ }
										<ul
											role="list"
											className="content-guidelines__list"
										>
											{ GUIDELINE_ITEMS.map( ( item ) => (
												<li
													key={ item.slug }
													className="content-guidelines__list-item"
												>
													<div className="content-guidelines__accordion-item">
														{ item.slug === 'blocks' ? (
															<div
																ref={
																	blocksAccordionRef
																}
															>
																<GuidelineAccordion
																	title={
																		item.title
																	}
																	description={
																		item.description
																	}
																	isGenerating={ blocksLocalGenerate && Object.values(
																		blockGeneratingState
																	).some(
																		( s ) =>
																			s ===
																				'requesting' ||
																			s ===
																				'streaming'
																	) }
																	showSpinnerOnlyWhenOpen
																	hasSuggestion={
																		Object.keys(
																			blockSuggestions
																		).length > 0
																	}
																	forceOpenCounter={
																		forceOpenCounters[ 'blocks' ] || 0
																	}
																	isHighlighted={
																		highlightedSlug === 'blocks'
																	}
																>
																	<BlockGuidelines
																		blockSuggestions={
																			blockSuggestions
																		}
																		blockGeneratingState={
																			blockGeneratingState
																		}
																		textStreamingKeys={
																			textStreamingKeys
																		}
																		generateBlock={ ( blockName: string ) => {
																			setBlocksLocalGenerate( true );
																			generateBlock( blockName );
																		} }
																		generateAllBlocks={ ( blockNames: string[] ) => {
																			setBlocksLocalGenerate( true );
																			generateAllBlocks( blockNames );
																		} }
																		acceptBlockSuggestion={
																			acceptBlockSuggestion
																		}
																		dismissBlockSuggestion={
																			dismissBlockSuggestion
																		}
																	/>
																</GuidelineAccordion>
															</div>
														) : (
															<AccordionWithAi
																title={ item.title }
																description={
																	item.description
																}
																slug={ item.slug }
																suggestion={
																	suggestions[
																		item.slug
																	]
																}
																sectionState={
																	sectionStates[
																		item.slug
																	] || 'idle'
																}
																onGenerateSection={ ( slug: string ) => {
																	setLocalGenerateSlugs( ( prev ) => new Set( prev ).add( slug ) );
																	generateSection( slug );
																} }
																isTextStreaming={
																	!! textStreamingKeys[
																		item.slug
																	]
																}
																onAccept={
																	acceptSuggestion
																}
																onDismiss={
																	dismissSuggestion
																}
																accordionRef={ ( el: HTMLDivElement | null ) => {
																	sectionRefs.current[
																		item.slug
																	] = el;
																} }
																forceOpenCounter={
																	forceOpenCounters[ item.slug ] || 0
																}
																isHighlighted={
																	highlightedSlug === item.slug
																}
																onClearHighlight={ () => setHighlightedSlug( null ) }
															/>
														) }
													</div>
												</li>
											) ) }
										</ul>
										{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
										<ActionsSection />
									</div>

									{ /* Proactive recommendations sidebar — always rendered to avoid layout shift */ }
									<div className="content-guidelines__sidebar-col">
										<RecommendationsPanel
											items={ recommendationItems }
											isScanning={ isGlobalScanning }
											onClickItem={
												handleRecommendationClick
											}
											onDismissItem={
												handleDismissRecommendation
											}
											onCheckAgain={ () => {
												setIsGlobalScanning( true );
												generate();
												const blockNames =
													blockGuidelineNames.length > 0
														? blockGuidelineNames
														: DEFAULT_BLOCKS;
												generateAllBlocks( blockNames );
											} }
											onCancel={ () => {
												cancelAll();
												setIsGlobalScanning( false );
											} }
										/>
									</div>
								</div>
							</VStack>
						</Navigator.Screen>
						<Navigator.Screen path="/revision-history">
							<RevisionHistory />
						</Navigator.Screen>
					</Navigator>
					</div>
				)
			) }
		</Page>
	);
}
