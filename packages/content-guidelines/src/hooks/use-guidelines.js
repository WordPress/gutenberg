/**
 * WordPress dependencies
 */
import { useEntityRecord } from '@wordpress/core-data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ENTITY_KIND, ENTITY_NAME, ENTITY_ID } from '../store';

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
		save,
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
			const currentBlock = currentBlocks[ blockName ] || {};
			edit( {
				blocks: {
					...currentBlocks,
					[ blockName ]: {
						...currentBlock,
						...updates,
					},
				},
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
			return editedRecord.blocks[ blockName ] || null;
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
			const newBlocks = { ...currentBlocks };
			delete newBlocks[ blockName ];
			edit( { blocks: newBlocks } );
		},
		[ editedRecord, edit ]
	);

	return {
		// Data
		guidelines: editedRecord,
		savedGuidelines: record,
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
		case 'notes':
			return '';
		case 'blocks':
			return {};
		default:
			return {};
	}
}

export default useGuidelines;
