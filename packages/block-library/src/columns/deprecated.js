/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import {
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import save from './save';

/**
 * Given an HTML string for a deprecated columns inner block, returns the
 * column index to which the migrated inner block should be assigned. Returns
 * undefined if the inner block was not assigned to a column.
 *
 * @param {string} originalContent Deprecated Columns inner block HTML.
 *
 * @return {?number} Column to which inner block is to be assigned.
 */
function getDeprecatedLayoutColumn( originalContent ) {
	let { doc } = getDeprecatedLayoutColumn;
	if ( ! doc ) {
		doc = document.implementation.createHTMLDocument( '' );
		getDeprecatedLayoutColumn.doc = doc;
	}

	let columnMatch;

	doc.body.innerHTML = originalContent;
	for ( const classListItem of doc.body.firstChild.classList ) {
		if ( ( columnMatch = classListItem.match( /^layout-column-(\d+)$/ ) ) ) {
			return Number( columnMatch[ 1 ] ) - 1;
		}
	}
}

export default [
	{
		attributes: {
			columns: {
				type: 'number',
				default: 2,
			},
		},
		isEligible( attributes, innerBlocks ) {
			// Since isEligible is called on every valid instance of the
			// Columns block and a deprecation is the unlikely case due to
			// its subsequent migration, optimize for the `false` condition
			// by performing a naive, inaccurate pass at inner blocks.
			const isFastPassEligible = innerBlocks.some( ( innerBlock ) => (
				/layout-column-\d+/.test( innerBlock.originalContent )
			) );

			if ( ! isFastPassEligible ) {
				return false;
			}

			// Only if the fast pass is considered eligible is the more
			// accurate, durable, slower condition performed.
			return innerBlocks.some( ( innerBlock ) => (
				getDeprecatedLayoutColumn( innerBlock.originalContent ) !== undefined
			) );
		},
		migrate( attributes, innerBlocks ) {
			const columns = innerBlocks.reduce( ( result, innerBlock ) => {
				const { originalContent } = innerBlock;

				let columnIndex = getDeprecatedLayoutColumn( originalContent );
				if ( columnIndex === undefined ) {
					columnIndex = 0;
				}

				if ( ! result[ columnIndex ] ) {
					result[ columnIndex ] = [];
				}

				result[ columnIndex ].push( innerBlock );

				return result;
			}, [] );

			const migratedInnerBlocks = columns.map( ( columnBlocks ) => (
				createBlock( 'core/column', {}, columnBlocks )
			) );

			return [
				attributes,
				migratedInnerBlocks,
			];
		},
		save( { attributes } ) {
			const { columns } = attributes;

			return (
				<div className={ `has-${ columns }-columns` }>
					<InnerBlocks.Content />
				</div>
			);
		},
	},
	{
		attributes: {
			columns: {
				type: 'number',
				default: 2,
			},
		},
		isEligible( attributes, innerBlocks ) {
			return (
				! attributes.hasOwnProperty( 'columns' ) &&
				innerBlocks.length
			);
		},
		migrate( attributes, innerBlocks ) {
			attributes = {
				...attributes,
				columns: innerBlocks.length,
			};

			return [ attributes, innerBlocks ];
		},
		save,
	},
];
