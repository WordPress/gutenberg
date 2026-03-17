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
	isGenerating: boolean;
}

const MOCK_SUGGESTIONS: Record< string, string > = {
	site: 'This is a modern WordPress site focused on sharing tutorials, guides, and best practices for web development. The primary audience includes developers, designers, and content creators who want to build beautiful, performant websites. Our goal is to provide practical, actionable content that helps our readers succeed.',
	copy: 'Write in a conversational, approachable tone that makes technical concepts accessible. Use active voice and second person ("you") to speak directly to the reader. Keep paragraphs short (2-3 sentences) and use headings, bullet points, and code examples to break up content. Avoid jargon unless necessary, and always explain technical terms on first use.',
	images: 'Use high-quality images with a minimum resolution of 1200x800 pixels. Prefer clean, modern photography with good lighting and minimal clutter. Screenshots should be cropped to show only the relevant UI elements. Use PNG for screenshots and WebP for photos. Always include descriptive alt text for accessibility.',
	additional: 'All content should be reviewed before publishing. Include a table of contents for posts longer than 1500 words. Use code syntax highlighting for all code examples. Link to official documentation when referencing external tools or libraries.',
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

	/**
	 * Finish a section: set suggestion, write to store, mark done.
	 */
	const finishSection = ( slug: string, mockText: string ) => {
		setSuggestions( ( prev ) => ( {
			...prev,
			[ slug ]: mockText,
		} ) );
		const { setGuideline } = dispatch( STORE_NAME ) as {
			setGuideline: ( category: string, value: string ) => void;
		};
		setGuideline( slug, mockText );
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

		const initialStates: Record< string, SectionState > = {};
		SECTION_ORDER.forEach( ( slug ) => {
			initialStates[ slug ] = 'requesting';
		} );
		setSectionStates( initialStates );
		setSuggestions( {} );

		let sectionIndex = 0;

		const generateNextSection = () => {
			if ( sectionIndex >= SECTION_ORDER.length ) {
				setState( 'done' );
				return;
			}

			const slug = SECTION_ORDER[ sectionIndex ];
			const mockText = MOCK_SUGGESTIONS[ slug ] || '';

			setSectionStates( ( prev ) => ( {
				...prev,
				[ slug ]: 'streaming',
			} ) );

			// Check if the field is empty
			const currentValue = ( select( STORE_NAME ) as {
				getGuideline: ( s: string ) => string;
			} ).getGuideline( slug );
			const isEmpty = ! currentValue || currentValue.trim().length === 0;

			// Shimmer phase, then either stream text (empty) or jump to diff (has content).
			setTimeout( () => {
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
		const mockText = MOCK_SUGGESTIONS[ slug ] || 'Generated guidelines for this section.';

		setSectionStates( ( prev ) => ( {
			...prev,
			[ slug ]: 'requesting',
		} ) );

		const currentValue = ( select( STORE_NAME ) as {
			getGuideline: ( s: string ) => string;
		} ).getGuideline( slug );
		const isEmpty = ! currentValue || currentValue.trim().length === 0;

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
		const mockText = MOCK_BLOCK_SUGGESTIONS[ blockName ] ||
			`Use the ${ blockName.replace( 'core/', '' ) } block to present content in a clear, structured way. Keep content concise and focused on a single topic. Use appropriate formatting and ensure accessibility standards are met.`;

		const { setBlockGuideline } = dispatch( STORE_NAME ) as {
			setBlockGuideline: ( name: string, value: string ) => void;
		};
		const currentValue = ( select( STORE_NAME ) as { getBlockGuidelines: () => Record< string, string > } ).getBlockGuidelines()[ blockName ];
		const isEmpty = ! currentValue || currentValue.trim().length === 0;

		setBlockGeneratingState( ( prev ) => ( {
			...prev,
			[ blockName ]: 'requesting',
		} ) );

		setTimeout( () => {
			setBlockGeneratingState( ( prev ) => ( {
				...prev,
				[ blockName ]: 'streaming',
			} ) );

			setTimeout( () => {
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
		isGenerating,
	};
}
