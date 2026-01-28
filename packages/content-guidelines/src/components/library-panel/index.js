/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import {
	Navigator,
	useNavigator,
	Button,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	TextareaControl,
	TextControl,
	SelectControl,
	FormTokenField,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { SVG, Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { useGuidelines } from '../../hooks';
import RepeaterControl from '../controls/repeater-control';
import TermNoteControl from '../controls/term-note-control';
import './style.scss';

/**
 * Section definitions.
 */
const SECTIONS = [
	{
		id: 'brand_context',
		title: __( 'Brand & site context' ),
		description: __( 'Define what your site is about and who it serves.' ),
	},
	{
		id: 'voice_tone',
		title: __( 'Voice & tone' ),
		description: __(
			'Set the personality and emotional feel of your content.'
		),
	},
	{
		id: 'copy_rules',
		title: __( 'Copy rules' ),
		description: __( "Specific dos and don'ts for writing." ),
	},
	{
		id: 'vocabulary',
		title: __( 'Vocabulary' ),
		description: __( 'Preferred terms and words to avoid.' ),
	},
	{
		id: 'heuristics',
		title: __( 'Heuristics' ),
		description: __( 'Target metrics for sentence length and structure.' ),
	},
	{
		id: 'references',
		title: __( 'References' ),
		description: __( 'Websites and content you want to emulate.' ),
	},
	{
		id: 'images',
		title: __( 'Images' ),
		description: __( 'Guidelines for image selection and alt text.' ),
	},
	{
		id: 'notes',
		title: __( 'Additional notes' ),
		description: __( 'Any other guidelines or context.' ),
	},
];

/**
 * Goal options.
 */
const GOAL_OPTIONS = [
	{ value: '', label: __( 'Select a goal…' ) },
	{
		value: 'subscribe',
		label: __( 'Get email subscribers' ),
	},
	{
		value: 'sell',
		label: __( 'Sell products/services' ),
	},
	{
		value: 'inform',
		label: __( 'Inform and educate' ),
	},
	{
		value: 'community',
		label: __( 'Build community' ),
	},
	{ value: 'other', label: __( 'Other' ) },
];

/**
 * Section card component.
 *
 * @param {Object}   props            Component props.
 * @param {Object}   props.section    Section definition.
 * @param {string}   props.statusText Status text.
 * @param {Function} props.onClick    Click handler.
 * @return {JSX.Element} Section card.
 */
function SectionCard( { section, statusText, onClick } ) {
	const navigator = useNavigator();

	const handleClick = () => {
		if ( onClick ) {
			onClick();
		}
		navigator.goTo( `/${ section.id }` );
	};

	return (
		<button
			type="button"
			className="library-panel__section-card"
			onClick={ handleClick }
		>
			<div className="library-panel__section-card-content">
				<div className="library-panel__section-card-text">
					<span className="library-panel__section-title">
						{ section.title }
					</span>
					<span className="library-panel__section-description">
						{ section.description }
					</span>
				</div>
				<div className="library-panel__section-card-meta">
					{ statusText && (
						<span className="library-panel__section-status">
							{ statusText }
						</span>
					) }
					<SVG
						className="library-panel__section-chevron"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						aria-hidden="true"
						focusable="false"
					>
						<Path d="M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" />
					</SVG>
				</div>
			</div>
		</button>
	);
}

/**
 * Analyze text content and return metrics.
 *
 * @param {string} text Raw text content.
 * @return {Object|null} Analysis results.
 */
function analyzeText( text ) {
	if ( ! text || typeof text !== 'string' ) {
		return null;
	}

	const cleanText = text
		.replace( /<[^>]*>/g, ' ' )
		.replace( /&nbsp;/g, ' ' )
		.replace( /\s+/g, ' ' )
		.trim();

	if ( ! cleanText ) {
		return null;
	}

	const sentences = cleanText
		.split( /[.!?]+(?=\s|$)/g )
		.map( ( s ) => s.trim() )
		.filter( ( s ) => s.length > 0 );

	const paragraphs = text
		.split( /(?:<\/p>|<br\s*\/?>\s*<br\s*\/?>|\n\n+)/i )
		.map( ( p ) => p.replace( /<[^>]*>/g, ' ' ).trim() )
		.filter( ( p ) => p.length > 0 );

	const words = cleanText.split( /\s+/ ).filter( ( w ) => w.length > 0 );

	return {
		wordCount: words.length,
		sentenceCount: sentences.length,
		paragraphCount: paragraphs.length,
		avgWordsPerSentence:
			sentences.length > 0
				? Math.round( ( words.length / sentences.length ) * 10 ) / 10
				: 0,
		avgSentencesPerParagraph:
			paragraphs.length > 0
				? Math.round( ( sentences.length / paragraphs.length ) * 10 ) /
				  10
				: 0,
	};
}

/**
 * Heuristics content component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.sectionData Section data.
 * @param {Function} props.onChange    Change handler.
 * @return {JSX.Element} Heuristics content.
 */
function HeuristicsContent( { sectionData, onChange } ) {
	const [ isAnalyzing, setIsAnalyzing ] = useState( false );
	const [ analysisResult, setAnalysisResult ] = useState( null );

	const runAnalysis = async () => {
		setIsAnalyzing( true );
		setAnalysisResult( null );

		try {
			const posts = await apiFetch( {
				path: '/wp/v2/posts?per_page=20&status=publish&_fields=id,content',
			} );

			if ( posts && posts.length > 0 ) {
				const analyses = posts
					.map( ( post ) =>
						analyzeText( post.content?.rendered || '' )
					)
					.filter( Boolean );

				if ( analyses.length > 0 ) {
					const avgWords = Math.round(
						analyses.reduce(
							( sum, a ) => sum + a.avgWordsPerSentence,
							0
						) / analyses.length
					);
					const avgSentences =
						Math.round(
							( analyses.reduce(
								( sum, a ) => sum + a.avgSentencesPerParagraph,
								0
							) /
								analyses.length ) *
								10
						) / 10;

					setAnalysisResult( {
						avgWords,
						avgSentences,
						postCount: analyses.length,
					} );
				}
			}
		} catch ( err ) {
			// Silently fail
		}

		setIsAnalyzing( false );
	};

	const applyAnalysis = () => {
		if ( analysisResult ) {
			onChange( 'words_per_sentence', analysisResult.avgWords );
			onChange( 'sentences_per_paragraph', analysisResult.avgSentences );
			setAnalysisResult( null );
		}
	};

	const isCustomReadingLevel = sectionData.reading_level === 'custom';

	return (
		<VStack spacing={ 4 }>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				type="number"
				label={ __( 'Target words per sentence' ) }
				value={ sectionData.words_per_sentence || '' }
				onChange={ ( value ) =>
					onChange(
						'words_per_sentence',
						value ? parseInt( value, 10 ) : ''
					)
				}
				min={ 1 }
				max={ 50 }
			/>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				type="number"
				label={ __( 'Target sentences per paragraph' ) }
				value={ sectionData.sentences_per_paragraph || '' }
				onChange={ ( value ) =>
					onChange(
						'sentences_per_paragraph',
						value ? parseFloat( value ) : ''
					)
				}
				min={ 1 }
				max={ 20 }
				step={ 0.5 }
			/>
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				type="number"
				label={ __( 'Target paragraphs per section' ) }
				value={ sectionData.paragraphs_per_section || '' }
				onChange={ ( value ) =>
					onChange(
						'paragraphs_per_section',
						value ? parseInt( value, 10 ) : ''
					)
				}
				min={ 1 }
				max={ 20 }
			/>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'Reading level' ) }
				</span>
			</div>

			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				label={ __( 'Target reading level' ) }
				value={ sectionData.reading_level || '' }
				options={ [
					{
						value: '',
						label: __( 'Not specified' ),
					},
					{
						value: 'simple',
						label: __( 'Simple (grade 6–8)' ),
					},
					{
						value: 'standard',
						label: __( 'Standard (grade 9–12)' ),
					},
					{
						value: 'advanced',
						label: __( 'Advanced (college+)' ),
					},
					{
						value: 'custom',
						label: __( 'Custom' ),
					},
				] }
				onChange={ ( value ) => onChange( 'reading_level', value ) }
			/>
			{ isCustomReadingLevel && (
				<TextControl
					__nextHasNoMarginBottom
					__next40pxDefaultSize
					label={ __( 'Custom reading level' ) }
					value={ sectionData.reading_level_custom || '' }
					onChange={ ( value ) =>
						onChange( 'reading_level_custom', value )
					}
					placeholder={ __(
						'e.g., Technical professionals, Medical audience'
					) }
				/>
			) }
			<TextControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				type="number"
				label={ __( 'Maximum word length (syllables)' ) }
				help={ __(
					'Prefer words with fewer syllables for simpler reading.'
				) }
				value={ sectionData.max_syllables || '' }
				onChange={ ( value ) =>
					onChange(
						'max_syllables',
						value ? parseInt( value, 10 ) : ''
					)
				}
				min={ 1 }
				max={ 10 }
			/>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'Analyze existing content' ) }
				</span>
			</div>

			<HStack spacing={ 3 }>
				<Button
					variant="secondary"
					onClick={ runAnalysis }
					disabled={ isAnalyzing }
					isBusy={ isAnalyzing }
					accessibleWhenDisabled
					__next40pxDefaultSize
				>
					{ isAnalyzing ? __( 'Analyzing…' ) : __( 'Analyze posts' ) }
				</Button>
				{ analysisResult && (
					<Button
						variant="primary"
						onClick={ applyAnalysis }
						__next40pxDefaultSize
					>
						{ __( 'Apply' ) }
					</Button>
				) }
			</HStack>

			{ analysisResult && (
				<Text variant="muted">
					{ __( 'Based on' ) } { analysisResult.postCount }{ ' ' }
					{ __( 'posts:' ) } { analysisResult.avgWords }{ ' ' }
					{ __( 'words/sentence,' ) } { analysisResult.avgSentences }{ ' ' }
					{ __( 'sentences/paragraph' ) }
				</Text>
			) }
		</VStack>
	);
}

