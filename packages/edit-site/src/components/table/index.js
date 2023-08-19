/**
 * External dependencies
 */
import { flexRender } from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import { Button, Icon } from '@wordpress/components';
import { chevronUp, chevronDown } from '@wordpress/icons';

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
		<Button onClick={ header.column.getToggleSortingHandler() }>
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
 * @param {Object} props
 * @param {Table}  props.table
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
