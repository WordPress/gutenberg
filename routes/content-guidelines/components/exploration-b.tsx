/* @jsx createElement */

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
import { Page } from '@wordpress/admin-ui';
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
import { Notice } from '@wordpress/ui';
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

interface AccordionWithAiProps {
	title: string;
	description: string;
	slug: string;
	suggestion: string | undefined;
	sectionState: SectionState;
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

	// Store the pre-suggestion value for revert on dismiss
	const preImproveDraft = useRef< string >( '' );

	const isStreaming = sectionState === 'streaming' || sectionState === 'requesting';
	const showDiff = sectionState === 'done' && suggestion !== undefined;

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

	const handleAccept = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		// Accept keeps the suggestion in the draft (already written by streaming).
		// Does NOT save — user must explicitly save.
		onAccept( slug );
	};

	const handleDismiss = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		// Revert to pre-suggestion value.
		setDraft( preImproveDraft.current );
		setGuideline( slug, preImproveDraft.current );
		onDismiss( slug );
	};

	const generateLabel = draft.trim().length > 0
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
					<Icon
						icon={ chevronDown }
						className={
							isOpen
								? 'content-guidelines__accordion-chevron-up'
								: 'content-guidelines__accordion-chevron-down'
						}
					/>
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
						{ showDiff ? (
							<div className="content-guidelines__diff-wrapper has-suggestion">
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
								disabled={ isStreaming }
							/>
						) }
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
									{ __( 'Accept' ) }
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
									isBusy={ isStreaming }
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
		generate,
		generateSection,
		acceptSuggestion,
		dismissSuggestion,
		isGenerating,
	} = useAiGuidelines();

	const isEmpty = useSelect(
		// @ts-ignore
		( select ) => select( STORE_NAME ).isGuidelinesEmpty(),
		[]
	);

	useEffect( () => {
		fetchContentGuidelines()
			.then( () => setPageError( null ) )
			.catch( ( e: Error ) => setPageError( e.message ) )
			.finally( () => setPageLoading( false ) );
	}, [] );

	const handleHeaderGenerate = ( e: React.MouseEvent< HTMLButtonElement > ) => {
		( e.target as HTMLButtonElement ).blur();
		generate();
	};

	const headerButtonLabel = isEmpty
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
													>
														<BlockGuidelines />
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
