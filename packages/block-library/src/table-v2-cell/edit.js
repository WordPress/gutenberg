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
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	border,
	group,
	table,
	tableColumnAfter,
	tableColumnBefore,
	tableColumnDelete,
	tableRowAfter,
	tableRowBefore,
	tableRowDelete,
	ungroup,
} from '@wordpress/icons';
import { getCellPlacements } from './utils';

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

/**
 * Gets the table block clientId from a cell's clientId.
 * Walks up: cell → row → section → table.
 *
 * @param {Object} selectors Bound block editor selectors.
 * @param {string} clientId  Cell block client ID.
 * @return {string|null} Table block client ID, or null if not found.
 */
function getTableClientId( selectors, clientId ) {
	const { getBlockRootClientId, getBlockName } = selectors;
	let current = clientId;
	for ( let i = 0; i < 3; i++ ) {
		current = getBlockRootClientId( current );
		if ( ! current ) {
			return null;
		}
		if ( getBlockName( current ) === 'core/table-v2' ) {
			return current;
		}
	}
	return null;
}

/**
 * Gets the row block clientId from a cell's clientId.
 *
 * @param {Object} selectors Bound block editor selectors.
 * @param {string} clientId  Cell block client ID.
 * @return {string|null} Row block client ID, or null if not found.
 */
function getRowClientId( selectors, clientId ) {
	return selectors.getBlockRootClientId( clientId );
}

/**
 * Gets the section block clientId from a row's clientId.
 *
 * @param {Object} selectors   Bound block editor selectors.
 * @param {string} rowClientId Row block client ID.
 * @return {string|null} Section block client ID, or null if not found.
 */
function getSectionClientId( selectors, rowClientId ) {
	return selectors.getBlockRootClientId( rowClientId );
}

/**
 * Gets the rectangle of selected cells from the block tree.
 *
 * @param {Array} placements        Cell placements array.
 * @param {Array} selectedClientIds Selected cell client IDs.
 * @return {Object|null} Selection rectangle with selectedPlacements and bounds.
 */
function getSelectionRectangle( placements, selectedClientIds ) {
	const selectedPlacements = placements.filter( ( p ) =>
		selectedClientIds.includes( p.clientId )
	);

	if ( ! selectedPlacements.length ) {
		return null;
	}

	return {
		selectedPlacements,
		startRow: Math.min( ...selectedPlacements.map( ( p ) => p.rowIndex ) ),
		endRow: Math.max(
			...selectedPlacements.map( ( p ) => p.rowIndex + p.rowSpan - 1 )
		),
		startColumn: Math.min(
			...selectedPlacements.map( ( p ) => p.columnIndex )
		),
		endColumn: Math.max(
			...selectedPlacements.map( ( p ) => p.columnIndex + p.colSpan - 1 )
		),
	};
}

