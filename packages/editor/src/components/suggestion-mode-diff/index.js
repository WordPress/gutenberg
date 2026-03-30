/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { RichTextData } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { applyRichTextDiff } from '../post-revisions-preview/block-diff';

// Format type names used by the diff system.
const DIFF_FORMAT_TYPES = [
	'revision/diff-added',
	'revision/diff-removed',
	'revision/diff-format-added',
	'revision/diff-format-removed',
	'revision/diff-format-changed',
];

/**
 * Strip diff formatting from a RichTextData value to recover the original
 * block content. After a diff is rendered as editable, setAttributes saves
 * the diffed content back to the store. This function reverses that:
 *
 * - Characters with `revision/diff-added` format are removed (they came
 *   from the suggestion, not the original block).
 * - Characters with `revision/diff-removed` format are kept (they are
 *   original block content) but have the diff format stripped.
 * - All other diff-related formats are stripped from remaining characters.
 *
 * @param {RichTextData} richTextData The potentially diff-polluted value.
 * @return {RichTextData} Cleaned value representing original block content.
 */
function stripDiffFormats( richTextData ) {
	const text = richTextData.text;
	const formats = richTextData.formats;
	const replacements = richTextData.replacements;

	// Quick check: if no diff formats exist, return as-is.
	let hasDiffFormats = false;
	for ( let i = 0; i < text.length; i++ ) {
		const charFormats = formats[ i ];
		if (
			charFormats &&
			charFormats.some( ( f ) => DIFF_FORMAT_TYPES.includes( f.type ) )
		) {
			hasDiffFormats = true;
			break;
		}
	}

	if ( ! hasDiffFormats ) {
		return richTextData;
	}

	let newText = '';
	const newFormats = [];
	const newReplacements = [];

	for ( let i = 0; i < text.length; i++ ) {
		const charFormats = formats[ i ] || [];

		// Skip characters injected by the suggestion (diff-added).
		if ( charFormats.some( ( f ) => f.type === 'revision/diff-added' ) ) {
			continue;
		}

		// Keep the character but remove all diff-related formats.
		const cleanedFormats = charFormats.filter(
			( f ) => ! DIFF_FORMAT_TYPES.includes( f.type )
		);

		newText += text[ i ];
		newFormats.push(
			cleanedFormats.length > 0 ? cleanedFormats : undefined
		);
		newReplacements.push( replacements[ i ] );
	}

	return new RichTextData( {
		text: newText,
		formats: newFormats,
		replacements: newReplacements,
	} );
}

/**
 * Simple bounded cache — evicts the oldest entry when the limit is reached.
 *
 * @param {number} maxSize Maximum number of entries.
 * @return {Map} A Map with a bounded `set` method.
 */
function createBoundedCache( maxSize = 100 ) {
	const cache = new Map();
	const originalSet = cache.set.bind( cache );
	cache.set = ( key, value ) => {
		originalSet( key, value );
		if ( cache.size > maxSize ) {
			cache.delete( cache.keys().next().value );
		}
		return cache;
	};
	return cache;
}

// Caches to avoid recomputing and creating new RichTextData instances
// on every useSelect call, which would cause infinite re-renders.
const diffCache = createBoundedCache();
const editCache = createBoundedCache();

/**
 * Helper to read the note content string, handling both API format
 * ({ rendered: "..." }) and local edit format (plain string).
 *
 * @param {Object} note The note entity record.
 * @return {string} The note content as a plain string.
 */
function getNoteText( note ) {
	const raw =
		typeof note.content === 'string'
			? note.content
			: note.content?.rendered || '';
	return stripHTML( raw ).trim();
}

/**
 * Resolve the suggestion context for a block: its attributes, the linked
 * suggestion note, and the name of its first rich-text attribute.
 *
 * Returns null if any prerequisite is missing (no noteId, note not a
 * suggestion, no rich-text attribute, etc.).
 *
 * @param {Function} select   The registry select function.
 * @param {string}   clientId The block's client ID.
 * @return {Object|null} { attributes, richTextAttrName, suggestedText } or null.
 */