/**
 * Reference types that are web-based (use URL field type).
 */
const WEB_TYPES = [ 'website', 'article', 'competitor' ];

/**
 * Single reference item component.
 *
 * @param {Object}   props           Component props.
 * @param {Object}   props.reference The reference data.
 * @param {Function} props.onUpdate  Update handler.
 * @param {Function} props.onRemove  Remove handler.
 * @return {JSX.Element} Reference item.
 */
function ReferenceItem( { reference, onUpdate, onRemove } ) {
	const isWebType = WEB_TYPES.includes( reference.type || 'website' );

	return (
		<div className="library-panel__reference-item">
			<div className="library-panel__reference-fields">
				<VStack spacing={ 2 }>
					<HStack spacing={ 2 }>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Type' ) }
							value={ reference.type || 'website' }
							options={ [
								{
									value: 'website',
									label: __( 'Website' ),
								},
								{
									value: 'article',
									label: __( 'Article' ),
								},
								{
									value: 'book',
									label: __( 'Book' ),
								},
								{
									value: 'document',
									label: __( 'Document' ),
								},
								{
									value: 'competitor',
									label: __( 'Competitor' ),
								},
								{
									value: 'other',
									label: __( 'Other' ),
								},
							] }
							onChange={ ( value ) => onUpdate( 'type', value ) }
						/>
						<div style={ { flex: 1 } }>
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Title' ) }
								value={ reference.title || '' }
								onChange={ ( value ) =>
									onUpdate( 'title', value )
								}
								placeholder={ __( 'Reference name' ) }
							/>
						</div>
					</HStack>
					<TextControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={
							isWebType ? __( 'URL' ) : __( 'URL / Location' )
						}
						value={ reference.url || '' }
						onChange={ ( value ) => onUpdate( 'url', value ) }
						placeholder={
							reference.type === 'book'
								? __( 'ISBN or link' )
								: 'https://example.com'
						}
						type={ isWebType ? 'url' : 'text' }
					/>
					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Why you like it' ) }
						value={ reference.notes || '' }
						onChange={ ( value ) => onUpdate( 'notes', value ) }
						rows={ 2 }
						placeholder={ __(
							'What aspects do you want to emulate?'
						) }
					/>
					<Button
						variant="tertiary"
						isDestructive
						size="small"
						onClick={ onRemove }
					>
						{ __( 'Remove' ) }
					</Button>
				</VStack>
			</div>
		</div>
	);
}