export default function TableCellEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { content, tag: CellTag, colSpan, rowSpan } = attributes;
	const [ selectionBorder, setSelectionBorder ] = useState(
		DEFAULT_SELECTION_BORDER
	);
	const registry = useRegistry();
	const {
		multiSelectSet,
		replaceInnerBlocks,
		selectBlock,
		updateBlockAttributes,
	} = useDispatch( blockEditorStore );

	const {
		tableClientId,
		isCellSetSelection,
		selectedClientIds,
		cellPlacements,
	} = useSelect(
		( select ) => {
			const {
				getBlockName,
				getBlockRootClientId,
				getBlocks,
				getSelectedBlockClientIds,
				getSelectionType,
			} = select( blockEditorStore );

			const tableClientIdFromStore = getTableClientId(
				select( blockEditorStore ),
				clientId
			);
			const selectionClientIds = getSelectedBlockClientIds();
			const placements = tableClientIdFromStore
				? getCellPlacements( getBlocks( tableClientIdFromStore ) )
				: [];

			return {
				tableClientId: tableClientIdFromStore,
				isCellSetSelection:
					getSelectionType() === 'set' &&
					selectionClientIds.length > 1 &&
					selectionClientIds.every(
						( selectedClientId ) =>
							getBlockName( selectedClientId ) ===
								'core/table-v2-cell' &&
							getBlockRootClientId( selectedClientId ) !== null
					),
				selectedClientIds: selectionClientIds,
				cellPlacements: placements,
			};
		},
		[ clientId ]
	);

	const selectedCellPlacement = cellPlacements.find(
		( p ) => p.clientId === clientId
	);
	const selectionRectangle = useMemo(
		() =>
			isCellSetSelection
				? getSelectionRectangle( cellPlacements, selectedClientIds )
				: null,
		[ isCellSetSelection, cellPlacements, selectedClientIds ]
	);

	// Compute selected row/column counts for plural labels.
	const selectedRowCount = useMemo( () => {
		if ( ! selectionRectangle ) {
			return 1;
		}
		return selectionRectangle.endRow - selectionRectangle.startRow + 1;
	}, [ selectionRectangle ] );

	const selectedColumnCount = useMemo( () => {
		if ( ! selectionRectangle ) {
			return 1;
		}
		return (
			selectionRectangle.endColumn - selectionRectangle.startColumn + 1
		);
	}, [ selectionRectangle ] );

	// Check if merge is possible.
	const canMerge = useMemo( () => {
		if ( ! isCellSetSelection || ! selectionRectangle ) {
			return false;
		}
		if ( selectionRectangle.selectedPlacements.length < 2 ) {
			return false;
		}
		// All selected cells must be in the same section.
		const sectionTypes = new Set(
			selectionRectangle.selectedPlacements.map( ( p ) => p.sectionType )
		);
		if ( sectionTypes.size > 1 ) {
			return false;
		}
		// No selected cell can already be merged.
		return ! selectionRectangle.selectedPlacements.some( ( p ) => {
			const cell = registry
				.select( blockEditorStore )
				.getBlock( p.clientId );
			return (
				( cell?.attributes?.rowSpan || 1 ) > 1 ||
				( cell?.attributes?.colSpan || 1 ) > 1
			);
		} );
	}, [ isCellSetSelection, selectionRectangle, registry ] );

	function onSelectRow() {
		if ( ! selectedCellPlacement ) {
			return;
		}

		const { rowIndex } = selectedCellPlacement;
		const rowCellIds = cellPlacements
			.filter(
				( p ) =>
					p.rowIndex <= rowIndex &&
					p.rowIndex + p.rowSpan - 1 >= rowIndex
			)
			.map( ( p ) => p.clientId );

		multiSelectSet( rowCellIds );
	}

	function onSelectColumn() {
		if ( ! selectedCellPlacement ) {
			return;
		}

		const { columnIndex } = selectedCellPlacement;
		const columnCellIds = cellPlacements
			.filter(
				( p ) =>
					p.columnIndex <= columnIndex &&
					p.columnIndex + p.colSpan - 1 >= columnIndex
			)
			.map( ( p ) => p.clientId );

		multiSelectSet( columnCellIds );
	}

	function onMergeCells() {
		if ( ! canMerge || ! selectionRectangle ) {
			return;
		}

		// Find the top-left cell.
		const mergedPlacement = selectionRectangle.selectedPlacements.find(
			( p ) =>
				p.rowIndex === selectionRectangle.startRow &&
				p.columnIndex === selectionRectangle.startColumn
		);
		if ( ! mergedPlacement ) {
			return;
		}

		const mergedClientId = mergedPlacement.clientId;
		const nextRowSpan =
			selectionRectangle.endRow - selectionRectangle.startRow + 1;
		const nextColSpan =
			selectionRectangle.endColumn - selectionRectangle.startColumn + 1;

		// Client IDs to remove (all selected except the merged cell).
		const removedClientIds = new Set(
			selectedClientIds.filter( ( id ) => id !== mergedClientId )
		);

		// Remove the other cells from their parent row blocks.
		const { getBlockRootClientId, getBlocks } =
			registry.select( blockEditorStore );
		const rowsToUpdate = new Map();

		for ( const clientIdToRemove of removedClientIds ) {
			const rowClientId = getBlockRootClientId( clientIdToRemove );
			if ( rowClientId ) {
				if ( ! rowsToUpdate.has( rowClientId ) ) {
					rowsToUpdate.set( rowClientId, [] );
				}
				rowsToUpdate.get( rowClientId ).push( clientIdToRemove );
			}
		}

		// Batch the span update and cell removals into a single undo level.
		registry.batch( () => {
			updateBlockAttributes( mergedClientId, {
				rowSpan: nextRowSpan,
				colSpan: nextColSpan,
			} );
			for ( const [ rowClientId, cellsToRemove ] of rowsToUpdate ) {
				const rowBlock = getBlocks( rowClientId );
				const nextCells = rowBlock.filter(
					( cell ) => ! cellsToRemove.includes( cell.clientId )
				);
				replaceInnerBlocks( rowClientId, nextCells, false );
			}
			selectBlock( mergedClientId );
		} );
	}

	function onUnmergeCells() {
		if ( rowSpan <= 1 && colSpan <= 1 ) {
			return;
		}

		const selectors = registry.select( blockEditorStore );
		const rowClientId = getRowClientId( selectors, clientId );
		if ( ! rowClientId ) {
			return;
		}
		const sectionClientId = getSectionClientId( selectors, rowClientId );
		if ( ! sectionClientId ) {
			return;
		}

		const rowBlocks = selectors.getBlocks( rowClientId );
		const cellIndex = rowBlocks.findIndex(
			( b ) => b.clientId === clientId
		);

		const sectionRows = selectors.getBlocks( sectionClientId );
		const rowIndexInSection = sectionRows.findIndex(
			( b ) => b.clientId === rowClientId
		);

		const createNewCell = () =>
			createBlock( 'core/table-v2-cell', {
				tag: CellTag,
				scope: attributes.scope,
				content: '',
			} );

		// Batch the span reset and cell insertions into a single undo level.
		registry.batch( () => {
			// The merged cell's row: reset its spans and insert new cells
			// for the remaining columns of the span. The reset goes through
			// the replacement because replaceInnerBlocks re-inserts the
			// passed blocks, and the block objects read above predate any
			// attribute update.
			const cellsToAdd = Array.from(
				{ length: colSpan - 1 },
				createNewCell
			);
			const nextCells = [
				...rowBlocks.slice( 0, cellIndex + 1 ),
				...cellsToAdd,
				...rowBlocks.slice( cellIndex + 1 ),
			].map( ( cell ) =>
				cell.clientId === clientId
					? {
							...cell,
							attributes: {
								...cell.attributes,
								rowSpan: 1,
								colSpan: 1,
							},
					  }
					: cell
			);
			replaceInnerBlocks( rowClientId, nextCells, false );

			// Subsequent rows covered by the rowSpan need new cells for
			// all columns of the span.
			for ( let rowOffset = 1; rowOffset < rowSpan; rowOffset++ ) {
				const targetRow = sectionRows[ rowIndexInSection + rowOffset ];
				if ( ! targetRow ) {
					break;
				}
				const targetRowCells = selectors.getBlocks(
					targetRow.clientId
				);
				const newRowCells = Array.from(
					{ length: colSpan },
					createNewCell
				);
				const insertIndex = Math.min(
					cellIndex,
					targetRowCells.length
				);
				const nextTargetCells = [
					...targetRowCells.slice( 0, insertIndex ),
					...newRowCells,
					...targetRowCells.slice( insertIndex ),
				];
				replaceInnerBlocks(
					targetRow.clientId,
					nextTargetCells,
					false
				);
			}
		} );
	}

	function onInsertRow( delta ) {
		if ( ! selectedCellPlacement || ! tableClientId ) {
			return;
		}
		const { rowIndex, sectionType } = selectedCellPlacement;
		const insertIndex = rowIndex + delta;

		// Find the section block for this row.
		const sections = registry
			.select( blockEditorStore )
			.getBlocks( tableClientId );
		let targetSection = null;
		let currentRowIndex = 0;

		for ( const section of sections ) {
			const sectionRows = registry
				.select( blockEditorStore )
				.getBlocks( section.clientId );
			if ( currentRowIndex + sectionRows.length > insertIndex ) {
				targetSection = section;
				break;
			}
			currentRowIndex += sectionRows.length;
		}

		if ( ! targetSection ) {
			return;
		}

		const localInsertIndex = insertIndex - currentRowIndex;
		const sectionRows = registry
			.select( blockEditorStore )
			.getBlocks( targetSection.clientId );

		// Create new row with the same number of cells as the target row.
		const columnCount =
			sectionRows[ localInsertIndex ]?.innerBlocks?.length || 2;
		const newCells = Array.from( { length: columnCount }, () =>
			createBlock( 'core/table-v2-cell', {
				tag: sectionType === 'head' ? 'th' : 'td',
				scope: sectionType === 'head' ? 'col' : undefined,
				content: '',
			} )
		);
		const newRow = createBlock( 'core/table-v2-row', {}, newCells );

		const nextRows = [
			...sectionRows.slice( 0, localInsertIndex ),
			newRow,
			...sectionRows.slice( localInsertIndex ),
		];

		replaceInnerBlocks( targetSection.clientId, nextRows, false );
	}

	function onInsertRowBefore() {
		onInsertRow( 0 );
	}

	function onInsertRowAfter() {
		onInsertRow( 1 );
	}

	function onDeleteRow() {
		if ( ! selectedCellPlacement || ! tableClientId ) {
			return;
		}

		const { rowIndex } = selectedCellPlacement;
		const endRow = rowIndex + ( rowSpan || 1 ) - 1;

		// Collect all cell clientIds in the row range.
		const cellIdsToDelete = cellPlacements
			.filter( ( p ) => p.rowIndex >= rowIndex && p.rowIndex <= endRow )
			.map( ( p ) => p.clientId );

		if ( ! cellIdsToDelete.length ) {
			return;
		}

		// Group by row block and delete.
		const { getBlockRootClientId } = registry.select( blockEditorStore );
		const rowsToDelete = new Set();

		for ( const cellId of cellIdsToDelete ) {
			const rowClientId = getBlockRootClientId( cellId );
			if ( rowClientId ) {
				rowsToDelete.add( rowClientId );
			}
		}

		registry.batch( () => {
			for ( const rowClientId of rowsToDelete ) {
				const sectionClientId = getSectionClientId(
					registry.select( blockEditorStore ),
					rowClientId
				);
				if ( sectionClientId ) {
					const sectionBlocks = registry
						.select( blockEditorStore )
						.getBlocks( sectionClientId );
					const nextBlocks = sectionBlocks.filter(
						( b ) => b.clientId !== rowClientId
					);
					replaceInnerBlocks( sectionClientId, nextBlocks, false );
				}
			}
		} );
	}

	function onInsertColumn( delta ) {
		if ( ! selectedCellPlacement || ! tableClientId ) {
			return;
		}
		const { columnIndex } = selectedCellPlacement;
		const insertIndex = columnIndex + delta;

		// Insert a cell at the same position in every row.
		const sections = registry
			.select( blockEditorStore )
			.getBlocks( tableClientId );

		registry.batch( () => {
			for ( const section of sections ) {
				const sectionRows = registry
					.select( blockEditorStore )
					.getBlocks( section.clientId );

				for ( const row of sectionRows ) {
					const rowCells = registry
						.select( blockEditorStore )
						.getBlocks( row.clientId );

					const newCell = createBlock( 'core/table-v2-cell', {
						tag: section.attributes.type === 'head' ? 'th' : 'td',
						scope:
							section.attributes.type === 'head'
								? 'col'
								: undefined,
						content: '',
					} );

					const nextCells = [
						...rowCells.slice( 0, insertIndex ),
						newCell,
						...rowCells.slice( insertIndex ),
					];

					replaceInnerBlocks( row.clientId, nextCells, false );
				}
			}
		} );
	}

	function onInsertColumnBefore() {
		onInsertColumn( 0 );
	}

	function onInsertColumnAfter() {
		onInsertColumn( 1 );
	}

	function onDeleteColumn() {
		if ( ! selectedCellPlacement || ! tableClientId ) {
			return;
		}

		const { columnIndex } = selectedCellPlacement;
		const endColumn = columnIndex + ( colSpan || 1 ) - 1;

		// Delete cells in the column range from every row.
		const sections = registry
			.select( blockEditorStore )
			.getBlocks( tableClientId );

		registry.batch( () => {
			for ( const section of sections ) {
				const sectionRows = registry
					.select( blockEditorStore )
					.getBlocks( section.clientId );

				for ( const row of sectionRows ) {
					const rowCells = registry
						.select( blockEditorStore )
						.getBlocks( row.clientId );

					const nextCells = rowCells.filter( ( cell, index ) => {
						const cellEnd =
							index + ( cell.attributes.colSpan || 1 ) - 1;
						// Remove cells that are entirely within the range.
						return (
							index < columnIndex ||
							index > endColumn ||
							cellEnd < columnIndex
						);
					} );

					replaceInnerBlocks( row.clientId, nextCells, false );
				}
			}
		} );
	}

	function applyOutsideBorder( nextBorder ) {
		const normalizedBorder = normalizeBorder( nextBorder );
		if ( ! normalizedBorder ) {
			return;
		}

		// Get all cell blocks in the selection and apply border to each.
		if ( ! selectionRectangle ) {
			return;
		}

		const updates = {};
		for ( const placement of selectionRectangle.selectedPlacements ) {
			const cell = registry
				.select( blockEditorStore )
				.getBlock( placement.clientId );
			if ( ! cell ) {
				continue;
			}

			const existingBorder = cell.attributes.style?.border || {};
			const endRow = placement.rowIndex + placement.rowSpan - 1;
			const endColumn = placement.columnIndex + placement.colSpan - 1;
			const sides = [];

			if ( placement.rowIndex === selectionRectangle.startRow ) {
				sides.push( 'top' );
			}
			if ( endColumn === selectionRectangle.endColumn ) {
				sides.push( 'right' );
			}
			if ( endRow === selectionRectangle.endRow ) {
				sides.push( 'bottom' );
			}
			if ( placement.columnIndex === selectionRectangle.startColumn ) {
				sides.push( 'left' );
			}

			const nextBorderStyle = { ...existingBorder };
			for ( const side of sides ) {
				nextBorderStyle[ side ] = normalizedBorder;
			}

			updates[ placement.clientId ] = {
				style: {
					...cell.attributes.style,
					border: nextBorderStyle,
				},
			};
		}

		if ( Object.keys( updates ).length ) {
			setSelectionBorder( normalizedBorder );
			updateBlockAttributes( Object.keys( updates ), updates, {
				uniqueByBlock: true,
			} );
		}
	}

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
			title:
				selectedRowCount > 1 ? __( 'Delete rows' ) : __( 'Delete row' ),
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
			title:
				selectedColumnCount > 1
					? __( 'Delete columns' )
					: __( 'Delete column' ),
			onClick: onDeleteColumn,
		},
	];

	let placeholder;
	if ( selectedCellPlacement?.sectionType === 'head' ) {
		placeholder = __( 'Header label' );
	} else if ( selectedCellPlacement?.sectionType === 'foot' ) {
		placeholder = __( 'Footer label' );
	}

	const blockProps = useBlockProps();

	return (
		<CellTag
			{ ...blockProps }
			colSpan={ colSpan > 1 ? colSpan : undefined }
			rowSpan={ rowSpan > 1 ? rowSpan : undefined }
		>
			<BlockControls group="other">
				{ canMerge && (
					<ToolbarButton
						icon={ group }
						label={ __( 'Merge cells' ) }
						onClick={ onMergeCells }
						showTooltip
					/>
				) }
				{ ! isCellSetSelection && ( rowSpan > 1 || colSpan > 1 ) && (
					<ToolbarButton
						icon={ ungroup }
						label={ __( 'Unmerge cells' ) }
						onClick={ onUnmergeCells }
						showTooltip
					/>
				) }
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
									enableAlpha
									enableStyle
									label={ __( 'Outside border' ) }
									onChange={ applyOutsideBorder }
									value={ selectionBorder }
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
					selectedCellPlacement?.sectionType === 'head'
						? __( 'Header cell text' )
						: selectedCellPlacement?.sectionType === 'foot'
						? __( 'Footer cell text' )
						: __( 'Body cell text' )
				}
			/>
		</CellTag>
	);
}
