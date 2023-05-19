export default function Table( { data, columns } ) {
	return (
		<div className="edit-site-table-wrapper">
			<table className="edit-site-table">
				<thead>
					<tr role="row">
						{ columns.map( ( column, index ) => (
							<th
								role="columnheader"
								aria-colindex={ index + 1 }
								key={ column.header }
							>
								{ column.header }
							</th>
						) ) }
					</tr>
				</thead>
				<tbody>
					{ data.map( ( row, rowIndex ) => (
						<tr
							role="row"
							aria-rowindex={ rowIndex + 1 }
							key={ rowIndex }
						>
							{ columns.map( ( column, columnIndex ) => (
								<td
									role="gridcell"
									aria-colindex={ columnIndex + 1 }
									style={ {
										maxWidth: column.maxWidth
											? column.maxWidth
											: 'none',
									} }
									key={ columnIndex }
								>
									{ column.cell( row ) }
								</td>
							) ) }
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
}
