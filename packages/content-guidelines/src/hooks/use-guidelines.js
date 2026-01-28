/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ENTITY_KIND, ENTITY_NAME, ENTITY_ID } from '../store';

const getLegacyBlockKey = ( blockName ) => {
	if ( ! blockName || ! blockName.includes( '/' ) ) {
		return null;
	}

	return blockName.replace( '/', '' );
};

/**
 * Hook to access and edit content guidelines using the canonical core-data pattern.
 *
 * This is the recommended way to interact with content guidelines.
 * It uses core-data's useEntityRecord which provides:
 * - Automatic dirty tracking
 * - SaveHub integration
 * - Optimistic updates
 * - Undo/redo support
 *
 * @example
 * ```js
 * const { guidelines, isLoading, hasChanges, setSection, save } = useGuidelines();
 *
 * // Read a section
 * const brandContext = guidelines?.brand_context;
 *
 * // Update a section
 * setSection( 'brand_context', { site_description: 'My site' } );
 *
 * // Save is automatic via SaveHub, or manually:
 * save();
 * ```
 *
 * @return {Object} Guidelines data and methods.
 */
export function useGuidelines() {
	const {
		record,
		editedRecord,
		hasEdits,
		edits,
		edit,
		save: saveEntity,
		isResolving,
		hasResolved,
	} = useEntityRecord( ENTITY_KIND, ENTITY_NAME, ENTITY_ID );

	/**
	 * Update a top-level section (brand_context, voice_tone, etc.).
	 * Merges the updates with existing section data.
	 */
	const setSection = useCallback(
		( section, updates ) => {
			if ( ! editedRecord ) {
				return;
			}
			const currentSection = editedRecord[ section ] || {};
			edit( {
				[ section ]: {
					...currentSection,
					...updates,
				},
			} );
		},
		[ editedRecord, edit ]
	);

	/**
	 * Update block-specific guidelines.
	 * Merges the updates with existing block guidelines.
	 */
	const setBlockGuidelines = useCallback(
		( blockName, updates ) => {
			if ( ! editedRecord ) {
				return;
			}
			const currentBlocks = editedRecord.blocks || {};
			const legacyBlockName = getLegacyBlockKey( blockName );
			const currentBlock =
				currentBlocks[ blockName ] ||
				( legacyBlockName ? currentBlocks[ legacyBlockName ] : null ) ||
				{};
			const newBlocks = {
				...currentBlocks,
				[ blockName ]: {
					...currentBlock,
					...updates,
				},
			};

			if ( legacyBlockName ) {
				delete newBlocks[ legacyBlockName ];
			}
			edit( {
				blocks: newBlocks,
			} );
		},
		[ editedRecord, edit ]
	);

	/**
	 * Get guidelines for a specific block.
	 */
	const getBlockGuidelines = useCallback(
		( blockName ) => {
			if ( ! editedRecord?.blocks ) {
				return null;
			}
			const legacyBlockName = getLegacyBlockKey( blockName );
			return (
				editedRecord.blocks[ blockName ] ||
				( legacyBlockName
					? editedRecord.blocks[ legacyBlockName ]
					: null ) ||
				null
			);
		},
		[ editedRecord ]
	);

	/**
	 * Clear a section to its empty state.
	 */
	const clearSection = useCallback(
		( section ) => {
			edit( { [ section ]: getEmptySection( section ) } );
		},
		[ edit ]
	);

	/**
	 * Clear block guidelines for a specific block.
	 */
	const clearBlockGuidelines = useCallback(
		( blockName ) => {
			if ( ! editedRecord ) {
				return;
			}
			const currentBlocks = editedRecord.blocks || {};
			const legacyBlockName = getLegacyBlockKey( blockName );
			const newBlocks = { ...currentBlocks };
			delete newBlocks[ blockName ];
			if ( legacyBlockName ) {
				delete newBlocks[ legacyBlockName ];
			}
			edit( { blocks: newBlocks } );
		},
		[ editedRecord, edit ]
	);

	const normalizedGuidelines = normalizeGuidelines( editedRecord );
	const normalizedSavedGuidelines = normalizeGuidelines( record );

	const save = useCallback( () => saveEntity(), [ saveEntity ] );

	return {
		// Data
		guidelines: normalizedGuidelines,
		savedGuidelines: normalizedSavedGuidelines,
		edits,

		// State
		isLoading: isResolving,
		hasResolved,
		hasChanges: hasEdits,

		// Mutations
		edit,
		setSection,
		setBlockGuidelines,
		getBlockGuidelines,
		clearSection,
		clearBlockGuidelines,
		save,
	};
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
				readability: 'general',
			};
		case 'copy_rules':
			return {
				dos: [],
				donts: [],
				formatting: [],
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
				words_per_sentence: null,
				sentences_per_paragraph: null,
				paragraphs_per_section: null,
				reading_level: '',
				reading_level_custom: '',
				max_syllables: null,
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
		case 'notes':
			return '';
		case 'blocks':
			return {};
		default:
			return {};
	}
}

/**
 * Normalize guidelines object, ensuring block keys keep their namespaces.
 *
 * @param {Object|null} guidelines Guidelines object.
 * @return {Object|null} Normalized guidelines.
 */
function normalizeGuidelines( guidelines ) {
	if ( ! guidelines ) {
		return guidelines;
	}

	const cleanGuidelines = Object.fromEntries(
		Object.entries( guidelines ).filter(
			( [ key ] ) => ! key.startsWith( '__' )
		)
	);

	return {
		...cleanGuidelines,
		blocks: normalizeBlockKeys( cleanGuidelines.blocks ),
	};
}

/**
 * Normalize block keys from stripped format (coreparagraph) to canonical (core/paragraph).
 *
 * @param {Object} blocks Blocks object.
 * @return {Object} Normalized blocks object.
 */
function normalizeBlockKeys( blocks ) {
	if ( ! blocks || typeof blocks !== 'object' ) {
		return blocks;
	}

	const normalized = {};
	const namespaces = [
		'core',
		'jetpack',
		'woocommerce',
		'generateblocks',
		'kadence',
		'stackable',
		'spectra',
		'otter',
	];

	for ( const [ key, value ] of Object.entries( blocks ) ) {
		if ( key.includes( '/' ) ) {
			normalized[ key ] = value;
			continue;
		}

		let matched = false;
		let normalizedKey = key;
		for ( const ns of namespaces ) {
			if ( key.startsWith( ns ) && key.length > ns.length ) {
				const blockName = key.slice( ns.length );
				normalizedKey = `${ ns }/${ blockName }`;
				matched = true;
				break;
			}
		}

		if ( normalized[ normalizedKey ] ) {
			continue;
		}

		if ( ! matched ) {
			normalized[ normalizedKey ] = value;
			continue;
		}

		normalized[ normalizedKey ] = value;
	}

	return normalized;
}

export default useGuidelines;
