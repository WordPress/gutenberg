/**
 * External dependencies
 */
import classnames from 'classnames';
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import { withDispatch } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

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

export function ColumnsEdit( {
	attributes,
	className,
	updateAlignment,
	updateColumns,
} ) {
	const { columns, verticalAlignment } = attributes;

	const classes = classnames( className, `has-${ columns }-columns`, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<>
			<InspectorControls>
				<PanelBody>
					<RangeControl
						label={ __( 'Columns' ) }
						value={ columns }
						onChange={ updateColumns }
						min={ 2 }
						max={ 6 }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<div className={ classes }>
				<InnerBlocks
					template={ getColumnsTemplate( columns ) }
					templateLock="all"
					allowedBlocks={ ALLOWED_BLOCKS } />
			</div>
		</>
	);
}

export default withDispatch( ( dispatch, ownProps, registry ) => ( {
	/**
	 * Update all child Column blocks with a new vertical alignment setting
	 * based on whatever alignment is passed in. This allows change to parent
	 * to overide anything set on a individual column basis.
	 *
	 * @param {string} verticalAlignment the vertical alignment setting
	 */
	updateAlignment( verticalAlignment ) {
		const { clientId, setAttributes } = ownProps;
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );
		const { getBlockOrder } = registry.select( 'core/block-editor' );

		// Update own alignment.
		setAttributes( { verticalAlignment } );

		// Update all child Column Blocks to match
		const innerBlockClientIds = getBlockOrder( clientId );
		innerBlockClientIds.forEach( ( innerBlockClientId ) => {
			updateBlockAttributes( innerBlockClientId, {
				verticalAlignment,
			} );
		} );
	},

	/**
	 * Updates the column count, including necessary revisions to child Column
	 * blocks to grant required or redistribute available space.
	 *
	 * @param {number} columns New column count.
	 */
	updateColumns( columns ) {
		const { clientId, setAttributes, attributes } = ownProps;
		const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
		const { getBlocks } = registry.select( 'core/block-editor' );

		// Update columns count.
		setAttributes( { columns } );

		let innerBlocks = getBlocks( clientId );
		const hasExplicitColumnWidths = innerBlocks.some( ( innerBlock ) => (
			innerBlock.attributes.width !== undefined
		) );

		let newOrRemovedColumnWidth;
		if ( ! hasExplicitColumnWidths ) {
			return;
		}

		// Redistribute available width for existing inner blocks.
		const { columns: previousColumns } = attributes;
		const isAddingColumn = columns > previousColumns;

		if ( isAddingColumn ) {
			// If adding a new column, assign width to the new column equal to
			// as if it were `1 / columns` of the total available space.
			newOrRemovedColumnWidth = ( 100 / columns );
		} else {
			// The removed column will be the last of the inner blocks.
			newOrRemovedColumnWidth = last( innerBlocks ).attributes.width || ( 100 / previousColumns );
		}

		const adjustment = newOrRemovedColumnWidth / ( isAddingColumn ? -1 * previousColumns : columns );
		innerBlocks = innerBlocks.map( ( innerBlock ) => {
			const { width: columnWidth = ( 100 / previousColumns ) } = innerBlock.attributes;
			return {
				...innerBlock,
				attributes: {
					...innerBlocks.attributes,
					width: parseFloat( ( columnWidth + adjustment ).toFixed( 2 ) ),
				},
			};
		} );

		// Explicitly manage the new column block, since template would not
		// account for the explicitly assigned width.
		if ( isAddingColumn ) {
			const block = createBlock( 'core/column', {
				width: parseFloat( newOrRemovedColumnWidth.toFixed( 2 ) ),
			} );

			innerBlocks = [ ...innerBlocks, block ];
		}

		replaceInnerBlocks( clientId, innerBlocks, false );
	},
} ) )( ColumnsEdit );
