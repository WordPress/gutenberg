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
import { compose } from '@wordpress/compose';
import {
	PanelBody,
	RangeControl,
	G,
	SVG,
	Path,
} from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,

} from '@wordpress/block-editor';

import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';

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

export const name = 'core/columns';

function ColumnsEdit( { attributes, setAttributes, className, childColumns, updateChildColumnsAlignment } ) {
	const { columns, verticalAlignment } = attributes;

	// Do any of the child column have a valign setting that is different to what is currently
	// set on this parent Columns Block?
	const childColumnHasOveride = !! childColumns.find( ( childColumn ) => childColumn.attributes.verticalAlignment !== verticalAlignment );

	// If we have an overide then remove the setting on the parent so that the toolbar
	// no longer displays an alignment. This is inline with behaviour of user land editing
	// tools such as MS Word...etc
	if ( childColumnHasOveride ) {
		setAttributes( { verticalAlignment: null } );
	}

	const classes = classnames( className, `has-${ columns }-columns`, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const onChange = ( alignment ) => {
		// Update self...
		setAttributes( { verticalAlignment: alignment } );

		// Update all the (immediate) child Column Blocks
		updateChildColumnsAlignment( alignment );
	};

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
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ onChange }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<div className={ classes }>
				<InnerBlocks
					template={ getColumnsTemplate( columns ) }
					templateLock="all"
					allowedBlocks={ ALLOWED_BLOCKS } />
			</div>
		</Fragment>
	);
}

const EnhancedColumnsEdit = compose(
	/**
	 * Selects the child column Blocks for this parent Column
	 */
	withSelect( ( select, { clientId } ) => {
		const { getBlocksByClientId } = select( 'core/editor' );

		return {
			childColumns: getBlocksByClientId( clientId )[ 0 ].innerBlocks,
		};
	} ),
	withDispatch( ( dispatch, { childColumns } ) => {
		return {
			/**
			 * Update all child column Blocks with a new
			 * vertical alignment setting based on whatever
			 * alignment is passed in. This allows change to parent
			 * to overide anything set on a individual column basis
			 *
			 * @param  {string} alignment the vertical alignment setting
			 */
			updateChildColumnsAlignment( alignment ) {
				childColumns.forEach( ( childColumn ) => {
					dispatch( 'core/editor' ).updateBlockAttributes( childColumn.clientId, {
						verticalAlignment: alignment,
					} );
				} );
			},
		};
	} ),
)( ColumnsEdit );

export const settings = {
	title: __( 'Columns' ),

	icon: <SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><Path fill="none" d="M0 0h24v24H0V0z" /><G><Path d="M4,4H20a2,2,0,0,1,2,2V18a2,2,0,0,1-2,2H4a2,2,0,0,1-2-2V6A2,2,0,0,1,4,4ZM4 6V18H8V6Zm6 0V18h4V6Zm6 0V18h4V6Z" /></G></SVG>,

	category: 'layout',

	attributes: {
		columns: {
			type: 'number',
			default: 2,
		},
		verticalAlignment: {
			type: 'string',
		},
		childColumnHasVerticalAlignmentOveride: {
			type: 'bool',
		},
	},

	description: __( 'Add a block that displays content in multiple columns, then add whatever content blocks you’d like.' ),

	supports: {
		align: [ 'wide', 'full' ],
		html: false,
	},

	deprecated,

	edit: EnhancedColumnsEdit,

	save( { attributes } ) {
		const { columns, verticalAlignment } = attributes;

		const wrapperClasses = classnames( `has-${ columns }-columns`, {
			[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		} );

		return (
			<div className={ wrapperClasses }>
				<InnerBlocks.Content />
			</div>
		);
	},
};

