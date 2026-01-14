/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import {
	Navigator,
	useNavigator,
	Button,
	Spinner,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalSpacer as Spacer,
	__experimentalText as Text,
	__experimentalNumberControl as NumberControl,
	Flex,
	FlexItem,
	TextareaControl,
	TextControl,
	SelectControl,
	FormTokenField,
} from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../../store';
import RepeaterControl from '../controls/repeater-control';
import TermNoteControl from '../controls/term-note-control';
import './style.scss';

/**
 * Section definitions.
 */
const SECTIONS = [
	{
		id: 'brand_context',
		title: __( 'Brand & site context', 'content-guidelines' ),
		description: __( 'Define what your site is about and who it serves.', 'content-guidelines' ),
	},
	{
		id: 'voice_tone',
		title: __( 'Voice & tone', 'content-guidelines' ),
		description: __( 'Set the personality and emotional feel of your content.', 'content-guidelines' ),
	},
	{
		id: 'copy_rules',
		title: __( 'Copy rules', 'content-guidelines' ),
		description: __( 'Specific dos and don\'ts for writing.', 'content-guidelines' ),
	},
	{
		id: 'vocabulary',
		title: __( 'Vocabulary', 'content-guidelines' ),
		description: __( 'Preferred terms and words to avoid.', 'content-guidelines' ),
	},
	{
		id: 'heuristics',
		title: __( 'Heuristics', 'content-guidelines' ),
		description: __( 'Target metrics for sentence length and structure.', 'content-guidelines' ),
	},
	{
		id: 'references',
		title: __( 'References', 'content-guidelines' ),
		description: __( 'Websites and content you want to emulate.', 'content-guidelines' ),
	},
	{
		id: 'images',
		title: __( 'Images', 'content-guidelines' ),
		description: __( 'Guidelines for image selection and alt text.', 'content-guidelines' ),
	},
	{
		id: 'notes',
		title: __( 'Additional notes', 'content-guidelines' ),
		description: __( 'Any other guidelines or context.', 'content-guidelines' ),
	},
];

/**
 * Goal options.
 */
const GOAL_OPTIONS = [
	{ value: '', label: __( 'Select a goal...', 'content-guidelines' ) },
	{ value: 'subscribe', label: __( 'Get email subscribers', 'content-guidelines' ) },
	{ value: 'sell', label: __( 'Sell products/services', 'content-guidelines' ) },
	{ value: 'inform', label: __( 'Inform and educate', 'content-guidelines' ) },
	{ value: 'community', label: __( 'Build community', 'content-guidelines' ) },
	{ value: 'other', label: __( 'Other', 'content-guidelines' ) },
];