/**
 * References content component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.sectionData Section data.
 * @param {Function} props.onChange    Change handler.
 * @return {JSX.Element} References content.
 */
function ReferencesContent( { sectionData, onChange } ) {
	const references = sectionData.references || [];

	const addReference = () => {
		onChange( 'references', [
			...references,
			{ type: 'website', title: '', url: '', notes: '' },
		] );
	};

	const updateReference = ( index, field, value ) => {
		const updated = [ ...references ];
		updated[ index ] = { ...updated[ index ], [ field ]: value };
		onChange( 'references', updated );
	};

	const removeReference = ( index ) => {
		onChange(
			'references',
			references.filter( ( _, i ) => i !== index )
		);
	};

	return (
		<VStack spacing={ 4 }>
			{ references.map( ( ref, index ) => (
				<ReferenceItem
					key={ index }
					reference={ ref }
					onUpdate={ ( field, value ) =>
						updateReference( index, field, value )
					}
					onRemove={ () => removeReference( index ) }
				/>
			) ) }

			<Button
				variant="secondary"
				onClick={ addReference }
				__next40pxDefaultSize
			>
				{ __( 'Add reference' ) }
			</Button>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'General notes' ) }
				</span>
			</div>

			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Reference notes' ) }
				value={ sectionData.notes || '' }
				onChange={ ( value ) => onChange( 'notes', value ) }
				rows={ 3 }
				placeholder={ __(
					'Any other notes about your content inspirations…'
				) }
			/>
		</VStack>
	);
}

