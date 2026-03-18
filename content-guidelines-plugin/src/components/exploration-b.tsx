/**
 * Exploration B — "Suggest All"
 *
 * Primary AI exploration for Content Guidelines. Features:
 * - Top-level "Improve guidelines" / "Generate guidelines" button
 * - Per-section "Improve guideline" / "Generate guideline" buttons
 * - Suggestion goes directly into the editable textarea (green border during diff)
 * - DiffEditor for word-level diff review with Accept/Dismiss
 * - Empty state banner with localStorage persistence
 * - Block modal generates inline with shimmer, then diff review
 */

/**
 * WordPress dependencies
 */
import { Page } from '../shims/page';
import { __, sprintf } from '@wordpress/i18n';
import {
	createElement,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import {
	Button,
	Card,
	Icon,
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
import { chevronDown, closeSmall } from '@wordpress/icons';
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
import GuidelineAccordion from './guideline-accordion';
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

const BANNER_STORAGE_KEY = 'content-guidelines-banner-dismissed';

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

	// Store the pre-suggestion value for revert on dismiss.
	// Initialized with draft so global generate (header button) has the right baseline.
	const preImproveDraft = useRef< string >( draft );

	// Auto-capture when sectionState transitions to 'requesting' (covers global generate).
	useEffect( () => {
		if ( sectionState === 'requesting' ) {
			preImproveDraft.current = draft;
		}
	}, [ sectionState, draft ] );

	const isStreaming = sectionState === 'streaming' || sectionState === 'requesting';
	const showDiff = sectionState === 'done' && suggestion !== undefined;

	// Height tethering: sync textarea and diff wrapper heights on user resize.
	const fieldContainerRef = useRef< HTMLDivElement >( null );
	const [ userFieldHeight, setUserFieldHeight ] = useState< number | null >( null );

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
		// Explicitly set draft to the full suggestion text before clearing.
		if ( suggestion ) {
			setDraft( suggestion );
			setGuideline( slug, suggestion );
		}
		onAccept( slug );
	};

	const handleDismiss = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		// Revert to pre-suggestion value.
		setDraft( preImproveDraft.current );
		setGuideline( slug, preImproveDraft.current );
		onDismiss( slug );
	};

	// Lock the label to the pre-generation state so it doesn't flip mid-generation.
	const labelSource = isStreaming ? preImproveDraft.current : draft;
	const generateLabel = labelSource.trim().length > 0
		? __( 'Improve guidelines' )
		: __( 'Generate guidelines' );

	const contentId = `content-guidelines-${ slug }`;
	const headingId = `content-guidelines-${ slug }-heading`;
	const descriptionId = `content-guidelines-${ slug }-description`;

	return (
		<Card className="content-guidelines__accordion">
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
					<VStack spacing={ 1 }>
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
					<HStack spacing={ 2 } expanded={ false }>
						{ isStreaming && ! isOpen && (
							<Spinner
								className="content-guidelines__accordion-spinner"
							/>
						) }
						{ showDiff && ! isOpen && (
							<span className="content-guidelines__badge">
								{ __( 'Suggestion' ) }
							</span>
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
							className={ `content-guidelines__field-container${ isStreaming && ! isTextStreaming ? ' is-streaming' : '' }` }
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
										original={ preImproveDraft.current }
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
										__( 'Error saving guidelines: %s' ),
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
	);
}

export default function ExplorationB() {
	const [ pageLoading, setPageLoading ] = useState( true );
	const [ pageError, setPageError ] = useState< string | null >( null );

	const [ bannerDismissed, setBannerDismissedState ] = useState( () =>
		window.localStorage.getItem( BANNER_STORAGE_KEY ) === '1'
	);

	const setBannerDismissed = ( dismissed: boolean ) => {
		setBannerDismissedState( dismissed );
		if ( dismissed ) {
			window.localStorage.setItem( BANNER_STORAGE_KEY, '1' );
		}
	};

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
		isGenerating,
	} = useAiGuidelines();

	const { isEmpty, blockGuidelineNames } = useSelect(
		( select ) => ( {
			// @ts-ignore
			isEmpty: select( STORE_NAME ).isGuidelinesEmpty(),
			// @ts-ignore
			blockGuidelineNames: Object.keys( select( STORE_NAME ).getBlockGuidelines() || {} ),
		} ),
		[]
	);

	useEffect( () => {
		fetchContentGuidelines()
			.then( () => setPageError( null ) )
			.catch( ( e: Error ) => setPageError( e.message ) )
			.finally( () => setPageLoading( false ) );
	}, [] );

	// Lock the label at click time so it doesn't flip mid-generation.
	const headerLabelRef = useRef< string | null >( null );

	const DEFAULT_BLOCKS = [
		'core/paragraph',
		'core/heading',
		'core/image',
	];

	const handleHeaderGenerate = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		( e.target as HTMLButtonElement ).blur();
		headerLabelRef.current = isEmpty
			? __( 'Generate guidelines' )
			: __( 'Improve guidelines' );
		generate();
		// Also generate block guidelines
		const blockNames = blockGuidelineNames.length > 0
			? blockGuidelineNames
			: DEFAULT_BLOCKS;
		generateAllBlocks( blockNames );
	};

	const headerButtonLabel = isGenerating && headerLabelRef.current
		? headerLabelRef.current
		: isEmpty
			? __( 'Generate guidelines' )
			: __( 'Improve guidelines' );

	return (
		<Page
			title={ __( 'Guidelines' ) }
			subTitle={ __(
				"Set content standards that guide your team, inform plugins, and help AI tools generate content that matches your site's voice and requirements."
			) }
			actions={
				bannerDismissed ? (
					<Button
						variant="primary"
						icon={ jetpackIcon }
						onClick={ handleHeaderGenerate }
						disabled={ isGenerating }
						accessibleWhenDisabled
						isBusy={ isGenerating }
						__next40pxDefaultSize
					>
						{ headerButtonLabel }
					</Button>
				) : undefined
			}
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
					<Navigator initialPath="/">
						<Navigator.Screen path="/">
							<VStack className="content-guidelines__content">
								{ /* Empty state banner */ }
								{ ! bannerDismissed && ! pageLoading && (
									<div className="content-guidelines__empty-banner">
										<div className="content-guidelines__empty-banner-content">
											<h2>
												{ __(
													'Generate your guidelines in seconds'
												) }
											</h2>
											<p>
												{ __(
													'Use Jetpack to analyze your site and create draft guidelines based on your actual content.'
												) }
											</p>
											<HStack
												spacing={ 3 }
												justify="flex-start"
												className="content-guidelines__empty-banner-actions"
											>
												<Button
													className="content-guidelines__empty-banner-cta"
													variant="primary"
													onClick={ () => {
														setBannerDismissed(
															true
														);
														generate();
														generateAllBlocks(
															DEFAULT_BLOCKS
														);
													} }
													__next40pxDefaultSize
												>
													{ __( 'Get started' ) }
												</Button>
												<Button
													className="content-guidelines__empty-banner-close-text"
													variant="tertiary"
													onClick={ () =>
														setBannerDismissed(
															true
														)
													}
													__next40pxDefaultSize
												>
													{ __( 'Close' ) }
												</Button>
											</HStack>
										</div>
										<Button
											className="content-guidelines__empty-banner-close"
											icon={ closeSmall }
											label={ __(
												'Dismiss banner'
											) }
											size="small"
											onClick={ () =>
												setBannerDismissed( true )
											}
										/>
										<div className="content-guidelines__empty-banner-orb content-guidelines__empty-banner-orb--top" />
										<div className="content-guidelines__empty-banner-orb content-guidelines__empty-banner-orb--bottom" />
									</div>
								) }
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
													<GuidelineAccordion
														title={ item.title }
														description={
															item.description
														}
														isGenerating={
															Object.values( blockGeneratingState ).some(
																( s ) => s === 'requesting' || s === 'streaming'
															)
														}
														hasSuggestion={
															Object.keys( blockSuggestions ).length > 0
														}
													>
														<BlockGuidelines
															blockSuggestions={ blockSuggestions }
															blockGeneratingState={ blockGeneratingState }
															textStreamingKeys={ textStreamingKeys }
															generateBlock={ generateBlock }
															generateAllBlocks={ generateAllBlocks }
															acceptBlockSuggestion={ acceptBlockSuggestion }
															dismissBlockSuggestion={ dismissBlockSuggestion }
														/>
													</GuidelineAccordion>
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
														onGenerateSection={
															generateSection
														}
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
													/>
												) }
											</div>
										</li>
									) ) }
								</ul>
								{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
								<ActionsSection />
							</VStack>
						</Navigator.Screen>
						<Navigator.Screen path="/revision-history">
							<RevisionHistory />
						</Navigator.Screen>
					</Navigator>
				)
			) }
		</Page>
	);
}
