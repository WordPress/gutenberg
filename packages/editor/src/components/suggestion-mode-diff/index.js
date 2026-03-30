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

// Cache to avoid recomputing and creating new RichTextData instances
// on every useSelect call, which would cause infinite re-renders.
const diffCache = new Map();

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
	const { getBlockAttributes, getBlockName } = select( blockEditorStore );
	const attributes = getBlockAttributes( clientId );
	const noteId = attributes?.metadata?.noteId;

	if ( ! noteId ) {
		return null;
	}

	const note = select( coreStore ).getEntityRecord(
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

	// Find the first rich-text attribute to diff.
	let richTextAttrName = null;
	for ( const [ attrName, attrDef ] of Object.entries(
		blockType.attributes
	) ) {
		if ( attrDef.source === 'rich-text' ) {
			const currentValue = attributes[ attrName ];
			if ( currentValue instanceof RichTextData ) {
				richTextAttrName = attrName;
				break;
			}
		}
	}

	if ( ! richTextAttrName ) {
		return null;
	}

	// Strip any previously-applied diff formatting to recover the
	// original block content. After edits, setAttributes saves the
	// diffed RichTextData (including <del> text) back to the store.
	const cleanValue = stripDiffFormats( attributes[ richTextAttrName ] );
	const originalText = cleanValue.toPlainText();

	const suggestedText = stripHTML( note.content?.rendered || '' ).trim();

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

	// Keep cache bounded.
	if ( diffCache.size > 100 ) {
		const firstKey = diffCache.keys().next().value;
		diffCache.delete( firstKey );
	}

	return diffAttributes;
}
