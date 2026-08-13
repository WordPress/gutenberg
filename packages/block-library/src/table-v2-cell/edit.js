import {
	BlockControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	BorderControl,
	Dropdown,
	ToolbarButton,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	border,
	table,
	tableColumnAfter,
	tableColumnBefore,
	tableColumnDelete,
	tableRowAfter,
	tableRowBefore,
	tableRowDelete,
} from '@wordpress/icons';
import {
	deleteColumn,
	deleteRow,
	getCellLocation,
	getCellPlacements,
	getCellSelectionOutsideBorderAttributes,
	getCellSelectionOutsideBorderValue,
	insertColumn,
	insertRow,
} from '../table-v2/utils';

const DEFAULT_SELECTION_BORDER = {
	color: '#000000',
	style: 'solid',
	width: '1px',
};

function normalizeBorder( nextBorder ) {
	if ( ! nextBorder ) {
		return null;
	}

	return {
		...nextBorder,
		style:
			nextBorder.style ||
			( nextBorder.color || nextBorder.width ? 'solid' : undefined ),
	};
}

export default function TableCellEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { content, tag: CellTag } = attributes;
	const [ selectionBorder, setSelectionBorder ] = useState(
		DEFAULT_SELECTION_BORDER
	);
	const registry = useRegistry();
	const { multiSelectSet, replaceInnerBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const {
		columnCount,
		isCellSetSelection,
		parentClientId,
		rows,
		selectedClientIds,
		siblingCells,
	} = useSelect(
		( select ) => {
			const {
				getBlock,
				getBlockName,
				getBlockRootClientId,
				getBlocks,
				getSelectedBlockClientIds,
				getSelectionType,
			} = select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );
			const parentBlock = rootClientId ? getBlock( rootClientId ) : null;
			const selectionClientIds = getSelectedBlockClientIds();

			return {
				columnCount: parentBlock?.attributes?.columnCount || 0,
				isCellSetSelection:
					getSelectionType() === 'set' &&
					selectionClientIds.length > 1 &&
					selectionClientIds.every(
						( selectedClientId ) =>
							getBlockName( selectedClientId ) ===
								'core/table-v2-cell' &&
							getBlockRootClientId( selectedClientId ) ===
								rootClientId
					),
				parentClientId: rootClientId,
				rows: parentBlock?.attributes?.rows || [],
				selectedClientIds: selectionClientIds,
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
	const selectedOutsideBorder = getCellSelectionOutsideBorderValue(
		rows,
		siblingCells,
		columnCount,
		selectedClientIds
	);

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

		let startRow = selectedCellLocation.rowIndex;
		let endRow = selectedCellLocation.rowIndex;

		if ( isCellSetSelection ) {
			const selectedPlacements = cellPlacements.filter( ( placement ) =>
				selectedClientIds.includes( placement.cell.clientId )
			);
			if ( selectedPlacements.length ) {
				startRow = Math.min(
					...selectedPlacements.map( ( p ) => p.rowIndex )
				);
				endRow = Math.max(
					...selectedPlacements.map( ( p ) => p.rowIndex )
				);
			}
		}

		const rowCellIds = cellPlacements
			.filter(
				( placement ) =>
					placement.rowIndex >= startRow &&
					placement.rowIndex <= endRow
			)
			.map( ( placement ) => placement.cell.clientId );

		multiSelectSet( rowCellIds );
	}

	function onSelectColumn() {
		if ( ! selectedCellLocation ) {
			return;
		}

		let startColumn = selectedCellLocation.columnIndex;
		let endColumn = selectedCellLocation.columnIndex;

		if ( isCellSetSelection ) {
			const selectedPlacements = cellPlacements.filter( ( placement ) =>
				selectedClientIds.includes( placement.cell.clientId )
			);
			if ( selectedPlacements.length ) {
				startColumn = Math.min(
					...selectedPlacements.map( ( p ) => p.columnIndex )
				);
				endColumn = Math.max(
					...selectedPlacements.map( ( p ) => p.columnIndex )
				);
			}
		}

		const columnCellIds = cellPlacements
			.filter(
				( placement ) =>
					placement.columnIndex >= startColumn &&
					placement.columnIndex <= endColumn
			)
			.map( ( placement ) => placement.cell.clientId );

		multiSelectSet( columnCellIds );
	}

	function applyOutsideBorder( nextBorder ) {
		const normalizedBorder = normalizeBorder( nextBorder );
		if ( ! normalizedBorder ) {
			return;
		}

		const updates = getCellSelectionOutsideBorderAttributes(
			rows,
			siblingCells,
			columnCount,
			selectedClientIds,
			normalizedBorder
		);

		if ( ! Object.keys( updates ).length ) {
			return;
		}

		setSelectionBorder( normalizedBorder );
		updateBlockAttributes( Object.keys( updates ), updates, {
			uniqueByBlock: true,
		} );
	}

	const selectedRowCount = useMemo( () => {
		if ( ! isCellSetSelection ) {
			return 1;
		}
		const selectedPlacements = cellPlacements.filter( ( placement ) =>
			selectedClientIds.includes( placement.cell.clientId )
		);
		if ( ! selectedPlacements.length ) {
			return 1;
		}
		const minRow = Math.min(
			...selectedPlacements.map( ( p ) => p.rowIndex )
		);
		const maxRow = Math.max(
			...selectedPlacements.map( ( p ) => p.rowIndex )
		);
		return maxRow - minRow + 1;
	}, [ isCellSetSelection, cellPlacements, selectedClientIds ] );

	const selectedColumnCount = useMemo( () => {
		if ( ! isCellSetSelection ) {
			return 1;
		}
		const selectedPlacements = cellPlacements.filter( ( placement ) =>
			selectedClientIds.includes( placement.cell.clientId )
		);
		if ( ! selectedPlacements.length ) {
			return 1;
		}
		const minColumn = Math.min(
			...selectedPlacements.map( ( p ) => p.columnIndex )
		);
		const maxColumn = Math.max(
			...selectedPlacements.map( ( p ) => p.columnIndex )
		);
		return maxColumn - minColumn + 1;
	}, [ isCellSetSelection, cellPlacements, selectedClientIds ] );

	const tableControls = [
		{
			icon: tableRowAfter,
			title:
				selectedRowCount > 1 ? __( 'Select rows' ) : __( 'Select row' ),
			onClick: onSelectRow,
		},
		{
			icon: tableColumnAfter,
			title:
				selectedColumnCount > 1
					? __( 'Select columns' )
					: __( 'Select column' ),
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
				{ isCellSetSelection && (
					<Dropdown
						popoverProps={ { placement: 'bottom-start' } }
						renderToggle={ ( { isOpen, onToggle } ) => (
							<ToolbarButton
								aria-expanded={ isOpen }
								icon={ border }
								label={ __( 'Outside border' ) }
								onClick={ onToggle }
								showTooltip
							/>
						) }
						renderContent={ () => (
							<div style={ { padding: '16px', width: '360px' } }>
								<BorderControl
									__next40pxDefaultSize
									enableAlpha
									enableStyle
									label={ __( 'Outside border' ) }
									onChange={ applyOutsideBorder }
									value={
										selectedOutsideBorder || selectionBorder
									}
									withSlider
								/>
							</div>
						) }
					/>
				) }
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