/**
 * Images content component with media library support.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.sectionData Section data.
 * @param {Function} props.onChange    Change handler.
 * @return {JSX.Element} Images content.
 */
function ImagesContent( { sectionData, onChange } ) {
	const referenceImages = sectionData.reference_images || [];

	const openMediaLibrary = () => {
		const frame = window.wp.media( {
			title: __( 'Select Reference Images' ),
			multiple: true,
			library: { type: 'image' },
			button: { text: __( 'Add Images' ) },
		} );

		frame.on( 'select', () => {
			const selection = frame.state().get( 'selection' );
			const newImages = selection.map( ( attachment ) => {
				const data = attachment.toJSON();
				return {
					id: data.id,
					url: data.sizes?.medium?.url || data.url,
					alt: data.alt || '',
					notes: '',
				};
			} );
			onChange( 'reference_images', [
				...referenceImages,
				...newImages,
			] );
		} );

		frame.open();
	};

	const updateImageNotes = ( index, notes ) => {
		const updated = [ ...referenceImages ];
		updated[ index ] = { ...updated[ index ], notes };
		onChange( 'reference_images', updated );
	};

	const removeImage = ( index ) => {
		onChange(
			'reference_images',
			referenceImages.filter( ( _, i ) => i !== index )
		);
	};

	return (
		<VStack spacing={ 4 }>
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Image style' ) }
				help={ __( 'Describe the visual style for images.' ) }
				value={ sectionData.style || '' }
				onChange={ ( value ) => onChange( 'style', value ) }
				rows={ 2 }
			/>
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Alt text guidelines' ) }
				help={ __( 'How should alt text be written?' ) }
				value={ sectionData.alt_text_guidelines || '' }
				onChange={ ( value ) =>
					onChange( 'alt_text_guidelines', value )
				}
				rows={ 2 }
			/>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'Reference images' ) }
				</span>
			</div>

			{ referenceImages.length > 0 && (
				<div className="library-panel__image-grid">
					{ referenceImages.map( ( img, index ) => (
						<div
							key={ img.id || index }
							className="library-panel__image-item"
						>
							<img src={ img.url } alt={ img.alt || '' } />
							<TextControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								placeholder={ __( 'Why this image?' ) }
								value={ img.notes || '' }
								onChange={ ( value ) =>
									updateImageNotes( index, value )
								}
							/>
							<Button
								variant="tertiary"
								isDestructive
								size="small"
								onClick={ () => removeImage( index ) }
							>
								{ __( 'Remove' ) }
							</Button>
						</div>
					) ) }
				</div>
			) }

			<Button
				variant="secondary"
				onClick={ openMediaLibrary }
				__next40pxDefaultSize
			>
				{ __( 'Add reference images' ) }
			</Button>
		</VStack>
	);
}

