/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { applyFormat } from '@wordpress/rich-text';

const name = 'core/suggestion-insert';
const title = __( 'Suggested insertion' );

/**
 * The store name for suggestion decoration ranges. This store is registered
 * by `@wordpress/core-data` and populated by the sync manager.
 */
const DECORATION_STORE = 'core/suggestion-decorations';

/**
 * Format type for suggested insertions. Highlighting is applied at the view
 * layer via `__experimentalCreatePrepareEditableTree` — the suggestion
 * markup (`<ins>`) is never written to block attributes or the CRDT.
 *
 * When no decoration data is available (e.g. sync not active), the format
 * is inert and the edit component returns null.
 */
export const suggestionInsert = {
	name,
	title,
	tagName: 'ins',
	className: 'wp-suggestion-insert',
	edit() {
		return null;
	},

	/**
	 * Called inside useSelect — return values trigger re-renders.
	 * We read the decoration version (for reactivity) and compute
	 * the insertion ranges for this specific RichText instance.
	 *
	 * @param {Function} select                   Data selector.
	 * @param {Object}   props                    The RichText props.
	 * @param {string}   props.richTextIdentifier The identifier for this RichText instance.
	 * @param {string}   props.blockClientId      The client ID of the block containing this RichText.
	 * @return {Object} An object containing the insertion ranges and decoration version.
	 */
	__experimentalGetPropsForEditableTreePreparation(
		select,
		{ richTextIdentifier, blockClientId }
	) {
		// Guard: store may not be registered if sync is inactive.
		let version;
		try {
			version = select( DECORATION_STORE ).getDecorationVersion();
		} catch {
			return { ranges: [] };
		}

		// Compute the block's index path to match the key format used
		// by the decoration store (blockIndexPath:attributeName).
		const blockEditor = select( 'core/block-editor' );
		const parents = blockEditor.getBlockParents( blockClientId );
		const allIds = [ ...parents, blockClientId ];
		const indexPath = allIds
			.map( ( id ) => blockEditor.getBlockIndex( id ) )
			.join( '.' );
		const key = `${ indexPath }:${ richTextIdentifier }`;

		const ranges = select( DECORATION_STORE ).getInsertionRanges( key );
		return { ranges, version };
	},

	/**
	 * Inject suggestion-insert formats at the computed ranges. These
	 * formats exist only in the editable tree — they are automatically
	 * stripped before serialization by the RichText hook.
	 *
	 * @param {Object} props        The RichText props.
	 * @param {Array}  props.ranges The ranges at which to apply the suggestion-insert format.
	 */
	__experimentalCreatePrepareEditableTree( { ranges } ) {
		return ( formats, text ) => {
			if ( ! ranges || ranges.length === 0 ) {
				return formats;
			}

			let record = { formats, text };
			for ( const range of ranges ) {
				const start = Math.min( range.start, text.length );
				const end = Math.min( range.end, text.length );
				if ( start < end ) {
					record = applyFormat( record, { type: name }, start, end );
				}
			}
			return record.formats;
		};
	},
};
