/**
 * External dependencies
 */
import classnames from 'classnames';
import { flexRender } from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

const sortIcons = { asc: chevronUp, desc: chevronDown };
function Header( { header } ) {
	if ( header.isPlaceholder ) {
		return null;
	}
	const text = flexRender(
		header.column.columnDef.header,
		header.getContext()
	);
	if ( ! header.column.getCanSort() ) {
		return text;
	}
	const sortDirection = header.column.getIsSorted();
	return (
		<Button
			onClick={ header.column.getToggleSortingHandler() }
			icon={ sortIcons[ sortDirection ] }
			iconPosition="right"
			text={ text }
			style={ { padding: 0 } }
		/>
	);
}

function ListView( { dataView, className, isLoading = false }, ref ) {
	const { rows } = dataView.getRowModel();
	const hasRows = !! rows?.length;
	if ( isLoading ) {
		// TODO:Add spinner or progress bar..
		return <h3>{ __( 'Loading' ) }</h3>;
	}
	return (
		<div className="dataviews-list-view-wrapper">
			{ hasRows && (
				<table
					ref={ ref }
					className={ classnames( 'dataviews-list-view', className ) }
				>
					<thead>
						{ dataView.getHeaderGroups().map( ( headerGroup ) => (
							<tr key={ headerGroup.id }>
								{ headerGroup.headers.map( ( header ) => (
									<th
										key={ header.id }
										colSpan={ header.colSpan }
										style={ {
											width:
												header.column.columnDef.width ||
												undefined,
											maxWidth:
												header.column.columnDef
													.maxWidth || undefined,
										} }
									>
										<Header header={ header } />
									</th>
								) ) }
							</tr>
						) ) }
					</thead>
					<tbody>
						{ rows.map( ( row ) => (
							<tr key={ row.id }>
								{ row.getVisibleCells().map( ( cell ) => (
									<td
										key={ cell.id }
										style={ {
											width:
												cell.column.columnDef.width ||
												undefined,
											maxWidth:
												cell.column.columnDef
													.maxWidth || undefined,
										} }
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
			) }
			{ ! hasRows && <p>{ __( 'no results' ) }</p> }
		</div>
	);
}

export default forwardRef( ListView );
