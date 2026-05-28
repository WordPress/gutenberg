/**
 * WordPress dependencies
 */
import {
	BlockControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	table,
	tableColumnAfter,
	tableColumnBefore,
	tableColumnDelete,
	tableRowAfter,
	tableRowBefore,
	tableRowDelete,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import {
	deleteColumn,
	deleteRow,
	getCellLocation,
	getCellPlacements,
	insertColumn,
	insertRow,
} from '../table-v2/utils';

export default function TableCellEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { content, tag: CellTag } = attributes;
	const registry = useRegistry();
	const { multiSelectSet, replaceInnerBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const { columnCount, parentClientId, rows, siblingCells } = useSelect(
		( select ) => {
			const { getBlock, getBlockRootClientId, getBlocks } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const parentBlock = rootClientId ? getBlock( rootClientId ) : null;

			return {
				columnCount: parentBlock?.attributes?.columnCount || 0,
				parentClientId: rootClientId,
				rows: parentBlock?.attributes?.rows || [],
				siblingCells: rootClientId ? getBlocks( rootClientId ) : [],
			};
		},
		[ clientId ]
	);

	const selectedCellLocation = getCellLocation(
		rows,
		siblingCells,
		columnCount,
		clientId
	);
	const cellPlacements = getCellPlacements( rows, siblingCells, columnCount );

	function replaceTable( nextTable, nextColumnCount = columnCount ) {
		if ( ! parentClientId ) {
			return;
		}
		registry.batch( () => {
			updateBlockAttributes( parentClientId, {
				columnCount: nextColumnCount,
				rows: nextTable.rows,
			} );
			replaceInnerBlocks( parentClientId, nextTable.cells, false );
		} );
	}

	function onInsertRow( delta ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		const { rowIndex, rowType } = selectedCellLocation;
		replaceTable(
			insertRow( rows, siblingCells, {
				rowIndex: rowIndex + delta,
				type: rowType,
				columnCount,
			} )
		);
	}

	function onInsertRowBefore() {
		onInsertRow( 0 );
	}

	function onInsertRowAfter() {
		onInsertRow( 1 );
	}

	function onDeleteRow() {
		if ( ! selectedCellLocation ) {
			return;
		}
		replaceTable(
			deleteRow( rows, siblingCells, {
				rowIndex: selectedCellLocation.rowIndex,
			} )
		);
	}

	function onInsertColumn( delta ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		replaceTable(
			insertColumn( rows, siblingCells, {
				columnIndex: selectedCellLocation.columnIndex + delta,
			} ),
			columnCount + 1
		);
	}

	function onInsertColumnBefore() {
		onInsertColumn( 0 );
	}

	function onInsertColumnAfter() {
		onInsertColumn( 1 );
	}

	function onDeleteColumn() {
		if ( ! selectedCellLocation || columnCount <= 1 ) {
			return;
		}
		replaceTable(
			deleteColumn( rows, siblingCells, {
				columnIndex: selectedCellLocation.columnIndex,
			} ),
			columnCount - 1
		);
	}

	function onSelectRow() {
		if ( ! selectedCellLocation ) {
			return;
		}

		const { rowIndex } = selectedCellLocation;
		const rowCellIds = cellPlacements
			.filter( ( placement ) => placement.rowIndex === rowIndex )
			.map( ( placement ) => placement.cell.clientId );

		multiSelectSet( rowCellIds );
	}

	function onSelectColumn() {
		if ( ! selectedCellLocation ) {
			return;
		}

		const { columnIndex } = selectedCellLocation;
		const columnCellIds = cellPlacements
			.filter( ( placement ) => placement.columnIndex === columnIndex )
			.map( ( placement ) => placement.cell.clientId );

		multiSelectSet( columnCellIds );
	}

	const tableControls = [
		{
			icon: tableRowAfter,
			title: __( 'Select row' ),
			onClick: onSelectRow,
		},
		{
			icon: tableColumnAfter,
			title: __( 'Select column' ),
			onClick: onSelectColumn,
		},
		{
			icon: tableRowBefore,
			title: __( 'Insert row before' ),
			onClick: onInsertRowBefore,
		},
		{
			icon: tableRowAfter,
			title: __( 'Insert row after' ),
			onClick: onInsertRowAfter,
		},
		{
			icon: tableRowDelete,
			title: __( 'Delete row' ),
			onClick: onDeleteRow,
		},
		{
			icon: tableColumnBefore,
			title: __( 'Insert column before' ),
			onClick: onInsertColumnBefore,
		},
		{
			icon: tableColumnAfter,
			title: __( 'Insert column after' ),
			onClick: onInsertColumnAfter,
		},
		{
			icon: tableColumnDelete,
			title: __( 'Delete column' ),
			onClick: onDeleteColumn,
		},
	];

	let placeholder;
	if ( selectedCellLocation?.rowType === 'head' ) {
		placeholder = __( 'Header label' );
	} else if ( selectedCellLocation?.rowType === 'foot' ) {
		placeholder = __( 'Footer label' );
	}

	const blockProps = useBlockProps();

	return (
		<CellTag { ...blockProps }>
			<BlockControls group="other">
				<ToolbarDropdownMenu
					icon={ table }
					label={ __( 'Edit table' ) }
					controls={ tableControls }
				/>
			</BlockControls>
			<RichText
				tagName="div"
				className="wp-block-table-v2-cell__content"
				value={ content }
				onChange={ ( value ) => setAttributes( { content: value } ) }
				placeholder={ placeholder }
				aria-label={
					// eslint-disable-next-line no-nested-ternary
					selectedCellLocation?.rowType === 'head'
						? __( 'Header cell text' )
						: selectedCellLocation?.rowType === 'foot'
						? __( 'Footer cell text' )
						: __( 'Body cell text' )
				}
			/>
		</CellTag>
	);
}
