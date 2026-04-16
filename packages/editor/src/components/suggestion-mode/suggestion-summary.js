/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { wordDiff } from './suggestion-diff';

/**
 * Cap on how much text we'll render inline in a summary. Longer insertions
 * or deletions are ellipsized so the comment thread stays readable.
 */
const SUMMARY_MAX_CHARS = 120;

/**
 * Friendlier labels for common block attributes so `Format:` lines read like
 * human categories rather than internal names. Anything not in this map
 * falls through to the raw attribute name.
 */
const FORMAT_ATTRIBUTE_LABELS = {
	level: __( 'heading level' ),
	align: __( 'alignment' ),
	textAlign: __( 'text alignment' ),
	fontSize: __( 'font size' ),
	style: __( 'style' ),
	url: __( 'link' ),
	href: __( 'link' ),
	backgroundColor: __( 'background color' ),
	textColor: __( 'text color' ),
};

/**
 * Join an array of label strings with a comma, using `__()`-friendly
 * punctuation. Deduplicated and lowercased for display.
 *
 * @param {string[]} labels Raw labels.
 * @return {string} Comma-joined list.
 */
function joinLabels( labels ) {
	const unique = Array.from(
		new Set( labels.filter( Boolean ).map( ( l ) => l.toLowerCase() ) )
	);
	return unique.join( ', ' );
}

function ellipsize( text ) {
	const trimmed = text.replace( /\s+/g, ' ' ).trim();
	if ( trimmed.length <= SUMMARY_MAX_CHARS ) {
		return trimmed;
	}
	return `${ trimmed.slice( 0, SUMMARY_MAX_CHARS - 1 ).trimEnd() }…`;
}

/**
 * Derive the inserted and deleted text spans from a pair of before/after
 * strings by running the shared word-level diff and concatenating matching
 * segments. Whitespace-only runs are excluded from the counts so a pure
 * format change doesn't surface as "Add: ' '".
 *
 * @param {string} before Original text.
 * @param {string} after  Proposed text.
 * @return {{inserted: string, deleted: string}} Aggregated insertions and
 * deletions, already trimmed and ellipsized.
 */
function textDelta( before, after ) {
	const segments = wordDiff( before, after );
	let inserted = '';
	let deleted = '';
	for ( const seg of segments ) {
		if ( seg.type === 'insert' ) {
			inserted += seg.value;
		} else if ( seg.type === 'delete' ) {
			deleted += seg.value;
		}
	}
	return {
		inserted: inserted.trim() ? ellipsize( inserted ) : '',
		deleted: deleted.trim() ? ellipsize( deleted ) : '',
	};
}

function isTextLike( value ) {
	return typeof value === 'string';
}

/**
 * Build a list of `{ label, value }` lines summarizing a suggestion. The
 * content attribute is reported with `Add:` / `Delete:` quotes; other
 * attribute changes are collapsed into a single `Format:` line listing the
 * touched attributes.
 *
 * @param {import('./provider').SuggestionOperation[]} operations Operations.
 * @return {Array<{label: string, value: string}>} Rendered lines.
 */
export function summarizeOperations( operations ) {
	if ( ! Array.isArray( operations ) || operations.length === 0 ) {
		return [];
	}

	const lines = [];
	const formatAttributes = [];

	for ( const op of operations ) {
		if ( op.type !== 'attribute-set' ) {
			formatAttributes.push( op.attribute );
			continue;
		}

		const isContent = op.attribute === 'content';
		const canTextDiff =
			isContent && isTextLike( op.before ) && isTextLike( op.after );

		if ( canTextDiff ) {
			const { inserted, deleted } = textDelta(
				op.before ?? '',
				op.after ?? ''
			);
			if ( inserted ) {
				lines.push( { label: __( 'Add:' ), value: `“${ inserted }”` } );
			}
			if ( deleted ) {
				lines.push( {
					label: __( 'Delete:' ),
					value: `“${ deleted }”`,
				} );
			}
			if ( ! inserted && ! deleted ) {
				formatAttributes.push( op.attribute );
			}
		} else {
			formatAttributes.push( op.attribute );
		}
	}

	if ( formatAttributes.length > 0 ) {
		const labels = formatAttributes.map(
			( key ) => FORMAT_ATTRIBUTE_LABELS[ key ] ?? key
		);
		lines.push( { label: __( 'Format:' ), value: joinLabels( labels ) } );
	}

	return lines;
}

/**
 * Compact sidebar summary of a suggestion — "Add: …", "Delete: …",
 * "Format: …". Designed to mirror a Google Docs-style review note.
 *
 * @param {Object}                                     props
 * @param {import('./provider').SuggestionOperation[]} props.operations
 */
export default function SuggestionSummary( { operations } ) {
	const lines = useMemo(
		() => summarizeOperations( operations ),
		[ operations ]
	);

	if ( lines.length === 0 ) {
		return null;
	}

	return (
		<VStack
			className="editor-collab-sidebar-panel__suggestion-summary"
			spacing="1"
		>
			{ lines.map( ( line, index ) => (
				<Text key={ index } size="13px">
					<strong>{ line.label }</strong> <em>{ line.value }</em>
				</Text>
			) ) }
		</VStack>
	);
}