/**
 * Section card component.
 *
 * @param {Object}   props             Component props.
 * @param {Object}   props.section     Section definition.
 * @param {string}   props.statusText  Status text.
 * @param {Function} props.onClick     Click handler.
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
		<Button
			__next40pxDefaultSize
			className="library-panel__section-card"
			onClick={ handleClick }
		>
			<Flex justify="space-between">
				<FlexItem>
					<VStack spacing={ 1 }>
						<Text className="library-panel__section-title">
							{ section.title }
						</Text>
						<Text className="library-panel__section-description" variant="muted">
							{ section.description }
						</Text>
					</VStack>
				</FlexItem>
				<Flex justify="flex-end" gap={ 2 }>
					{ statusText && (
						<FlexItem>
							<Text className="library-panel__section-status" variant="muted">
								{ statusText }
							</Text>
						</FlexItem>
					) }
					<FlexItem>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="24"
							height="24"
							aria-hidden="true"
							focusable="false"
						>
							<path d="M10.6 6L9.4 7l4.6 5-4.6 5 1.2 1 5.4-6z" />
						</svg>
					</FlexItem>
				</Flex>
			</Flex>
		</Button>
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
		avgWordsPerSentence: sentences.length > 0
			? Math.round( ( words.length / sentences.length ) * 10 ) / 10
			: 0,
		avgSentencesPerParagraph: paragraphs.length > 0
			? Math.round( ( sentences.length / paragraphs.length ) * 10 ) / 10
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
					.map( ( post ) => analyzeText( post.content?.rendered || '' ) )
					.filter( Boolean );

				if ( analyses.length > 0 ) {
					const avgWords = Math.round(
						analyses.reduce( ( sum, a ) => sum + a.avgWordsPerSentence, 0 ) / analyses.length
					);
					const avgSentences = Math.round(
						analyses.reduce( ( sum, a ) => sum + a.avgSentencesPerParagraph, 0 ) / analyses.length * 10
					) / 10;

					setAnalysisResult( { avgWords, avgSentences, postCount: analyses.length } );
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
				type="number"
				label={ __( 'Target words per sentence', 'content-guidelines' ) }
				value={ sectionData.words_per_sentence || '' }
				onChange={ ( value ) => onChange( 'words_per_sentence', value ? parseInt( value, 10 ) : '' ) }
				min={ 1 }
				max={ 50 }
			/>
			<TextControl
				__nextHasNoMarginBottom
				type="number"
				label={ __( 'Target sentences per paragraph', 'content-guidelines' ) }
				value={ sectionData.sentences_per_paragraph || '' }
				onChange={ ( value ) => onChange( 'sentences_per_paragraph', value ? parseFloat( value ) : '' ) }
				min={ 1 }
				max={ 20 }
				step={ 0.5 }
			/>
			<TextControl
				__nextHasNoMarginBottom
				type="number"
				label={ __( 'Target paragraphs per section', 'content-guidelines' ) }
				value={ sectionData.paragraphs_per_section || '' }
				onChange={ ( value ) => onChange( 'paragraphs_per_section', value ? parseInt( value, 10 ) : '' ) }
				min={ 1 }
				max={ 20 }
			/>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'Reading level', 'content-guidelines' ) }
				</span>
			</div>

			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Target reading level', 'content-guidelines' ) }
				value={ sectionData.reading_level || '' }
				options={ [
					{ value: '', label: __( 'Not specified', 'content-guidelines' ) },
					{ value: 'simple', label: __( 'Simple (grade 6-8)', 'content-guidelines' ) },
					{ value: 'standard', label: __( 'Standard (grade 9-12)', 'content-guidelines' ) },
					{ value: 'advanced', label: __( 'Advanced (college+)', 'content-guidelines' ) },
					{ value: 'custom', label: __( 'Custom', 'content-guidelines' ) },
				] }
				onChange={ ( value ) => onChange( 'reading_level', value ) }
			/>
			{ isCustomReadingLevel && (
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Custom reading level', 'content-guidelines' ) }
					value={ sectionData.reading_level_custom || '' }
					onChange={ ( value ) => onChange( 'reading_level_custom', value ) }
					placeholder={ __( 'e.g., Technical professionals, Medical audience', 'content-guidelines' ) }
				/>
			) }
			<TextControl
				__nextHasNoMarginBottom
				type="number"
				label={ __( 'Maximum word length (syllables)', 'content-guidelines' ) }
				help={ __( 'Prefer words with fewer syllables for simpler reading.', 'content-guidelines' ) }
				value={ sectionData.max_syllables || '' }
				onChange={ ( value ) => onChange( 'max_syllables', value ? parseInt( value, 10 ) : '' ) }
				min={ 1 }
				max={ 10 }
			/>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'Analyze existing content', 'content-guidelines' ) }
				</span>
			</div>

			<HStack spacing={ 3 }>
				<Button
					variant="secondary"
					onClick={ runAnalysis }
					disabled={ isAnalyzing }
					isBusy={ isAnalyzing }
				>
					{ isAnalyzing ? __( 'Analyzing…', 'content-guidelines' ) : __( 'Analyze posts', 'content-guidelines' ) }
				</Button>
				{ analysisResult && (
					<Button variant="primary" onClick={ applyAnalysis }>
						{ __( 'Apply', 'content-guidelines' ) }
					</Button>
				) }
			</HStack>

			{ analysisResult && (
				<Text variant="muted">
					{ __( 'Based on', 'content-guidelines' ) } { analysisResult.postCount } { __( 'posts:', 'content-guidelines' ) }{ ' ' }
					{ analysisResult.avgWords } { __( 'words/sentence,', 'content-guidelines' ) }{ ' ' }
					{ analysisResult.avgSentences } { __( 'sentences/paragraph', 'content-guidelines' ) }
				</Text>
			) }
		</VStack>
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

	// Debug: Log what we're receiving to help diagnose data issues
	// eslint-disable-next-line no-console
	console.log( '[ReferencesContent] sectionData:', sectionData, 'references:', references );

	const addReference = () => {
		onChange( 'references', [ ...references, { type: 'website', title: '', url: '', notes: '' } ] );
	};

	const updateReference = ( index, field, value ) => {
		const updated = [ ...references ];
		updated[ index ] = { ...updated[ index ], [ field ]: value };
		onChange( 'references', updated );
	};

	const removeReference = ( index ) => {
		onChange( 'references', references.filter( ( _, i ) => i !== index ) );
	};

	return (
		<VStack spacing={ 4 }>
			{ references.map( ( ref, index ) => (
				<div key={ index } className="library-panel__reference-item">
					<VStack spacing={ 2 }>
						<HStack spacing={ 2 }>
							<SelectControl
								__nextHasNoMarginBottom
								label={ __( 'Type', 'content-guidelines' ) }
								value={ ref.type || 'website' }
								options={ [
									{ value: 'website', label: __( 'Website', 'content-guidelines' ) },
									{ value: 'article', label: __( 'Article', 'content-guidelines' ) },
									{ value: 'book', label: __( 'Book', 'content-guidelines' ) },
									{ value: 'document', label: __( 'Document', 'content-guidelines' ) },
									{ value: 'competitor', label: __( 'Competitor', 'content-guidelines' ) },
									{ value: 'other', label: __( 'Other', 'content-guidelines' ) },
								] }
								onChange={ ( value ) => updateReference( index, 'type', value ) }
							/>
							<div style={ { flex: 1 } }>
								<TextControl
									__nextHasNoMarginBottom
									label={ __( 'Title', 'content-guidelines' ) }
									value={ ref.title || '' }
									onChange={ ( value ) => updateReference( index, 'title', value ) }
									placeholder={ __( 'Reference name', 'content-guidelines' ) }
								/>
							</div>
						</HStack>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'URL / Location', 'content-guidelines' ) }
							value={ ref.url || '' }
							onChange={ ( value ) => updateReference( index, 'url', value ) }
							placeholder={ ref.type === 'book' ? __( 'ISBN or link', 'content-guidelines' ) : 'https://' }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Why you like it', 'content-guidelines' ) }
							value={ ref.notes || '' }
							onChange={ ( value ) => updateReference( index, 'notes', value ) }
							rows={ 2 }
							placeholder={ __( 'What aspects do you want to emulate?', 'content-guidelines' ) }
						/>
						<Button
							variant="tertiary"
							isDestructive
							size="small"
							onClick={ () => removeReference( index ) }
						>
							{ __( 'Remove', 'content-guidelines' ) }
						</Button>
					</VStack>
				</div>
			) ) }

			<Button variant="secondary" onClick={ addReference }>
				{ __( 'Add reference', 'content-guidelines' ) }
			</Button>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'General notes', 'content-guidelines' ) }
				</span>
			</div>

			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Reference notes', 'content-guidelines' ) }
				value={ sectionData.notes || '' }
				onChange={ ( value ) => onChange( 'notes', value ) }
				rows={ 3 }
				placeholder={ __( 'Any other notes about your content inspirations...', 'content-guidelines' ) }
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
			title: __( 'Select Reference Images', 'content-guidelines' ),
			multiple: true,
			library: { type: 'image' },
			button: { text: __( 'Add Images', 'content-guidelines' ) },
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
			onChange( 'reference_images', [ ...referenceImages, ...newImages ] );
		} );

		frame.open();
	};

	const updateImageNotes = ( index, notes ) => {
		const updated = [ ...referenceImages ];
		updated[ index ] = { ...updated[ index ], notes };
		onChange( 'reference_images', updated );
	};

	const removeImage = ( index ) => {
		onChange( 'reference_images', referenceImages.filter( ( _, i ) => i !== index ) );
	};

	return (
		<VStack spacing={ 4 }>
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Image style', 'content-guidelines' ) }
				help={ __( 'Describe the visual style for images.', 'content-guidelines' ) }
				value={ sectionData.style || '' }
				onChange={ ( value ) => onChange( 'style', value ) }
				rows={ 2 }
			/>
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Alt text guidelines', 'content-guidelines' ) }
				help={ __( 'How should alt text be written?', 'content-guidelines' ) }
				value={ sectionData.alt_text_guidelines || '' }
				onChange={ ( value ) => onChange( 'alt_text_guidelines', value ) }
				rows={ 2 }
			/>

			<div className="library-panel__divider">
				<span className="library-panel__divider-text">
					{ __( 'Reference images', 'content-guidelines' ) }
				</span>
			</div>

			{ referenceImages.length > 0 && (
				<div className="library-panel__image-grid">
					{ referenceImages.map( ( img, index ) => (
						<div key={ img.id || index } className="library-panel__image-item">
							<img src={ img.url } alt={ img.alt || '' } />
							<TextControl
								__nextHasNoMarginBottom
								placeholder={ __( 'Why this image?', 'content-guidelines' ) }
								value={ img.notes || '' }
								onChange={ ( value ) => updateImageNotes( index, value ) }
							/>
							<Button
								variant="tertiary"
								isDestructive
								size="small"
								onClick={ () => removeImage( index ) }
							>
								{ __( 'Remove', 'content-guidelines' ) }
							</Button>
						</div>
					) ) }
				</div>
			) }

			<Button variant="secondary" onClick={ openMediaLibrary }>
				{ __( 'Add reference images', 'content-guidelines' ) }
			</Button>
		</VStack>
	);
}

/**
 * Get empty section data structure.
 *
 * @param {string} sectionId Section ID.
 * @return {Object} Empty section data.
 */
