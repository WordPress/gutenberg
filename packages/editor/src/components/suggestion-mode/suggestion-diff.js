/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalText as WCText } from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { useMemo } from '@wordpress/element';

/**
 * Upper bound for word-level LCS input length (characters). Beyond this,
 * we fall back to an attribute-level before→after label to avoid the
 * O(m·n) diff dominating the render. Two 2 KB strings produce a 4M-cell DP
 * table, which is the practical ceiling for an interactive sidebar render.
 */
const MAX_DIFF_LENGTH = 2000;

/**
 * Compute a word-level diff between two strings, returning an array of
 * segments tagged as `equal`, `insert`, or `delete`.
 *
 * @param {string} before Original text.
 * @param {string} after  Proposed text.
 * @return {Array<{type: string, value: string}>} Diff segments.
 */
export function wordDiff( before, after ) {
	const a = tokenize( before );
	const b = tokenize( after );
	const lcs = longestCommonSubsequence( a, b );

	const result = [];
	let ai = 0;
	let bi = 0;

	for ( const token of lcs ) {
		while ( ai < a.length && a[ ai ] !== token ) {
			result.push( { type: 'delete', value: a[ ai ] } );
			ai++;
		}
		while ( bi < b.length && b[ bi ] !== token ) {
			result.push( { type: 'insert', value: b[ bi ] } );
			bi++;
		}
		result.push( { type: 'equal', value: token } );
		ai++;
		bi++;
	}

	while ( ai < a.length ) {
		result.push( { type: 'delete', value: a[ ai ] } );
		ai++;
	}
	while ( bi < b.length ) {
		result.push( { type: 'insert', value: b[ bi ] } );
		bi++;
	}

	return result;
}

function tokenize( str ) {
	if ( typeof str !== 'string' ) {
		return [];
	}
	return str.match( /\S+|\s+/g ) || [];
}

function longestCommonSubsequence( a, b ) {
	const m = a.length;
	const n = b.length;
	const dp = Array.from( { length: m + 1 }, () =>
		new Array( n + 1 ).fill( 0 )
	);

	for ( let i = 1; i <= m; i++ ) {
		for ( let j = 1; j <= n; j++ ) {
			dp[ i ][ j ] =
				a[ i - 1 ] === b[ j - 1 ]
					? dp[ i - 1 ][ j - 1 ] + 1
					: Math.max( dp[ i - 1 ][ j ], dp[ i ][ j - 1 ] );
		}
	}

	const result = [];
	let i = m;
	let j = n;
	while ( i > 0 && j > 0 ) {
		if ( a[ i - 1 ] === b[ j - 1 ] ) {
			result.unshift( a[ i - 1 ] );
			i--;
			j--;
		} else if ( dp[ i - 1 ][ j ] > dp[ i ][ j - 1 ] ) {
			i--;
		} else {
			j--;
		}
	}
	return result;
}

/**
 * Renders a compact inline diff preview for a suggestion's operations.
 * Text-valued attributes show word-level insertions (green underline) and
 * deletions (red strikethrough). Non-text attributes show a before → after
 * label.
 *
 * Operations are expected to come from `parseSuggestionPayload(...)`. Each
 * operation has the shape `{ type: 'attribute-set', attribute, before, after }`.
 *
 * Edge cases:
 *   - When either side is too large (`>= MAX_DIFF_LENGTH` chars), the
 *     component falls back to an attribute-level label rather than a word
 *     diff to avoid the LCS dominating the render time.
 *   - When `before` or `after` is a wrapper object (e.g. `RichTextData`),
 *     `isTextValue` returns false and the component renders the
 *     attribute-level label. The provider has already serialized wrapper
 *     boundaries to strings before this layer in normal flow.
 *
 * @param {Object}                                     props
 * @param {import('./provider').SuggestionOperation[]} props.operations Suggestion
 *                                                                      operations,
 *                                                                      typically the
 *                                                                      `operations`
 *                                                                      array from a
 *                                                                      parsed payload.
 */
export default function SuggestionDiff( { operations } ) {
	if ( ! operations || operations.length === 0 ) {
		return null;
	}

	return (
		<Stack
			direction="column"
			gap="xs"
			className="editor-collab-sidebar-panel__suggestion-diff"
		>
			<WCText variant="muted" size="11px" upperCase weight={ 600 }>
				{ __( 'Suggested change' ) }
			</WCText>
			{ operations.map( ( op, index ) => {
				const key = `${ op.type }:${
					op.attribute ?? op.clientId
				}:${ index }`;
				return (
					<div key={ key }>
						<DiffForOperation operation={ op } />
					</div>
				);
			} ) }
		</Stack>
	);
}

function isTextValue( value ) {
	return value === null || value === undefined || typeof value === 'string';
}

/**
 * Pick the diff renderer for an operation. Hoisted out of the parent map
 * loop so the per-op decision tree is a flat if/else rather than a nested
 * ternary.
 *
 * @param {{ operation: import('./provider').SuggestionOperation }} props
 */