/**
 * Section detail screen component.
 *
 * @param {Object}   props         Component props.
 * @param {Object}   props.section Section definition.
 * @param {Function} props.onBack  Back handler.
 * @return {JSX.Element} Section detail screen.
 */
function SectionDetailScreen( { section, onBack } ) {
	const { guidelines, setSection, edit, clearSection } = useGuidelines();

	const sectionData = guidelines?.[ section.id ] || {};

	const handleChange = ( field, value ) => {
		setSection( section.id, { [ field ]: value } );
	};

	const handleTopLevelChange = ( field, value ) => {
		edit( { [ field ]: value } );
	};

	const renderContent = () => {
		switch ( section.id ) {
			case 'brand_context':
				return (
					<VStack spacing={ 4 }>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'What is this site about?' ) }
							help={ __(
								'A brief description of your site, business, or publication.'
							) }
							value={ sectionData.site_description || '' }
							onChange={ ( value ) =>
								handleChange( 'site_description', value )
							}
							rows={ 3 }
						/>
						<TextControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Target audience' ) }
							help={ __( 'Who are you writing for?' ) }
							value={ sectionData.audience || '' }
							onChange={ ( value ) =>
								handleChange( 'audience', value )
							}
						/>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Primary goal' ) }
							help={ __( 'What do you want visitors to do?' ) }
							value={ sectionData.primary_goal || '' }
							options={ GOAL_OPTIONS }
							onChange={ ( value ) =>
								handleChange( 'primary_goal', value )
							}
						/>
						<FormTokenField
							label={ __( 'Topics / coverage areas' ) }
							value={ sectionData.topics || [] }
							onChange={ ( value ) =>
								handleChange( 'topics', value )
							}
							__next40pxDefaultSize
							__experimentalExpandOnFocus
							__experimentalShowHowTo={ false }
						/>
					</VStack>
				);

			case 'voice_tone':
				return (
					<VStack spacing={ 4 }>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Voice description' ) }
							help={ __(
								"How should your brand's personality come across?"
							) }
							value={ sectionData.description || '' }
							onChange={ ( value ) =>
								handleChange( 'description', value )
							}
							rows={ 3 }
						/>
						<FormTokenField
							label={ __( 'Voice attributes' ) }
							value={ sectionData.tone_traits || [] }
							onChange={ ( value ) =>
								handleChange( 'tone_traits', value )
							}
							__next40pxDefaultSize
							__experimentalExpandOnFocus
							__experimentalShowHowTo={ false }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Point of view' ) }
							value={ sectionData.pov || '' }
							options={ [
								{
									value: '',
									label: __( 'Not specified' ),
								},
								{
									value: 'we_you',
									label: __( 'We/You (conversational)' ),
								},
								{
									value: 'i_you',
									label: __( 'I/You (personal)' ),
								},
								{
									value: 'third_person',
									label: __( 'Third person (formal)' ),
								},
							] }
							onChange={ ( value ) =>
								handleChange( 'pov', value )
							}
						/>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Readability level' ) }
							value={ sectionData.readability || '' }
							options={ [
								{
									value: '',
									label: __( 'Not specified' ),
								},
								{
									value: 'simple',
									label: __( 'Simple (grade 6–8)' ),
								},
								{
									value: 'general',
									label: __( 'General (grade 9–12)' ),
								},
								{
									value: 'expert',
									label: __( 'Expert (college+)' ),
								},
							] }
							onChange={ ( value ) =>
								handleChange( 'readability', value )
							}
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Tone notes' ) }
							help={ __(
								'Any additional guidance on tone adjustments.'
							) }
							value={ sectionData.tone_notes || '' }
							onChange={ ( value ) =>
								handleChange( 'tone_notes', value )
							}
							rows={ 2 }
						/>
					</VStack>
				);

			case 'copy_rules':
				return (
					<VStack spacing={ 4 }>
						<RepeaterControl
							label={ __( 'Do' ) }
							items={ sectionData.dos || [] }
							onChange={ ( value ) =>
								handleChange( 'dos', value )
							}
							placeholder={ __( 'Add a rule…' ) }
						/>
						<RepeaterControl
							label={ __( "Don't" ) }
							items={ sectionData.donts || [] }
							onChange={ ( value ) =>
								handleChange( 'donts', value )
							}
							placeholder={ __( 'Add a rule…' ) }
						/>
					</VStack>
				);

			case 'vocabulary':
				return (
					<VStack spacing={ 4 }>
						<TermNoteControl
							label={ __( 'Preferred terms' ) }
							items={ sectionData.prefer || [] }
							onChange={ ( value ) =>
								handleChange( 'prefer', value )
							}
							termPlaceholder={ __( 'Term to use' ) }
							notePlaceholder={ __( 'Usage note (optional)' ) }
						/>
						<TermNoteControl
							label={ __( 'Terms to avoid' ) }
							items={ sectionData.avoid || [] }
							onChange={ ( value ) =>
								handleChange( 'avoid', value )
							}
							termPlaceholder={ __( 'Term to avoid' ) }
							notePlaceholder={ __(
								'Why? / Use instead (optional)'
							) }
						/>

						<div className="library-panel__divider">
							<span className="library-panel__divider-text">
								{ __( 'Acronyms' ) }
							</span>
						</div>

						<RepeaterControl
							label={ __( 'Definitions' ) }
							items={ sectionData.acronyms || [] }
							onChange={ ( value ) =>
								handleChange( 'acronyms', value )
							}
							placeholder={ __(
								'API - Application Programming Interface'
							) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Usage style' ) }
							value={
								sectionData.acronym_usage || 'expand_first'
							}
							options={ [
								{
									value: 'expand_first',
									label: __( 'Expand on first use' ),
								},
								{
									value: 'always_expand',
									label: __( 'Always include expansion' ),
								},
								{
									value: 'acronym_only',
									label: __( 'Acronym only' ),
								},
							] }
							onChange={ ( value ) =>
								handleChange( 'acronym_usage', value )
							}
						/>

						<div className="library-panel__divider">
							<span className="library-panel__divider-text">
								{ __( 'Custom dictionary' ) }
							</span>
						</div>

						<FormTokenField
							label={ __( 'Industry terms & brand names' ) }
							value={ sectionData.custom_dictionary || [] }
							onChange={ ( value ) =>
								handleChange( 'custom_dictionary', value )
							}
							__next40pxDefaultSize
							__experimentalExpandOnFocus
							__experimentalShowHowTo={ false }
						/>
						<RepeaterControl
							label={ __( 'Corrections' ) }
							items={ sectionData.voice_corrections || [] }
							onChange={ ( value ) =>
								handleChange( 'voice_corrections', value )
							}
							placeholder={ __( '"word press" → WordPress' ) }
						/>
					</VStack>
				);

			case 'heuristics':
				return (
					<HeuristicsContent
						sectionData={ sectionData }
						onChange={ handleChange }
					/>
				);

			case 'references':
				return (
					<ReferencesContent
						sectionData={ sectionData }
						onChange={ handleChange }
					/>
				);

			case 'images':
				return (
					<ImagesContent
						sectionData={ sectionData }
						onChange={ handleChange }
					/>
				);

			case 'notes':
				return (
					<VStack spacing={ 4 }>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Additional notes' ) }
							help={ __(
								"Any other guidelines or context that doesn't fit elsewhere."
							) }
							value={ guidelines?.notes || '' }
							onChange={ ( value ) =>
								handleTopLevelChange( 'notes', value )
							}
							rows={ 5 }
						/>
					</VStack>
				);

			default:
				return null;
		}
	};

	const handleClear = () => {
		clearSection( section.id );
	};

	return (
		<div className="library-panel__detail-container">
			<div className="library-panel__detail-header">
				<Navigator.BackButton
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
					onClick={ onBack }
					label={ __( 'Back' ) }
				/>
				<Heading
					level={ 2 }
					size={ 13 }
					className="library-panel__detail-title"
				>
					{ section.title }
				</Heading>
				<Button
					variant="tertiary"
					isDestructive
					size="small"
					onClick={ handleClear }
				>
					{ __( 'Clear' ) }
				</Button>
			</div>

			<Spacer margin={ 4 } />

			{ renderContent() }
		</div>
	);
}