function resolveSuggestionContext( select, clientId ) {
	const { getBlockAttributes, getBlockName } = select( blockEditorStore );
	const attributes = getBlockAttributes( clientId );
	const noteId = attributes?.metadata?.noteId;

	if ( ! noteId ) {
		return null;
	}

	const note = select( coreStore ).getEditedEntityRecord(
		'root',
		'comment',
		noteId
	);

	if ( ! note || note.meta?._wp_note_kind !== 'suggestion' ) {
		return null;
	}

	const blockName = getBlockName( clientId );
	const blockType = getBlockType( blockName );

	if ( ! blockType ) {
		return null;
	}

	// Find the first rich-text source attribute.
	let richTextAttrName = null;
	for ( const [ attrName, attrDef ] of Object.entries(
		blockType.attributes
	) ) {
		if (
			attrDef.source === 'rich-text' &&
			attributes[ attrName ] instanceof RichTextData
		) {
			richTextAttrName = attrName;
			break;
		}
	}

	if ( ! richTextAttrName ) {
		return null;
	}

	return {
		attributes,
		richTextAttrName,
		suggestedText: getNoteText( note ),
	};
}

/**
 * Selector-style function to get editable attributes for a block's
 * suggestion note. Returns the note content as a RichTextData value
 * (no diff markup) so the user can edit the suggestion directly.
 * Used when the block is focused in suggestion mode.
 *
 * @param {Function} select   The registry select function.
 * @param {string}   clientId The block's client ID.
 * @return {Object|null} Modified attributes with note content, or null.
 */
export function getSuggestionEditAttributes( select, clientId ) {
	const ctx = resolveSuggestionContext( select, clientId );
	if ( ! ctx ) {
		return null;
	}

	const { attributes, richTextAttrName, suggestedText } = ctx;

	const cacheKey = `edit:${ clientId }:${ suggestedText }`;
	const cached = editCache.get( cacheKey );
	if ( cached ) {
		return cached;
	}

	const result = {
		...attributes,
		[ richTextAttrName ]: RichTextData.fromPlainText( suggestedText ),
	};

	editCache.set( cacheKey, result );
	return result;
}

/**
 * Selector-style function to compute diffed attributes for a block
 * with a suggestion note. Called from within a useSelect in block-editor
 * via settings, so it receives `select` and can access any store.
 *
 * @param {Function} select   The registry select function.
 * @param {string}   clientId The block's client ID.
 * @return {Object|null} Modified attributes with diff formatting, or null.
 */
export function getSuggestionDiffAttributes( select, clientId ) {
	const ctx = resolveSuggestionContext( select, clientId );
	if ( ! ctx ) {
		return null;
	}

	const { attributes, richTextAttrName, suggestedText } = ctx;

	// Strip any previously-applied diff formatting to recover the
	// original block content. After edits, setAttributes saves the
	// diffed RichTextData (including <del> text) back to the store.
	const cleanValue = stripDiffFormats( attributes[ richTextAttrName ] );
	const originalText = cleanValue.toPlainText();

	// Build a cache key from the inputs that affect the diff result.
	// If these haven't changed, return the cached result to avoid
	// creating new RichTextData instances and causing re-renders.
	const cacheKey = `${ clientId }:${ originalText }:${ suggestedText }`;
	const cached = diffCache.get( cacheKey );
	if ( cached ) {
		return cached;
	}

	const suggestedRichText = RichTextData.fromPlainText( suggestedText );

	const diffAttributes = {
		...attributes,
		[ richTextAttrName ]: applyRichTextDiff(
			suggestedRichText,
			cleanValue
		),
	};

	diffCache.set( cacheKey, diffAttributes );
	return diffAttributes;
}