function DiffForOperation( { operation } ) {
	if ( operation.type === 'block-remove' ) {
		return <BlockRemoveDiff operation={ operation } />;
	}
	if ( operation.type === 'block-insert-after' ) {
		return <BlockInsertDiff operation={ operation } />;
	}
	if (
		operation.type === 'attribute-set' &&
		isTextValue( operation.before ) &&
		isTextValue( operation.after ) &&
		( operation.before?.length ?? 0 ) <= MAX_DIFF_LENGTH &&
		( operation.after?.length ?? 0 ) <= MAX_DIFF_LENGTH
	) {
		return (
			<TextDiff
				before={ operation.before ?? '' }
				after={ operation.after }
			/>
		);
	}
	return <AttributeDiff operation={ operation } />;
}

function TextDiff( { before, after } ) {
	// The LCS below is O(m·n) in time and space. Memoize so repeated
	// sidebar renders don't repay the cost.
	const segments = useMemo(
		() => wordDiff( before, after ),
		[ before, after ]
	);
	return (
		<WCText
			className="editor-collab-sidebar-panel__suggestion-text-diff"
			size="13px"
		>
			{ segments.map( ( seg, i ) => {
				if ( seg.type === 'delete' ) {
					return (
						<del key={ i }>
							<VisuallyHidden>
								{ __( 'Deleted:' ) }
							</VisuallyHidden>
							{ seg.value }
						</del>
					);
				}
				if ( seg.type === 'insert' ) {
					return (
						<ins key={ i }>
							<VisuallyHidden>
								{ __( 'Inserted:' ) }
							</VisuallyHidden>
							{ seg.value }
						</ins>
					);
				}
				return <span key={ i }>{ seg.value }</span>;
			} ) }
		</WCText>
	);
}

function AttributeDiff( { operation } ) {
	const label =
		typeof operation.before === 'string'
			? `${ operation.attribute }: ${ operation.before } → ${ operation.after }`
			: `${ operation.attribute }: changed`;
	return (
		<WCText size="12px" variant="muted">
			{ label }
		</WCText>
	);
}

/**
 * Render a `block-remove` op as a strikethrough preview. The op carries a
 * snapshot of the removed block (`op.block`) so the sidebar can show what
 * is proposed to disappear without depending on the live tree.
 *
 * Falls back to a label-only "Remove block: X" line when the block snapshot
 * is missing (older payloads, or block-editor reading edge cases).
 *
 * @param {{ operation: { blockName?: string, block?: Object } }} props
 */
function BlockRemoveDiff( { operation } ) {
	const blockName = operation.blockName ?? operation.block?.name ?? '';
	const innerText = collectBlockText( operation.block );
	return (
		<WCText
			size="13px"
			className="editor-collab-sidebar-panel__suggestion-text-diff"
		>
			<del>
				<VisuallyHidden>{ __( 'Deleted:' ) }</VisuallyHidden>
				{ innerText
					? innerText
					: blockName || __( 'Block proposed for removal.' ) }
			</del>
		</WCText>
	);
}

/**
 * Render a `block-insert-after` op as an underlined inserted-block preview.
 * The captured snapshot (`op.block`) carries the proposed block as it was
 * at insertion time; `collectBlockText` walks its content and innerBlocks
 * to produce a textual preview.
 *
 * Falls back to "Insert block: <name>" when the op carries no usable text
 * (an inserted block with no content yet, e.g. an empty paragraph).
 *
 * @param {{ operation: { blockName?: string, block?: Object } }} props
 */
function BlockInsertDiff( { operation } ) {
	const blockName = operation.blockName ?? operation.block?.name ?? '';
	const innerText = collectBlockText( operation.block );
	const fallbackLabel = blockName
		? // translators: %s: block name (e.g. "core/paragraph").
		  __( 'New block: %s' ).replace( '%s', blockName )
		: __( 'New block proposed.' );
	return (
		<WCText
			size="13px"
			className="editor-collab-sidebar-panel__suggestion-text-diff"
		>
			<ins>
				<VisuallyHidden>{ __( 'Inserted:' ) }</VisuallyHidden>
				{ innerText || fallbackLabel }
			</ins>
		</WCText>
	);
}

/**
 * Concatenate the text content of a serialized block snapshot for use in
 * the sidebar diff preview. Walks `attributes.content` (RichText-backed
 * blocks) plus innerBlocks recursively. Caps the total length at
 * `MAX_DIFF_LENGTH` so a giant subtree doesn't bloat the sidebar.
 *
 * @param {Object|undefined} block Serialized block snapshot.
 * @return {string} Concatenated text, possibly empty.
 */
function collectBlockText( block ) {
	if ( ! block ) {
		return '';
	}
	const parts = [];
	const walk = ( node ) => {
		if ( ! node ) {
			return;
		}
		const text = node.attributes?.content;
		if ( typeof text === 'string' && text.length > 0 ) {
			parts.push( text );
		} else if ( text && typeof text.toString === 'function' ) {
			// RichTextData wrappers serialize their content via String().
			const str = String( text );
			if ( str.length > 0 ) {
				parts.push( str );
			}
		}
		for ( const child of node.innerBlocks ?? [] ) {
			walk( child );
		}
	};
	walk( block );
	const joined = parts.join( ' ' );
	return joined.length > MAX_DIFF_LENGTH
		? `${ joined.slice( 0, MAX_DIFF_LENGTH ) }…`
		: joined;
}

export { collectBlockText };