/**
 * Check if a value has meaningful content.
 *
 * @param {*} value Value to check.
 * @return {boolean} Whether value has content.
 */
function hasContent( value ) {
	if ( value === null || value === undefined ) {
		return false;
	}
	if ( Array.isArray( value ) ) {
		return value.length > 0;
	}
	if ( typeof value === 'string' ) {
		return value.trim().length > 0;
	}
	if ( typeof value === 'number' ) {
		return true;
	}
	if ( typeof value === 'object' ) {
		// For nested objects, check if any property has content.
		return Object.values( value ).some( hasContent );
	}
	return Boolean( value );
}

/**
 * Get status text for a section.
 *
 * @param {string} sectionId  Section ID.
 * @param {Object} guidelines Guidelines data.
 * @return {string|null} Status text.
 */
function getSectionStatus( sectionId, guidelines ) {
	if ( ! guidelines ) {
		return null;
	}

	// Notes is a top-level string, not a nested object.
	if ( sectionId === 'notes' ) {
		return hasContent( guidelines.notes ) ? __( 'Configured' ) : null;
	}

	const sectionData = guidelines[ sectionId ];
	if ( ! sectionData || typeof sectionData !== 'object' ) {
		return null;
	}

	// Check if section has any meaningful data.
	const hasData = Object.values( sectionData ).some( hasContent );

	return hasData ? __( 'Configured' ) : null;
}

