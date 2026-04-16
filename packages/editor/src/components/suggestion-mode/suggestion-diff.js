/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
	VisuallyHidden,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Upper bound for word-level LCS input length (characters). Beyond this,
 * we fall back to an attribute-level before→after label to avoid the
 * O(m·n) diff dominating the render.
 */
const MAX_DIFF_LENGTH = 5000;

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
 * @param {Object}                                     props
 * @param {import('./provider').SuggestionOperation[]} props.operations
 */
export default function SuggestionDiff( { operations } ) {
	if ( ! operations || operations.length === 0 ) {
		return null;
	}

	return (
		<VStack
			className="editor-collab-sidebar-panel__suggestion-diff"
			spacing="1"
		>
			<Text variant="muted" size="11px" upperCase weight={ 600 }>
				{ __( 'Suggested change' ) }
			</Text>
			{ operations.map( ( op, index ) => {
				const canWordDiff =
					op.type === 'attribute-set' &&
					isTextValue( op.before ) &&
					isTextValue( op.after ) &&
					( op.before?.length ?? 0 ) <= MAX_DIFF_LENGTH &&
					( op.after?.length ?? 0 ) <= MAX_DIFF_LENGTH;
				const key = `${ op.type }:${ op.attribute }:${ index }`;
				return (
					<div key={ key }>
						{ canWordDiff ? (
							<TextDiff
								before={ op.before ?? '' }
								after={ op.after }
							/>
						) : (
							<AttributeDiff operation={ op } />
						) }
					</div>
				);
			} ) }
		</VStack>
	);
}

function isTextValue( value ) {
	return value === null || value === undefined || typeof value === 'string';
}

function TextDiff( { before, after } ) {
	// The LCS below is O(m·n) in time and space. Memoize so repeated
	// sidebar renders don't repay the cost.
	const segments = useMemo(
		() => wordDiff( before, after ),
		[ before, after ]
	);
	return (
		<Text
			className="editor-collab-sidebar-panel__suggestion-text-diff"
			size="13px"
		>
			{ segments.map( ( seg, i ) => {
				if ( seg.type === 'delete' ) {
					return (
						<del
							key={ i }
							style={ {
								color: 'var(--wp-block-synced-color, #cc1818)',
								textDecoration: 'line-through',
							} }
						>
							<VisuallyHidden>
								{ __( 'Deleted:' ) }
							</VisuallyHidden>
							{ seg.value }
						</del>
					);
				}
				if ( seg.type === 'insert' ) {
					return (
						<ins
							key={ i }
							style={ {
								color: 'var(--wp-admin-theme-color, #007017)',
								textDecoration: 'underline',
							} }
						>
							<VisuallyHidden>
								{ __( 'Inserted:' ) }
							</VisuallyHidden>
							{ seg.value }
						</ins>
					);
				}
				return <span key={ i }>{ seg.value }</span>;
			} ) }
		</Text>
	);
}

function AttributeDiff( { operation } ) {
	const label =
		typeof operation.before === 'string'
			? `${ operation.attribute }: ${ operation.before } → ${ operation.after }`
			: `${ operation.attribute }: changed`;
	return (
		<Text size="12px" variant="muted">
			{ label }
		</Text>
	);
}
