/**
 * Mock AI hook for Content Guidelines.
 *
 * Provides mock AI generation for generating/improving guidelines.
 * Will be replaced with real Jetpack AI integration later.
 */

/**
 * WordPress dependencies
 */
import { useState, useCallback, useRef } from '@wordpress/element';
import { dispatch, select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store';

export type SectionState = 'idle' | 'requesting' | 'streaming' | 'done';
export type BlockGeneratingState = 'idle' | 'requesting' | 'streaming' | 'done';

export interface AiGuidelinesState {
	state: 'idle' | 'generating' | 'done';
	suggestions: Record< string, string >;
	sectionStates: Record< string, SectionState >;
	blockSuggestions: Record< string, string >;
	blockGeneratingState: Record< string, BlockGeneratingState >;
	textStreamingKeys: Record< string, boolean >;
	generate: () => void;
	generateSection: ( slug: string ) => void;
	generateBlock: ( blockName: string ) => void;
	generateAllBlocks: ( blockNames: string[] ) => void;
	acceptSuggestion: ( slug: string ) => void;
	dismissSuggestion: ( slug: string ) => void;
	acceptBlockSuggestion: ( blockName: string ) => void;
	dismissBlockSuggestion: ( blockName: string ) => void;
	cancelAll: () => void;
	isGenerating: boolean;
}

const MOCK_SUGGESTIONS: Record< string, string > = {
	site: 'This is a modern WordPress site focused on sharing tutorials, guides, and best practices for web development. The primary audience includes developers, designers, and content creators who want to build beautiful, performant websites. Our goal is to provide practical, actionable content that helps our readers succeed.',
	copy: 'Write in a conversational, approachable tone that makes technical concepts accessible. Use active voice and second person ("you") to speak directly to the reader. Keep paragraphs short (2-3 sentences) and use headings, bullet points, and code examples to break up content. Avoid jargon unless necessary, and always explain technical terms on first use.',
	images: 'Use high-quality images with a minimum resolution of 1200x800 pixels. Prefer clean, modern photography with good lighting and minimal clutter. Screenshots should be cropped to show only the relevant UI elements. Use PNG for screenshots and WebP for photos. Always include descriptive alt text for accessibility.',
	additional: 'All content should be reviewed before publishing. Include a table of contents for posts longer than 1500 words. Use code syntax highlighting for all code examples. Link to official documentation when referencing external tools or libraries.',
};

// Improved versions of the mock suggestions — used when a section already has content.
// These are intentionally similar to MOCK_SUGGESTIONS with targeted additions and edits
// so that diffWords produces meaningful, realistic word-level diffs.
const MOCK_IMPROVED_SUGGESTIONS: Record< string, string > = {
	site: 'This is a modern WordPress site focused on sharing in-depth tutorials, step-by-step guides, and best practices for web development and design. The primary audience includes developers, designers, and content creators who want to build beautiful, performant, and accessible websites. Our goal is to provide practical, actionable content that helps our readers succeed and grow their skills.',
	copy: 'Write in a conversational, approachable tone that makes technical concepts accessible to all skill levels. Use active voice and second person ("you") to speak directly to the reader. Keep paragraphs short (2-3 sentences) and use headings, bullet points, numbered lists, and code examples to break up content. Avoid jargon unless necessary, and always explain technical terms on first use. Include a brief summary or key takeaway at the end of each section.',
	images: 'Use high-quality images with a minimum resolution of 1200x800 pixels. Prefer clean, modern photography with good lighting and minimal clutter. Screenshots should be cropped to show only the relevant UI elements and include browser chrome for context. Use PNG for screenshots, WebP for photos, and SVG for icons and diagrams. Always include descriptive alt text for accessibility and add captions where helpful.',
	additional: 'All content should be reviewed by at least one team member before publishing. Include a table of contents for posts longer than 1500 words. Use code syntax highlighting for all code examples and specify the language. Link to official documentation when referencing external tools or libraries. Update existing content quarterly to ensure accuracy.',
};

const MOCK_IMPROVED_BLOCK_SUGGESTIONS: Record< string, string > = {
	'core/paragraph': 'Keep paragraphs concise at 2–3 sentences maximum. Use a conversational yet professional tone consistent with the site\'s voice and brand guidelines. Avoid walls of text — break long content into multiple paragraph blocks with clear transitions and use pull quotes to highlight key points.',
	'core/heading': 'Use headings to create a clear and scannable content hierarchy. H2 for main sections, H3 for subsections, H4 for detailed points. Keep headings under 8 words when possible and make them descriptive. Use sentence case, not title case. Never skip heading levels (e.g., don\'t jump from H2 to H4).',
	'core/image': 'All images must include descriptive alt text for accessibility that conveys the image\'s meaning and purpose. Use WebP format where possible for optimal performance. Maintain a 16:9 or 4:3 aspect ratio for consistency across the site. Compress images to under 200KB. Avoid text-heavy images that can\'t be read by screen readers and provide text alternatives nearby.',
};

const MOCK_BLOCK_SUGGESTIONS: Record< string, string > = {
	'core/paragraph': 'Keep paragraphs concise at 2–3 sentences. Use a conversational yet professional tone consistent with the site\'s voice. Avoid walls of text — break long content into multiple paragraph blocks with clear transitions.',
	'core/heading': 'Use headings to create a clear content hierarchy. H2 for main sections, H3 for subsections. Keep headings under 8 words when possible. Use sentence case, not title case. Never skip heading levels (e.g., don\'t jump from H2 to H4).',
	'core/image': 'All images must include descriptive alt text for accessibility. Use WebP format where possible. Maintain a 16:9 or 4:3 aspect ratio for consistency. Compress images to under 200KB. Avoid text-heavy images that can\'t be read by screen readers.',
};

const SECTION_ORDER = [ 'site', 'copy', 'images', 'additional' ];

function simulateStreaming(
	text: string,
	onChunk: ( partial: string ) => void,
	onDone: () => void
) {
	const words = text.split( ' ' );
	let current = '';
	let i = 0;

	const interval = setInterval( () => {
		if ( i >= words.length ) {
			clearInterval( interval );
			onDone();
			return;
		}

		const chunkSize = Math.min( 2 + Math.floor( Math.random() * 3 ), words.length - i );
		for ( let j = 0; j < chunkSize; j++ ) {
			current += ( current ? ' ' : '' ) + words[ i ];
			i++;
		}

		onChunk( current );
	}, 50 );

	return () => clearInterval( interval );
}

export function useAiGuidelines(): AiGuidelinesState {
	const [ state, setState ] = useState< 'idle' | 'generating' | 'done' >( 'idle' );
	const [ suggestions, setSuggestions ] = useState< Record< string, string > >( {} );
	const [ sectionStates, setSectionStates ] = useState< Record< string, SectionState > >( {} );
	const [ blockSuggestions, setBlockSuggestions ] = useState< Record< string, string > >( {} );
	const [ blockGeneratingState, setBlockGeneratingState ] = useState< Record< string, BlockGeneratingState > >( {} );
	const [ textStreamingKeys, setTextStreamingKeys ] = useState< Record< string, boolean > >( {} );
	const cleanupRef = useRef< ( () => void ) | null >( null );
	// Incremented on cancel — generation callbacks check this to bail out.
	const generationEpochRef = useRef( 0 );

	/**
	 * Finish a section: set suggestion and mark done.
	 * Does NOT write to the store — the store is only updated on accept
	 * (or during streaming into an empty field via streamIntoSection).
	 */
	const finishSection = ( slug: string, mockText: string ) => {
		setSuggestions( ( prev ) => ( {
			...prev,
			[ slug ]: mockText,
		} ) );
		setSectionStates( ( prev ) => ( {
			...prev,
			[ slug ]: 'done',
		} ) );
		setTextStreamingKeys( ( prev ) => {
			const next = { ...prev };
			delete next[ slug ];
			return next;
		} );
	};

	/**
	 * Stream text into an empty section, then finish.
	 */
	const streamIntoSection = ( slug: string, mockText: string, onComplete?: () => void ) => {
		setTextStreamingKeys( ( prev ) => ( { ...prev, [ slug ]: true } ) );

		cleanupRef.current = simulateStreaming(
			mockText,
			( partial ) => {
				const { setGuideline } = dispatch( STORE_NAME ) as {
					setGuideline: ( category: string, value: string ) => void;
				};
				setGuideline( slug, partial );
			},
			() => {
				finishSection( slug, mockText );
				onComplete?.();
			}
		);
	};

	const generate = useCallback( () => {
		setState( 'generating' );
		const epoch = generationEpochRef.current;

		const initialStates: Record< string, SectionState > = {};
		SECTION_ORDER.forEach( ( slug ) => {
			initialStates[ slug ] = 'requesting';
		} );
		setSectionStates( initialStates );
		setSuggestions( {} );

		let sectionIndex = 0;

		const generateNextSection = () => {
			if ( generationEpochRef.current !== epoch ) {
				return; // Cancelled.
			}
			if ( sectionIndex >= SECTION_ORDER.length ) {
				setState( 'done' );
				return;
			}

			const slug = SECTION_ORDER[ sectionIndex ];

			setSectionStates( ( prev ) => ( {
				...prev,
				[ slug ]: 'streaming',
			} ) );

			// Check if the field is empty
			const currentValue = ( select( STORE_NAME ) as {
				getGuideline: ( s: string ) => string;
			} ).getGuideline( slug );
			const isEmpty = ! currentValue || currentValue.trim().length === 0;

			// Use improved suggestions when content exists to produce meaningful diffs.
			const mockText = isEmpty
				? ( MOCK_SUGGESTIONS[ slug ] || '' )
				: ( MOCK_IMPROVED_SUGGESTIONS[ slug ] || MOCK_SUGGESTIONS[ slug ] || '' );

			// Shimmer phase, then either stream text (empty) or jump to diff (has content).
			setTimeout( () => {
				if ( generationEpochRef.current !== epoch ) {
					return;
				}
				if ( isEmpty ) {
					streamIntoSection( slug, mockText, () => {
						sectionIndex++;
						setTimeout( generateNextSection, 200 );
					} );
				} else {
					finishSection( slug, mockText );
					sectionIndex++;
					setTimeout( generateNextSection, 200 );
				}
			}, 1500 );
		};

		setTimeout( generateNextSection, 300 );
	}, [] );

	const generateSection = useCallback( ( slug: string ) => {
		setSectionStates( ( prev ) => ( {
			...prev,
			[ slug ]: 'requesting',
		} ) );

		const currentValue = ( select( STORE_NAME ) as {
			getGuideline: ( s: string ) => string;
		} ).getGuideline( slug );
		const isEmpty = ! currentValue || currentValue.trim().length === 0;

		const mockText = isEmpty
			? ( MOCK_SUGGESTIONS[ slug ] || 'Generated guidelines for this section.' )
			: ( MOCK_IMPROVED_SUGGESTIONS[ slug ] || MOCK_SUGGESTIONS[ slug ] || 'Generated guidelines for this section.' );

		setTimeout( () => {
			setSectionStates( ( prev ) => ( {
				...prev,
				[ slug ]: 'streaming',
			} ) );

			setTimeout( () => {
				if ( isEmpty ) {
					streamIntoSection( slug, mockText );
				} else {
					finishSection( slug, mockText );
				}
			}, 1500 );
		}, 300 );
	}, [] );

	const generateBlock = useCallback( ( blockName: string ) => {
		const epoch = generationEpochRef.current;
		const { setBlockGuideline } = dispatch( STORE_NAME ) as {
			setBlockGuideline: ( name: string, value: string ) => void;
		};
		const currentValue = ( select( STORE_NAME ) as { getBlockGuidelines: () => Record< string, string > } ).getBlockGuidelines()[ blockName ];
		const isEmpty = ! currentValue || currentValue.trim().length === 0;

		const fallback = `Use the ${ blockName.replace( 'core/', '' ) } block to present content in a clear, structured way. Keep content concise and focused on a single topic. Use appropriate formatting and ensure accessibility standards are met.`;
		const mockText = isEmpty
			? ( MOCK_BLOCK_SUGGESTIONS[ blockName ] || fallback )
			: ( MOCK_IMPROVED_BLOCK_SUGGESTIONS[ blockName ] || MOCK_BLOCK_SUGGESTIONS[ blockName ] || fallback );

		setBlockGeneratingState( ( prev ) => ( {
			...prev,
			[ blockName ]: 'requesting',
		} ) );

		setTimeout( () => {
			if ( generationEpochRef.current !== epoch ) {
				return;
			}
			setBlockGeneratingState( ( prev ) => ( {
				...prev,
				[ blockName ]: 'streaming',
			} ) );

			setTimeout( () => {
				if ( generationEpochRef.current !== epoch ) {
					return;
				}
				if ( isEmpty ) {
					// Stream text into the block guideline
					setTextStreamingKeys( ( prev ) => ( { ...prev, [ blockName ]: true } ) );

					cleanupRef.current = simulateStreaming(
						mockText,
						( partial ) => {
							setBlockSuggestions( ( prev ) => ( {
								...prev,
								[ blockName ]: partial,
							} ) );
						},
						() => {
							setBlockSuggestions( ( prev ) => ( {
								...prev,
								[ blockName ]: mockText,
							} ) );
							setBlockGeneratingState( ( prev ) => ( {
								...prev,
								[ blockName ]: 'done',
							} ) );
							setTextStreamingKeys( ( prev ) => {
								const next = { ...prev };
								delete next[ blockName ];
								return next;
							} );
						}
					);
				} else {
					setBlockSuggestions( ( prev ) => ( {
						...prev,
						[ blockName ]: mockText,
					} ) );
					setBlockGeneratingState( ( prev ) => ( {
						...prev,
						[ blockName ]: 'done',
					} ) );
				}
			}, 1500 );
		}, 300 );
	}, [] );

	const acceptSuggestion = useCallback( ( slug: string ) => {
		setSuggestions( ( prev ) => {
			const next = { ...prev };
			delete next[ slug ];
			return next;
		} );
		setSectionStates( ( prev ) => ( {
			...prev,
			[ slug ]: 'idle',
		} ) );
	}, [] );

	const dismissSuggestion = useCallback( ( slug: string ) => {
		setSuggestions( ( prev ) => {
			const next = { ...prev };
			delete next[ slug ];
			return next;
		} );
		setSectionStates( ( prev ) => ( {
			...prev,
			[ slug ]: 'idle',
		} ) );
	}, [] );

	const acceptBlockSuggestion = useCallback( ( blockName: string ) => {
		setBlockSuggestions( ( prev ) => {
			const next = { ...prev };
			delete next[ blockName ];
			return next;
		} );
		setBlockGeneratingState( ( prev ) => ( {
			...prev,
			[ blockName ]: 'idle',
		} ) );
	}, [] );

	const dismissBlockSuggestion = useCallback( ( blockName: string ) => {
		setBlockSuggestions( ( prev ) => {
			const next = { ...prev };
			delete next[ blockName ];
			return next;
		} );
		setBlockGeneratingState( ( prev ) => ( {
			...prev,
			[ blockName ]: 'idle',
		} ) );
	}, [] );

	const generateAllBlocks = useCallback( ( blockNames: string[] ) => {
		blockNames.forEach( ( blockName, index ) => {
			setTimeout( () => generateBlock( blockName ), index * 800 );
		} );
	}, [ generateBlock ] );

	const cancelAll = useCallback( () => {
		// Bump epoch so in-flight timeouts bail out.
		generationEpochRef.current++;
		// Stop any active streaming interval.
		cleanupRef.current?.();
		cleanupRef.current = null;
		// Reset all state.
		setState( 'idle' );
		setSuggestions( {} );
		setSectionStates( {} );
		setBlockSuggestions( {} );
		setBlockGeneratingState( {} );
		setTextStreamingKeys( {} );
	}, [] );

	const isGenerating = state === 'generating' ||
		Object.values( sectionStates ).some(
			( s ) => s === 'requesting' || s === 'streaming'
		);

	return {
		state,
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
	};
}
