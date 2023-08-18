/**
 * External dependencies
 */
import {
	useReactTable,
	flexRender,
	getCoreRowModel,
} from '@tanstack/react-table';

export default function Table( { data, columns, tableOptions } ) {
	const table = useReactTable( {
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		...tableOptions,
	} );

	return (
		<div className="edit-site-table-wrapper">
			<table className="edit-site-table">
				<thead>
					{ table.getHeaderGroups().map( ( headerGroup ) => (
						<tr key={ headerGroup.id }>
							{ headerGroup.headers.map( ( header ) => (
								<th key={ header.id }>
									{ header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext()
										  ) }
								</th>
							) ) }
						</tr>
					) ) }
					{ /* <tr>
						{ columns.map( ( column ) => (
							<th key={ column.header }>{ column.header }</th>
						) ) }
					</tr> */ }
				</thead>
				<tbody>
					{ table.getRowModel().rows.map( ( row ) => (
						<tr key={ row.id }>
							{ row.getVisibleCells().map( ( cell ) => (
								<td
									style={ {
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
					{ /* { data.map( ( row, rowIndex ) => (
						<tr key={ rowIndex }>
							{ columns.map( ( column, columnIndex ) => (
								<td
									style={ {
										maxWidth: column.maxWidth
											? column.maxWidth
											: undefined,
									} }
									key={ columnIndex }
								>
									{ column.cell( row ) }
								</td>
							) ) }
						</tr>
					) ) } */ }
				</tbody>
			</table>
		</div>
	);
}
