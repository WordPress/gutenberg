/**
 * WordPress dependencies
 */
import { type Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import {
	isYArray,
	isYMap,
	isYText,
	type YMapRecord,
	type YMap,
	type YText,
} from './crdt-utils';

/**
 * Walk a Y.Text's delta (produced with a DiffAttributionManager) and convert
 * it to an HTML string with suggestion markup:
 *
 * - Suggested insertions: `<ins class="wp-suggestion-insert">`
 * - Suggested deletions: `<del class="wp-suggestion-delete">`
 * - Unchanged content: output as-is
 *
 * @param ytext The Y.Text to render.
 * @param am    The DiffAttributionManager providing attribution data.
 * @return HTML string with suggestion markup.
 */
export function yTextToSuggestionHTML(
	ytext: YText,
	am: Y.DiffAttributionManager
): string {
	const delta = ( ytext as Y.Type ).toDelta( am );
	const json = delta.toJSON();
	const children = json.children;

	if ( ! children || children.length === 0 ) {
		return '';
	}

	const parts: string[] = [];

	for ( const op of children ) {
		if ( 'insert' in op && typeof op.insert === 'string' ) {
			const text = op.insert;
			const attribution = ( op as any ).attribution;

			if ( attribution && 'delete' in attribution ) {
				parts.push(
					`<del class="wp-suggestion-delete">${ text }</del>`
				);
			} else if ( attribution && 'insert' in attribution ) {
				parts.push(
					`<ins class="wp-suggestion-insert">${ text }</ins>`
				);
			} else {
				parts.push( text );
			}
		}
	}

	return parts.join( '' );
}

/**
 * Recursively serialize a Y.Type value to its plain JavaScript equivalent,
 * using the DiffAttributionManager to render suggestion markup for Y.Text
 * types. This is a variant of the standard `serialize` / `yMapToJSON` that
 * produces suggestion-aware HTML.
 *
 * @param value The value to serialize.
 * @param am    The DiffAttributionManager.
 * @return The plain JavaScript equivalent with suggestion markup.
 */
export function serializeWithSuggestions(
	value: unknown,
	am: Y.DiffAttributionManager
): unknown {
	if ( isYMap( value ) ) {
		return serializeWithSuggestions(
			( value as YMap< YMapRecord > ).getAttrs(),
			am
		);
	}

	if ( isYArray( value ) ) {
		return serializeWithSuggestions( ( value as Y.Type ).toArray(), am );
	}

	if ( isYText( value ) ) {
		return yTextToSuggestionHTML( value as YText, am );
	}

	// Serializable primitives.
	const primitives = [ 'boolean', 'bigint', 'number', 'string', 'undefined' ];
	if ( primitives.includes( typeof value ) ) {
		return value;
	}

	if ( Array.isArray( value ) ) {
		return value.map( ( item ) => serializeWithSuggestions( item, am ) );
	}

	if ( value && typeof value === 'object' ) {
		return Object.fromEntries(
			Object.entries( value ).map( ( [ k, v ] ) => [
				k,
				serializeWithSuggestions( v, am ),
			] )
		);
	}

	return null;
}

/**
 * Convert a YMap to a plain JavaScript object using suggestion-aware
 * serialization. Y.Text values are rendered with `<ins>`/`<del>` markup
 * based on the DiffAttributionManager's attribution data.
 *
 * @param ymap The YMap to convert.
 * @param am   The DiffAttributionManager.
 * @return The plain JavaScript equivalent with suggestion markup.
 */
export function yMapToJSONWithSuggestions< T extends YMapRecord >(
	ymap: YMap< T >,
	am: Y.DiffAttributionManager
): T {
	return serializeWithSuggestions( ymap.getAttrs(), am ) as T;
}

/**
 * A range of characters in a RichText plain-text value.
 */
export interface SuggestionDecorationRange {
	start: number;
	end: number;
}

const INS_OPEN = '<ins class="wp-suggestion-insert">';
const INS_CLOSE = '</ins>';
const DEL_OPEN = '<del class="wp-suggestion-delete">';
const DEL_CLOSE = '</del>';

/**
 * Given an HTML string that contains suggestion markup (`<ins>` and/or
 * `<del>` tags with suggestion classes), strip both tag types (keeping
 * their content) and compute the character ranges for each in plain-text
 * space.
 *
 * Plain-text space = the text as seen by RichText after HTML parsing
 * (HTML tags stripped, text content preserved).
 *
 * @param html HTML string with suggestion markup.
 * @return Object with cleanHTML (suggestion tags stripped) and ranges for
 *         both insertions and deletions.
 */
export function extractSuggestionRangesFromHTML( html: string ): {
	cleanHTML: string;
	insertionRanges: SuggestionDecorationRange[];
	deletionRanges: SuggestionDecorationRange[];
} {
	const hasIns = html.includes( 'wp-suggestion-insert' );
	const hasDel = html.includes( 'wp-suggestion-delete' );

	if ( ! hasIns && ! hasDel ) {
		return { cleanHTML: html, insertionRanges: [], deletionRanges: [] };
	}

	const insRanges: SuggestionDecorationRange[] = [];
	const delRanges: SuggestionDecorationRange[] = [];
	let plainPos = 0;
	let result = '';
	let i = 0;
	let inInsTag = false;
	let insStart = 0;
	let inDelTag = false;
	let delStart = 0;

	while ( i < html.length ) {
		// Check for <ins> open tag.
		if ( ! inInsTag && html.startsWith( INS_OPEN, i ) ) {
			inInsTag = true;
			insStart = plainPos;
			i += INS_OPEN.length;
			continue;
		}

		// Check for </ins> close tag.
		if ( inInsTag && html.startsWith( INS_CLOSE, i ) ) {
			if ( plainPos > insStart ) {
				insRanges.push( { start: insStart, end: plainPos } );
			}
			inInsTag = false;
			i += INS_CLOSE.length;
			continue;
		}

		// Check for <del> open tag.
		if ( ! inDelTag && html.startsWith( DEL_OPEN, i ) ) {
			inDelTag = true;
			delStart = plainPos;
			i += DEL_OPEN.length;
			continue;
		}

		// Check for </del> close tag.
		if ( inDelTag && html.startsWith( DEL_CLOSE, i ) ) {
			if ( plainPos > delStart ) {
				delRanges.push( { start: delStart, end: plainPos } );
			}
			inDelTag = false;
			i += DEL_CLOSE.length;
			continue;
		}

		// Skip any other HTML tag (does not count as plain text).
		if ( html[ i ] === '<' ) {
			const tagEnd = html.indexOf( '>', i );
			if ( tagEnd >= 0 ) {
				result += html.substring( i, tagEnd + 1 );
				i = tagEnd + 1;
				continue;
			}
		}

		// Regular text character.
		result += html[ i ];
		plainPos++;
		i++;
	}

	return {
		cleanHTML: result,
		insertionRanges: insRanges,
		deletionRanges: delRanges,
	};
}

/**
 * Given an HTML string that may contain `<del class="wp-suggestion-delete">`
 * tags, compute the character ranges of the deletion content in plain-text
 * space WITHOUT stripping the tags. The `<del>` tags are kept in the HTML
 * so that `stripSuggestionMarkup` can remove the deletion text during
 * write-back.
 *
 * @param html HTML string that may contain `<del>` suggestion markup.
 * @return Deletion ranges in plain-text space.
 */
export function extractDeletionRangesFromHTML(
	html: string
): SuggestionDecorationRange[] {
	if ( ! html.includes( 'wp-suggestion-delete' ) ) {
		return [];
	}

	const ranges: SuggestionDecorationRange[] = [];
	let plainPos = 0;
	let i = 0;
	let inDelTag = false;
	let delStart = 0;

	while ( i < html.length ) {
		// Check for <del> open tag.
		if ( ! inDelTag && html.startsWith( DEL_OPEN, i ) ) {
			inDelTag = true;
			delStart = plainPos;
			i += DEL_OPEN.length;
			continue;
		}

		// Check for </del> close tag.
		if ( inDelTag && html.startsWith( DEL_CLOSE, i ) ) {
			if ( plainPos > delStart ) {
				ranges.push( { start: delStart, end: plainPos } );
			}
			inDelTag = false;
			i += DEL_CLOSE.length;
			continue;
		}

		// Skip any HTML tag (does not count as plain text).
		if ( html[ i ] === '<' ) {
			const tagEnd = html.indexOf( '>', i );
			if ( tagEnd >= 0 ) {
				i = tagEnd + 1;
				continue;
			}
		}

		// Regular text character.
		plainPos++;
		i++;
	}

	return ranges;
}

/**
 * Post-process a serialized block tree (from `serializeWithSuggestions`) to:
 * 1. Strip `<ins>` tags from all rich-text attribute values (keeping content).
 * 2. Extract insertion ranges for each rich-text attribute.
 * 3. Extract deletion ranges for each rich-text attribute (keeping `<del>`
 *    tags in the HTML for write-back stripping by `stripSuggestionMarkup`).
 *
 * Decoration maps are keyed by `blockIndexPath:attributeName`.
 *
 * @param blocks Serialized block tree with full suggestion markup.
 * @return Cleaned blocks and decoration ranges for both insertions and deletions.
 */
export function extractSuggestionDecorations( blocks: any[] ): {
	blocks: any[];
	insertions: Record< string, SuggestionDecorationRange[] >;
	deletions: Record< string, SuggestionDecorationRange[] >;
} {
	const insertions: Record< string, SuggestionDecorationRange[] > = {};
	const deletions: Record< string, SuggestionDecorationRange[] > = {};

	function processBlocks( blockArray: any[], parentPath: string ): any[] {
		return blockArray.map( ( block, index ) => {
			const blockPath = parentPath
				? `${ parentPath }.${ index }`
				: `${ index }`;
			const cleanBlock = { ...block };

			if ( block.attributes && typeof block.attributes === 'object' ) {
				cleanBlock.attributes = { ...block.attributes };
				for ( const [ key, value ] of Object.entries(
					cleanBlock.attributes
				) ) {
					if ( typeof value !== 'string' ) {
						continue;
					}

					const decorKey = `${ blockPath }:${ key }`;
					const strValue = value as string;
					const hasIns = strValue.includes( 'wp-suggestion-insert' );
					const hasDel = strValue.includes( 'wp-suggestion-delete' );

					if ( ! hasIns && ! hasDel ) {
						continue;
					}

					// Compute both insertion and deletion ranges in a
					// single pass over the markup.
					const { insertionRanges, deletionRanges } =
						extractSuggestionRangesFromHTML( strValue );

					if ( insertionRanges.length > 0 ) {
						insertions[ decorKey ] = insertionRanges;
					}
					if ( deletionRanges.length > 0 ) {
						deletions[ decorKey ] = deletionRanges;
					}

					// Strip only <ins> tags (keeping content). <del>
					// tags must remain so that stripSuggestionMarkup
					// can remove the deletion text during write-back.
					if ( hasIns ) {
						cleanBlock.attributes[ key ] = strValue
							.split( INS_OPEN )
							.join( '' )
							.split( INS_CLOSE )
							.join( '' );
					}
				}
			}

			if (
				Array.isArray( block.innerBlocks ) &&
				block.innerBlocks.length > 0
			) {
				cleanBlock.innerBlocks = processBlocks(
					block.innerBlocks,
					blockPath
				);
			}

			return cleanBlock;
		} );
	}

	return { blocks: processBlocks( blocks, '' ), insertions, deletions };
}
