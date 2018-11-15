/**
 * External dependencies
 */
import { times } from 'lodash';
import classnames from 'classnames';
import memoize from 'memize';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl, G, SVG, Path } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import {
	InspectorControls,
	InnerBlocks,
} from '@wordpress/editor';

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
*/
const ALLOWED_BLOCKS = [ 'core/column' ];

/**
 * Returns the layouts configuration for a given number of columns.
 *
 * @param {number} columns Number of columns.
 *
 * @return {Object[]} Columns layout configuration.
 */
const getColumnsTemplate = memoize( ( columns ) => {
	return times( columns, () => [ 'core/column' ] );
} );

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

export const name = 'core/columns';

export const settings = {
	title: __( 'Columns' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M21 4H3L2 5v14l1 1h18l1-1V5l-1-1zM8 18H4V6h4v12zm6 0h-4V6h4v12zm6 0h-4V6h4v12z" /></G></SVG>,

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},

	deprecated: [
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
	],

	edit( { attributes, setAttributes, className } ) {
		const { columns } = attributes;
		const classes = classnames( className, `has-${ columns }-columns` );

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody>
						<RangeControl
							label={ __( 'Columns' ) }
							value={ columns }
							onChange={ ( nextColumns ) => {
								setAttributes( {
									columns: nextColumns,
								} );
							} }
							min={ 2 }
							max={ 6 }
						/>
					</PanelBody>
				</InspectorControls>
				<div className={ classes }>
					<InnerBlocks
						template={ getColumnsTemplate( columns ) }
						templateLock="all"
						allowedBlocks={ ALLOWED_BLOCKS } />
				</div>
			</Fragment>
		);
	},

	save( { attributes } ) {
		const { columns } = attributes;

		return (
			<div className={ `has-${ columns }-columns` }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
