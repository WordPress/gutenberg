/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	RichText,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	alignCenter,
	alignLeft,
	alignRight,
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
	getGridDimensions,
	getSelectedCellLocation,
	insertColumn,
	insertRow,
	sortCells,
} from '../table-v2/utils';

const ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		title: __( 'Align column left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align column center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align column right' ),
		align: 'right',
	},
];

export default function TableCellEdit( {
	attributes,
	setAttributes,
	clientId,
} ) {
	const { content, tag: CellTag, section, align } = attributes;
	const registry = useRegistry();
	const { multiSelectSet, replaceInnerBlocks, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const { parentClientId, siblingCells } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getBlocks } =
				select( blockEditorStore );
			const rootClientId = getBlockRootClientId( clientId );

			return {
				parentClientId: rootClientId,
				siblingCells: rootClientId ? getBlocks( rootClientId ) : [],
			};
		},
		[ clientId ]
	);

	const selectedCellLocation = getSelectedCellLocation(
		siblingCells,
		clientId
	);
	const { columnCount } = getGridDimensions( siblingCells );

	function replaceTableCells( newCells ) {
		if ( ! parentClientId ) {
			return;
		}
		replaceInnerBlocks( parentClientId, sortCells( newCells ), false );
	}

	function onInsertRow( delta ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		const { section: selectedSection, row } = selectedCellLocation;
		replaceTableCells(
			insertRow( siblingCells, {
				section: selectedSection,
				rowIndex: row + delta,
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
		replaceTableCells(
			deleteRow( siblingCells, {
				section: selectedCellLocation.section,
				rowIndex: selectedCellLocation.row,
			} )
		);
	}

	function onInsertColumn( delta ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		replaceTableCells(
			insertColumn( siblingCells, {
				columnIndex: selectedCellLocation.column + delta,
			} )
		);
	}

	function onInsertColumnBefore() {
		onInsertColumn( 0 );
	}

	function onInsertColumnAfter() {
		onInsertColumn( 1 );
	}

	function onDeleteColumn() {
		if ( ! selectedCellLocation ) {
			return;
		}
		replaceTableCells(
			deleteColumn( siblingCells, {
				columnIndex: selectedCellLocation.column,
			} )
		);
	}

	function onChangeColumnAlignment( nextAlign ) {
		if ( ! selectedCellLocation ) {
			return;
		}
		const { column } = selectedCellLocation;
		registry.batch( () => {
			for ( const cell of siblingCells ) {
				if ( cell.attributes.column === column ) {
					updateBlockAttributes( cell.clientId, {
						align: nextAlign,
					} );
				}
			}
		} );
	}

	function onSelectRow() {
		if ( ! selectedCellLocation ) {
			return;
		}

		const { section: selectedSection, row } = selectedCellLocation;
		const rowCellIds = sortCells(
			siblingCells.filter(
				( cell ) =>
					cell.attributes.section === selectedSection &&
					cell.attributes.row === row
			)
		).map( ( cell ) => cell.clientId );

		multiSelectSet( rowCellIds );
	}

	function onSelectColumn() {
		if ( ! selectedCellLocation ) {
			return;
		}

		const { column } = selectedCellLocation;
		const columnCellIds = sortCells(
			siblingCells.filter( ( cell ) => cell.attributes.column === column )
		).map( ( cell ) => cell.clientId );

		multiSelectSet( columnCellIds );
	}

	function getColumnAlignment() {
		if ( ! selectedCellLocation ) {
			return undefined;
		}
		const cell = siblingCells.find(
			( siblingCell ) =>
				siblingCell.attributes.column === selectedCellLocation.column
		);
		return cell?.attributes?.align;
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
	if ( section === 'head' ) {
		placeholder = __( 'Header label' );
	} else if ( section === 'foot' ) {
		placeholder = __( 'Footer label' );
	}

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ align }` ]: align,
		} ),
	} );

	return (
		<CellTag { ...blockProps }>
			<BlockControls group="block">
				<AlignmentControl
					label={ __( 'Change column alignment' ) }
					alignmentControls={ ALIGNMENT_CONTROLS }
					value={ getColumnAlignment() }
					onChange={ onChangeColumnAlignment }
				/>
			</BlockControls>
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
					section === 'head'
						? __( 'Header cell text' )
						: section === 'foot'
						? __( 'Footer cell text' )
						: __( 'Body cell text' )
				}
			/>
		</CellTag>
	);
}
