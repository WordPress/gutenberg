/**
 * External dependencies
 */
import { forEach, find, difference, over } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, withDispatch } from '@wordpress/data';
import { ResizableBox } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getEffectiveColumnWidth,
	toWidthPrecision,
	getTotalColumnsWidth,
	getColumnWidths,
	getAdjacentBlocks,
	getRedistributedColumnWidths,
} from './utils';

function ColumnsResizer( {
	clientId,
	toggleSelection,
	updateBlockAttributes,
} ) {
	const [ activeResizeClientId, setActiveResizeClientId ] = useState( null );

	const { columns } = useSelect( ( select ) => ( {
		columns: select( 'core/block-editor' ).getBlocks( clientId ),
	} ), [ clientId ] );

	const classes = classnames( 'wp-block-columns__resizer', {
		'is-resizing': activeResizeClientId !== null,
	} );

	return (
		<div className={ classes }>
			{ columns.map( ( column, index ) => {
				const width = getEffectiveColumnWidth( column, columns.length );

				function onResizeStop( event, direction, element ) {
					const nextWidth = toWidthPrecision( parseFloat( element.style.width ) );
					const adjacentColumns = getAdjacentBlocks( columns, column.clientId );

					// The occupied width is calculated as the sum of the new width
					// and the total width of blocks _not_ in the adjacent set.
					const occupiedWidth = nextWidth + getTotalColumnsWidth(
						difference( columns, [
							find( columns, { clientId: column.clientId } ),
							...adjacentColumns,
						] )
					);

					// Compute _all_ next column widths, in case the updated column
					// is in the middle of a set of columns which don't yet have
					// any explicit widths assigned (include updates to those not
					// part of the adjacent blocks).
					const nextColumnWidths = {
						...getColumnWidths( columns, columns.length ),
						[ column.clientId ]: nextWidth,
						...getRedistributedColumnWidths( adjacentColumns, 100 - occupiedWidth, columns.length ),
					};

					forEach( nextColumnWidths, ( nextColumnWidth, columnClientId ) => {
						updateBlockAttributes( columnClientId, { width: nextColumnWidth } );
					} );
				}

				return (
					<ResizableBox
						key={ column.clientId }
						enable={ {
							right: index !== columns.length - 1,
						} }
						size={ { width: width + '%' } }
						axis="x"
						onResizeStart={ over( [
							() => setActiveResizeClientId( column.clientId ),
							() => toggleSelection( false ),
						] ) }
						onResizeStop={ over( [
							() => setActiveResizeClientId( null ),
							() => toggleSelection( true ),
							onResizeStop,
						] ) }
						className={ classnames(
							'wp-block-columns__resize-box',
							'is-selected',
							{ 'is-active': activeResizeClientId === column.clientId }
						) }
					/>
				);
			} ) }
		</div>
	);
}

export default withDispatch( ( dispatch ) => {
	const { updateBlockAttributes } = dispatch( 'core/block-editor' );
	return { updateBlockAttributes };
} )( ColumnsResizer );
