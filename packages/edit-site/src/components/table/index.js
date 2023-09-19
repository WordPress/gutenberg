export default function Table( { data, columns } ) {
	return (
		<div className="edit-site-table-wrapper">
			<table className="edit-site-table">
				<thead>
					<tr>
						{ columns.map( ( column ) => (
							<th key={ column.header }>{ column.header }</th>
						) ) }
					</tr>
				</thead>
				<tbody>
					{ data.map( ( row, rowIndex ) => (
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
					) ) }
				</tbody>
			</table>
		</div>
	);
}
