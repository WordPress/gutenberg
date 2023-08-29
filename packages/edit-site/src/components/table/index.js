/**
 * External dependencies
 */
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	createColumnHelper,
} from '@tanstack/react-table';
import cx from 'classnames';

/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { chevronUp, chevronDown } from '@wordpress/icons';

/** @type {import('@tanstack/react-table').ColumnHelper<unknown>} */
const columnHelper = createColumnHelper();

/**
 * @typedef {import('@tanstack/react-table').Header<unknown, unknown>} Header
 * @typedef {import('@tanstack/react-table').Table<unknown>} Table
 */

/**
 * @param {Object} props
 * @param {Header} props.header
 */
function HeaderColumn( { header } ) {
	if ( header.isPlaceholder ) return null;

	const rendered = flexRender(
		header.column.columnDef.header,
		header.getContext()
	);

	if ( ! header.column.getCanSort() ) {
		return rendered;
	}

	return (
		<Button
			className="edit-site-table-header__button"
			onClick={ header.column.getToggleSortingHandler() }
		>
			{ rendered }
			{ !! header.column.getIsSorted() && (
				<Icon
					icon={
						header.column.getIsSorted() === 'asc'
							? chevronUp
							: chevronDown
					}
				/>
			) }
		</Button>
	);
}

/**
 * @param {Object}  props
 * @param {string}  props.className
 * @param {Array}   props.data
 * @param {Array}   props.columns
 * @param {string}  props.rowId
 * @param {boolean} props.enableSorting
 */
export default function Table( {
	data,
	columns,
	rowId,
	enableSorting = false,
	className,
	...props
} ) {
	const tableRows = columns.map( ( { accessor = null, cell, ...rest } ) => {
		const column = {
			cell: ( cellProps ) =>
				cell( {
					value: cellProps.getValue(),
					row: cellProps.row.original,
				} ),
			...rest,
		};

		if ( accessor ) {
			return columnHelper.accessor( accessor, column );
		}

		return columnHelper.display( column );
	} );

	const table = useReactTable( {
		data,
		columns: tableRows,
		getRowId: ( row ) => row[ rowId ],
		getCoreRowModel: getCoreRowModel(),
		enableSorting,
	} );

	return (
		<div
			className={ cx( 'edit-site-table-wrapper', className ) }
			{ ...props }
		>
			<table className="edit-site-table">
				<thead>
					{ table.getHeaderGroups().map( ( headerGroup ) => (
						<tr key={ headerGroup.id }>
							{ headerGroup.headers.map( ( header ) => (
								<th
									style={ {
										width:
											header.column.columnDef.width ||
											undefined,
										maxWidth:
											header.column.columnDef.maxWidth ||
											undefined,
									} }
									key={ header.id }
								>
									<HeaderColumn header={ header } />
								</th>
							) ) }
						</tr>
					) ) }
				</thead>
				<tbody>
					{ table.getRowModel().rows.map( ( row ) => (
						<tr
							key={ row.id }
							style={ {
								// TODO: More generic way of dimming row.
								opacity: row.original.id ? 1 : 0.5,
							} }
						>
							{ row.getVisibleCells().map( ( cell ) => (
								<td
									style={ {
										width:
											cell.column.columnDef.width ||
											undefined,
										maxWidth:
											cell.column.columnDef.maxWidth ||
											undefined,
									} }
									key={ cell.id }
								>
									{ flexRender(
										cell.column.columnDef.cell,
										cell.getContext()
									) }
								</td>
							) ) }
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
}