function getEmptySection( sectionId ) {
	switch ( sectionId ) {
		case 'brand_context':
			return {
				site_description: '',
				audience: '',
				primary_goal: '',
				topics: [],
			};
		case 'voice_tone':
			return {
				description: '',
				tone_traits: [],
				tone_notes: '',
				pov: '',
				readability: '',
			};
		case 'copy_rules':
			return {
				dos: [],
				donts: [],
			};
		case 'vocabulary':
			return {
				prefer: [],
				avoid: [],
				acronyms: [],
				acronym_usage: 'expand_first',
				custom_dictionary: [],
				voice_corrections: [],
			};
		case 'heuristics':
			return {
				words_per_sentence: '',
				sentences_per_paragraph: '',
				paragraphs_per_section: '',
				reading_level: '',
				reading_level_custom: '',
				max_syllables: '',
			};
		case 'references':
			return {
				references: [],
				notes: '',
			};
		case 'images':
			return {
				style: '',
				alt_text_guidelines: '',
				reference_images: [],
				dos: [],
				donts: [],
				text_policy: '',
			};
		default:
			return {};
	}
}

/**
 * Section detail screen component.
 *
 * @param {Object}   props           Component props.
 * @param {Object}   props.section   Section definition.
 * @param {Function} props.onBack    Back handler.
 * @return {JSX.Element} Section detail screen.
 */