/**
 * Library panel with Navigator drill-down.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.initialSection  Initial section ID from URL.
 * @param {Function} props.onSectionChange Callback when section changes.
 * @return {JSX.Element} Library panel.
 */
export default function LibraryPanel( { initialSection, onSectionChange } ) {
	// Find the initial section object from the ID.
	const initialSectionObj = initialSection
		? SECTIONS.find( ( s ) => s.id === initialSection ) || null
		: null;

	const [ selectedSection, setSelectedSection ] =
		useState( initialSectionObj );

	const { guidelines } = useGuidelines();

	// Sync internal state with prop changes (e.g., when clicking "Library" in sidebar)
	useEffect( () => {
		if ( initialSection === null && selectedSection !== null ) {
			setSelectedSection( null );
		} else if (
			initialSection &&
			( ! selectedSection || selectedSection.id !== initialSection )
		) {
			const section = SECTIONS.find( ( s ) => s.id === initialSection );
			if ( section ) {
				setSelectedSection( section );
			}
		}
	}, [ initialSection, selectedSection ] );

	const handleSectionClick = ( section ) => {
		setSelectedSection( section );
		if ( onSectionChange ) {
			onSectionChange( section.id );
		}
	};

	const handleBack = () => {
		setSelectedSection( null );
		if ( onSectionChange ) {
			onSectionChange( null );
		}
		// Keep URL in sync so reload returns to the list view.
		if ( typeof window !== 'undefined' ) {
			const url = new URL( window.location.href );
			url.searchParams.delete( 'subsection' );
			url.searchParams.delete( 'block' );
			window.history.replaceState( {}, '', url );
		}
	};

	return (
		<div className="library-panel">
			<Navigator
				initialPath={
					selectedSection ? `/${ selectedSection.id }` : '/'
				}
			>
				<Navigator.Screen path="/">
					<VStack spacing={ 0 }>
						<ul className="library-panel__list">
							{ SECTIONS.map( ( section ) => (
								<li
									key={ section.id }
									className="library-panel__list-item"
								>
									<SectionCard
										section={ section }
										statusText={ getSectionStatus(
											section.id,
											guidelines
										) }
										onClick={ () =>
											handleSectionClick( section )
										}
									/>
								</li>
							) ) }
						</ul>
					</VStack>
				</Navigator.Screen>

				{ SECTIONS.map( ( section ) => (
					<Navigator.Screen
						key={ section.id }
						path={ `/${ section.id }` }
					>
						<SectionDetailScreen
							section={ section }
							onBack={ handleBack }
						/>
					</Navigator.Screen>
				) ) }
			</Navigator>
		</div>
	);
}
