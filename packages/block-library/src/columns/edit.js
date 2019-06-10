/**
 * External dependencies
 */
import classnames from 'classnames';
import { dropRight, forEach, find, difference } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
import { withDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getColumnsTemplate,
	hasExplicitColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
	getTotalColumnsWidth,
	getColumnWidths,
	getAdjacentBlocks,
} from './utils';

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
	clientId,
	attributes,
	className,
	updateAlignment,
	updateColumns,
	updateColumnWidth,
} ) {
	const { columns, verticalAlignment } = attributes;

	const classes = classnames( className, `has-${ columns }-columns`, {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const columnBlocks = useSelect( ( select ) => (
		select( 'core/block-editor' ).getBlocks( clientId )
	) );

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
				<PanelBody title={ __( 'Column Settings' ) }>
					{ columnBlocks.map( ( columnBlock, index ) => (
						<fieldset
							key={ columnBlock.clientId }
							className="wp-block-columns__column-settings-column"
						>
							<legend>{ sprintf( __( 'Column %d' ), index + 1 ) }</legend>
							<RangeControl
								label={ __( 'Percentage width' ) }
								value={ columnBlock.attributes.width || '' }
								onChange={ ( nextWidth ) => {
									updateColumnWidth( columnBlock.clientId, nextWidth );
								} }
								min={ 0 }
								max={ 100 }
								required
								allowReset
							/>
						</fieldset>
					) ) }
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
	 * @param {string} clientId Client ID of column block for which to update
	 *                          width attribute.
	 * @param {number} columns  New column count.
	 */
	updateColumns( clientId, columns ) {
		const { setAttributes, attributes } = ownProps;
		const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
		const { getBlocks } = registry.select( 'core/block-editor' );

		// Update columns count.
		setAttributes( { columns } );

		let innerBlocks = getBlocks( clientId );
		if ( ! hasExplicitColumnWidths( innerBlocks ) ) {
			return;
		}

		// Redistribute available width for existing inner blocks.
		const { columns: previousColumns } = attributes;
		const isAddingColumn = columns > previousColumns;

		if ( isAddingColumn ) {
			// If adding a new column, assign width to the new column equal to
			// as if it were `1 / columns` of the total available space.
			const newColumnWidth = toWidthPrecision( 100 / columns );

			// Redistribute in consideration of pending block insertion as
			// constraining the available working width.
			const widths = getRedistributedColumnWidths( innerBlocks, 100 - newColumnWidth );

			innerBlocks = [
				...getMappedColumnWidths( innerBlocks, widths ),
				createBlock( 'core/column', {
					width: newColumnWidth,
				} ),
			];
		} else {
			// The removed column will be the last of the inner blocks.
			innerBlocks = dropRight( innerBlocks );

			// Redistribute as if block is already removed.
			const widths = getRedistributedColumnWidths( innerBlocks, 100 );

			innerBlocks = getMappedColumnWidths( innerBlocks, widths );
		}

		replaceInnerBlocks( clientId, innerBlocks, false );
	},

	updateColumnWidth( clientId, width ) {
		const { updateBlockAttributes } = dispatch( 'core/block-editor' );
		const { getBlockRootClientId, getBlocks } = registry.select( 'core/block-editor' );

		// Constrain or expand siblings to account for gain or loss of
		// total columns area.
		const columns = getBlocks( getBlockRootClientId( clientId ) );
		const adjacentColumns = getAdjacentBlocks( columns, clientId );

		// The occupied width is calculated as the sum of the new width
		// and the total width of blocks _not_ in the adjacent set.
		const occupiedWidth = width + getTotalColumnsWidth(
			difference( columns, [
				find( columns, { clientId } ),
				...adjacentColumns,
			] )
		);

		// Compute _all_ next column widths, in case the updated column
		// is in the middle of a set of columns which don't yet have
		// any explicit widths assigned (include updates to those not
		// part of the adjacent blocks).
		const nextColumnWidths = {
			...getColumnWidths( columns, columns.length ),
			[ clientId ]: toWidthPrecision( width ),
			...getRedistributedColumnWidths( adjacentColumns, 100 - occupiedWidth, columns.length ),
		};

		forEach( nextColumnWidths, ( nextColumnWidth, columnClientId ) => {
			updateBlockAttributes( columnClientId, { width: nextColumnWidth } );
		} );
	},
} ) )( ColumnsEdit );
