/**
 * External dependencies
 */
import classnames from 'classnames';
import { flexRender } from '@tanstack/react-table';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	chevronDown,
	chevronUp,
	unseen,
	check,
	arrowUp,
	arrowDown,
} from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	DropdownMenuV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	DropdownMenuSeparatorV2,
} = unlock( componentsPrivateApis );

const sortingItemsInfo = {
	asc: { icon: arrowUp, label: __( 'Sort ascending' ) },
	desc: { icon: arrowDown, label: __( 'Sort descending' ) },
};
const sortIcons = { asc: chevronUp, desc: chevronDown };
function HeaderMenu( { dataView, header } ) {
	if ( header.isPlaceholder ) {
		return null;
	}
	const text = flexRender(
		header.column.columnDef.header,
		header.getContext()
	);
	const isSortable = !! header.column.getCanSort();
	const isHidable = !! header.column.getCanHide();
	if ( ! isSortable && ! isHidable ) {
		return text;
	}
	const sortedDirection = header.column.getIsSorted();
	return (
		<DropdownMenuV2
			align="start"
			trigger={
				<Button
					icon={ sortIcons[ header.column.getIsSorted() ] }
					iconPosition="right"
					text={ text }
					style={ { padding: 0 } }
				/>
			}
		>
			{ isSortable && (
				<DropdownMenuGroupV2>
					{ Object.entries( sortingItemsInfo ).map(
						( [ direction, info ] ) => (
							<DropdownMenuItemV2
								key={ direction }
								prefix={ <Icon icon={ info.icon } /> }
								suffix={
									sortedDirection === direction && (
										<Icon icon={ check } />
									)
								}
								onSelect={ ( event ) => {
									event.preventDefault();
									if ( sortedDirection === direction ) {
										dataView.resetSorting();
									} else {
										dataView.setSorting( [
											{
												id: header.column.id,
												desc: direction === 'desc',
											},
										] );
									}
								} }
							>
								{ info.label }
							</DropdownMenuItemV2>
						)
					) }
				</DropdownMenuGroupV2>
			) }
			{ isSortable && isHidable && <DropdownMenuSeparatorV2 /> }
			{ isHidable && (
				<DropdownMenuItemV2
					prefix={ <Icon icon={ unseen } /> }
					onSelect={ ( event ) => {
						event.preventDefault();
						header.column.getToggleVisibilityHandler()( event );
					} }
				>
					{ __( 'Hide' ) }
				</DropdownMenuItemV2>
			) }
		</DropdownMenuV2>
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
										<HeaderMenu
											dataView={ dataView }
											header={ header }
										/>
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