function SectionDetailScreen( { section, onBack } ) {
	const draft = useSelect( ( select ) => select( STORE_NAME ).getDraft() || {}, [] );
	const { updateDraftSection, updateDraft } = useDispatch( STORE_NAME );

	const sectionData = draft[ section.id ] || {};

	// Debug: Log draft structure for troubleshooting
	// eslint-disable-next-line no-console
	console.log( '[SectionDetailScreen]', section.id, '- draft:', draft, 'sectionData:', sectionData );

	const handleChange = ( field, value ) => {
		updateDraftSection( section.id, { [ field ]: value } );
	};

	const handleTopLevelChange = ( field, value ) => {
		updateDraft( { [ field ]: value } );
	};

	const renderContent = () => {
		switch ( section.id ) {
			case 'brand_context':
				return (
					<VStack spacing={ 4 }>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'What is this site about?', 'content-guidelines' ) }
							help={ __( 'A brief description of your site, business, or publication.', 'content-guidelines' ) }
							value={ sectionData.site_description || '' }
							onChange={ ( value ) => handleChange( 'site_description', value ) }
							rows={ 3 }
						/>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Target audience', 'content-guidelines' ) }
							help={ __( 'Who are you writing for?', 'content-guidelines' ) }
							value={ sectionData.audience || '' }
							onChange={ ( value ) => handleChange( 'audience', value ) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Primary goal', 'content-guidelines' ) }
							help={ __( 'What do you want visitors to do?', 'content-guidelines' ) }
							value={ sectionData.primary_goal || '' }
							options={ GOAL_OPTIONS }
							onChange={ ( value ) => handleChange( 'primary_goal', value ) }
						/>
						<FormTokenField
							label={ __( 'Topics / coverage areas', 'content-guidelines' ) }
							value={ sectionData.topics || [] }
							onChange={ ( value ) => handleChange( 'topics', value ) }
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
							label={ __( 'Voice description', 'content-guidelines' ) }
							help={ __( 'How should your brand\'s personality come across?', 'content-guidelines' ) }
							value={ sectionData.description || '' }
							onChange={ ( value ) => handleChange( 'description', value ) }
							rows={ 3 }
						/>
						<FormTokenField
							label={ __( 'Voice attributes', 'content-guidelines' ) }
							value={ sectionData.tone_traits || [] }
							onChange={ ( value ) => handleChange( 'tone_traits', value ) }
							__experimentalExpandOnFocus
							__experimentalShowHowTo={ false }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Point of view', 'content-guidelines' ) }
							value={ sectionData.pov || '' }
							options={ [
								{ value: '', label: __( 'Not specified', 'content-guidelines' ) },
								{ value: 'we_you', label: __( 'We/You (conversational)', 'content-guidelines' ) },
								{ value: 'i_you', label: __( 'I/You (personal)', 'content-guidelines' ) },
								{ value: 'third_person', label: __( 'Third person (formal)', 'content-guidelines' ) },
							] }
							onChange={ ( value ) => handleChange( 'pov', value ) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Readability level', 'content-guidelines' ) }
							value={ sectionData.readability || '' }
							options={ [
								{ value: '', label: __( 'Not specified', 'content-guidelines' ) },
								{ value: 'simple', label: __( 'Simple (grade 6-8)', 'content-guidelines' ) },
								{ value: 'general', label: __( 'General (grade 9-12)', 'content-guidelines' ) },
								{ value: 'expert', label: __( 'Expert (college+)', 'content-guidelines' ) },
							] }
							onChange={ ( value ) => handleChange( 'readability', value ) }
						/>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Tone notes', 'content-guidelines' ) }
							help={ __( 'Any additional guidance on tone adjustments.', 'content-guidelines' ) }
							value={ sectionData.tone_notes || '' }
							onChange={ ( value ) => handleChange( 'tone_notes', value ) }
							rows={ 2 }
						/>
					</VStack>
				);

			case 'copy_rules':
				return (
					<VStack spacing={ 4 }>
						<RepeaterControl
							label={ __( 'Do', 'content-guidelines' ) }
							items={ sectionData.dos || [] }
							onChange={ ( value ) => handleChange( 'dos', value ) }
							placeholder={ __( 'Add a rule...', 'content-guidelines' ) }
						/>
						<RepeaterControl
							label={ __( "Don't", 'content-guidelines' ) }
							items={ sectionData.donts || [] }
							onChange={ ( value ) => handleChange( 'donts', value ) }
							placeholder={ __( 'Add a rule...', 'content-guidelines' ) }
						/>
					</VStack>
				);

			case 'vocabulary':
				return (
					<VStack spacing={ 4 }>
						<TermNoteControl
							label={ __( 'Preferred terms', 'content-guidelines' ) }
							items={ sectionData.prefer || [] }
							onChange={ ( value ) => handleChange( 'prefer', value ) }
							termPlaceholder={ __( 'Term to use', 'content-guidelines' ) }
							notePlaceholder={ __( 'Usage note (optional)', 'content-guidelines' ) }
						/>
						<TermNoteControl
							label={ __( 'Terms to avoid', 'content-guidelines' ) }
							items={ sectionData.avoid || [] }
							onChange={ ( value ) => handleChange( 'avoid', value ) }
							termPlaceholder={ __( 'Term to avoid', 'content-guidelines' ) }
							notePlaceholder={ __( 'Why? / Use instead (optional)', 'content-guidelines' ) }
						/>

						<div className="library-panel__divider">
							<span className="library-panel__divider-text">
								{ __( 'Acronyms', 'content-guidelines' ) }
							</span>
						</div>

						<RepeaterControl
							label={ __( 'Definitions', 'content-guidelines' ) }
							items={ sectionData.acronyms || [] }
							onChange={ ( value ) => handleChange( 'acronyms', value ) }
							placeholder={ __( 'API - Application Programming Interface', 'content-guidelines' ) }
						/>
						<SelectControl
							__nextHasNoMarginBottom
							label={ __( 'Usage style', 'content-guidelines' ) }
							value={ sectionData.acronym_usage || 'expand_first' }
							options={ [
								{ value: 'expand_first', label: __( 'Expand on first use', 'content-guidelines' ) },
								{ value: 'always_expand', label: __( 'Always include expansion', 'content-guidelines' ) },
								{ value: 'acronym_only', label: __( 'Acronym only', 'content-guidelines' ) },
							] }
							onChange={ ( value ) => handleChange( 'acronym_usage', value ) }
						/>

						<div className="library-panel__divider">
							<span className="library-panel__divider-text">
								{ __( 'Custom dictionary', 'content-guidelines' ) }
							</span>
						</div>

						<FormTokenField
							label={ __( 'Industry terms & brand names', 'content-guidelines' ) }
							value={ sectionData.custom_dictionary || [] }
							onChange={ ( value ) => handleChange( 'custom_dictionary', value ) }
							__experimentalExpandOnFocus
							__experimentalShowHowTo={ false }
						/>
						<RepeaterControl
							label={ __( 'Corrections', 'content-guidelines' ) }
							items={ sectionData.voice_corrections || [] }
							onChange={ ( value ) => handleChange( 'voice_corrections', value ) }
							placeholder={ __( '"word press" → WordPress', 'content-guidelines' ) }
						/>
					</VStack>
				);

			case 'heuristics':
				return <HeuristicsContent sectionData={ sectionData } onChange={ handleChange } />;

			case 'references':
				return <ReferencesContent sectionData={ sectionData } onChange={ handleChange } />;

			case 'images':
				return <ImagesContent sectionData={ sectionData } onChange={ handleChange } />;

			case 'notes':
				return (
					<VStack spacing={ 4 }>
						<TextareaControl
							__nextHasNoMarginBottom
							label={ __( 'Additional notes', 'content-guidelines' ) }
							help={ __( 'Any other guidelines or context that doesn\'t fit elsewhere.', 'content-guidelines' ) }
							value={ draft.notes || '' }
							onChange={ ( value ) => handleTopLevelChange( 'notes', value ) }
							rows={ 5 }
						/>
					</VStack>
				);

			default:
				return null;
		}
	};

	const handleClear = () => {
		if ( section.id === 'notes' ) {
			handleTopLevelChange( 'notes', '' );
		} else {
			updateDraftSection( section.id, getEmptySection( section.id ) );
		}
	};

	return (
		<div className="library-panel__detail-container">
			<div className="library-panel__detail-header">
				<Navigator.BackButton
					icon={ isRTL() ? chevronRight : chevronLeft }
					size="small"
					onClick={ onBack }
					label={ __( 'Back', 'content-guidelines' ) }
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
					{ __( 'Clear', 'content-guidelines' ) }
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
 * @param {string} sectionId Section ID.
 * @param {Object} draft     Draft data.
 * @return {string|null} Status text.
 */
function getSectionStatus( sectionId, draft ) {
	// Notes is a top-level string, not a nested object.
	if ( sectionId === 'notes' ) {
		return hasContent( draft.notes ) ? __( 'Configured', 'content-guidelines' ) : null;
	}

	const sectionData = draft[ sectionId ];
	if ( ! sectionData || typeof sectionData !== 'object' ) {
		return null;
	}

	// Check if section has any meaningful data.
	const hasData = Object.values( sectionData ).some( hasContent );

	return hasData ? __( 'Configured', 'content-guidelines' ) : null;
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

	const [ selectedSection, setSelectedSection ] = useState( initialSectionObj );

	const { draft } = useSelect( ( select ) => {
		return {
			draft: select( STORE_NAME ).getDraft() || {},
		};
	}, [] );

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
	};

	return (
		<div className="library-panel">
			<Navigator initialPath={ selectedSection ? `/${ selectedSection.id }` : '/' }>
				<Navigator.Screen path="/">
					<VStack spacing={ 0 }>
						<ul role="list" className="library-panel__list">
							{ SECTIONS.map( ( section ) => (
								<li key={ section.id } className="library-panel__list-item">
									<SectionCard
										section={ section }
										statusText={ getSectionStatus( section.id, draft ) }
										onClick={ () => handleSectionClick( section ) }
									/>
								</li>
							) ) }
						</ul>
					</VStack>
				</Navigator.Screen>

				{ SECTIONS.map( ( section ) => (
					<Navigator.Screen key={ section.id } path={ `/${ section.id }` }>
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
