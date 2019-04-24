/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import {
	PanelBody,
	RangeControl,
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
import { getColumnsTemplate } from './utils';

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

export const ColumnsEdit = function( { attributes, setAttributes, className, updateAlignment } ) {
	const { columns, verticalAlignment } = attributes;

	const classes = classnames( className, `has-${ columns }-columns`, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const onChange = ( alignment ) => {
		// Update all the (immediate) child Column Blocks
		updateAlignment( alignment );
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
};

const DEFAULT_EMPTY_ARRAY = [];

export default compose(
	/**
	 * Selects the child column Blocks for this parent Column
	 */
	withSelect( ( select, { clientId } ) => {
		const { getBlocksByClientId } = select( 'core/editor' );
		const block = getBlocksByClientId( clientId )[ 0 ];

		return {
			childColumns: block ? block.innerBlocks : DEFAULT_EMPTY_ARRAY,
		};
	} ),
	withDispatch( ( dispatch, { clientId, childColumns } ) => {
		return {
			/**
			 * Update all child column Blocks with a new
			 * vertical alignment setting based on whatever
			 * alignment is passed in. This allows change to parent
			 * to overide anything set on a individual column basis
			 *
			 * @param  {string} alignment the vertical alignment setting
			 */
			updateAlignment( alignment ) {
				// Update self...
				dispatch( 'core/editor' ).updateBlockAttributes( clientId, {
					verticalAlignment: alignment,
				} );

				// Update all child Column Blocks to match
				childColumns.forEach( ( childColumn ) => {
					dispatch( 'core/editor' ).updateBlockAttributes( childColumn.clientId, {
						verticalAlignment: alignment,
					} );
				} );
			},
		};
	} ),
)( ColumnsEdit );
