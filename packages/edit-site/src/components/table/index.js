/**
 * External dependencies
 */
import { flexRender } from '@tanstack/react-table';

/**
 * @param {Object}                                         props       The props.
 * @param {import('@tanstack/react-table').Table<unknown>} props.table The table created from `@tanstack/react-table`.
 */
export default function Table( { table } ) {
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
				</tbody>
			</table>
		</div>
	);
}
