/**
 * Mock AI hook for Content Guidelines.
 *
 * Provides mock AI streaming for generating/improving guidelines.
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
	generate: () => void;
	generateSection: ( slug: string ) => void;
	generateBlock: ( blockName: string ) => void;
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

		// Add 2-4 words at a time for faster streaming feel
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
	const cleanupRef = useRef< ( () => void ) | null >( null );

	const generate = useCallback( () => {
		setState( 'generating' );

		// Reset all section states to requesting
		const initialStates: Record< string, SectionState > = {};
		SECTION_ORDER.forEach( ( slug ) => {
			initialStates[ slug ] = 'requesting';
		} );
		setSectionStates( initialStates );
		setSuggestions( {} );

		// Stream each section sequentially
		let sectionIndex = 0;

		const streamNextSection = () => {
			if ( sectionIndex >= SECTION_ORDER.length ) {
				setState( 'done' );
				return;
			}

			const slug = SECTION_ORDER[ sectionIndex ];
			const mockText = MOCK_SUGGESTIONS[ slug ] || '';

			// Mark section as streaming
			setSectionStates( ( prev ) => ( {
				...prev,
				[ slug ]: 'streaming',
			} ) );

			// Also update the store with the suggestion as it streams
			cleanupRef.current = simulateStreaming(
				mockText,
				( partial ) => {
					setSuggestions( ( prev ) => ( {
						...prev,
						[ slug ]: partial,
					} ) );
					// Write partial suggestion into the store draft
					const { setGuideline } = dispatch( STORE_NAME ) as {
						setGuideline: ( category: string, value: string ) => void;
					};
					setGuideline( slug, partial );
				},
				() => {
					setSectionStates( ( prev ) => ( {
						...prev,
						[ slug ]: 'done',
					} ) );
					sectionIndex++;
					// Small delay between sections
					setTimeout( streamNextSection, 200 );
				}
			);
		};

		// Start with a small delay to show requesting state
		setTimeout( streamNextSection, 300 );
	}, [] );

	const generateSection = useCallback( ( slug: string ) => {
		const mockText = MOCK_SUGGESTIONS[ slug ] || 'Generated guidelines for this section.';

		setSectionStates( ( prev ) => ( {
			...prev,
			[ slug ]: 'requesting',
		} ) );

		setTimeout( () => {
			setSectionStates( ( prev ) => ( {
				...prev,
				[ slug ]: 'streaming',
			} ) );

			cleanupRef.current = simulateStreaming(
				mockText,
				( partial ) => {
					setSuggestions( ( prev ) => ( {
						...prev,
						[ slug ]: partial,
					} ) );
					const { setGuideline } = dispatch( STORE_NAME ) as {
						setGuideline: ( category: string, value: string ) => void;
					};
					setGuideline( slug, partial );
				},
				() => {
					setSectionStates( ( prev ) => ( {
						...prev,
						[ slug ]: 'done',
					} ) );
				}
			);
		}, 300 );
	}, [] );

	const generateBlock = useCallback( ( blockName: string ) => {
		const mockText = `Use the ${ blockName.replace( 'core/', '' ) } block to present content in a clear, structured way. Keep content concise and focused on a single topic. Use appropriate formatting and ensure accessibility standards are met.`;

		setBlockGeneratingState( ( prev ) => ( {
			...prev,
			[ blockName ]: 'requesting',
		} ) );

		setTimeout( () => {
			setBlockGeneratingState( ( prev ) => ( {
				...prev,
				[ blockName ]: 'streaming',
			} ) );

			cleanupRef.current = simulateStreaming(
				mockText,
				( partial ) => {
					setBlockSuggestions( ( prev ) => ( {
						...prev,
						[ blockName ]: partial,
					} ) );
				},
				() => {
					setBlockGeneratingState( ( prev ) => ( {
						...prev,
						[ blockName ]: 'done',
					} ) );
				}
			);
		}, 300 );
	}, [] );

	const acceptSuggestion = useCallback( ( slug: string ) => {
		// The suggestion is already in the store draft from streaming.
		// Just clear the suggestion state.
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
		// Revert the store to the pre-suggestion value
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
		generate,
		generateSection,
		generateBlock,
		acceptSuggestion,
		dismissSuggestion,
		acceptBlockSuggestion,
		dismissBlockSuggestion,
		isGenerating,
	};
}
