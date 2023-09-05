/**
 * WordPress dependencies
 */
import {
	Button,
	SelectControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDataTableContext } from './context';

// type DataTablePaginationProps = {
// 	className?: string;
// 	totalItems: number;
// };

export function DataTablePaginationTotalItems( {
	// If passed, use it as it's for controlled pagination.
	totalItems = 0,
} ) {
	const table = useDataTableContext();
	return (
		<span>
			{ sprintf(
				// translators: %s: Total number of items id lists.
				__( '%s items' ),
				totalItems || table.getCoreRowModel().rows.length
			) }
		</span>
	);
}

export function DataTablePaginationNumbers() {
	const midSize = 2;
	const endSize = 1;
	const table = useDataTableContext();
	const totalPages = table.getPageCount();
	const currentPage = table.getState().pagination.pageIndex + 1;
	if ( ! totalPages ) {
		return null;
	}
	const pageLinks = [];
	let dots = false;
	for ( let i = 1; i <= totalPages; i++ ) {
		const isActive = i === currentPage;
		if ( isActive ) {
			pageLinks.push(
				<Button
					key={ i }
					className="current"
					disabled={ true }
					text={ i }
				/>
			);
			dots = true;
		} else if (
			i <= endSize ||
			( currentPage &&
				i >= currentPage - midSize &&
				i <= currentPage + midSize ) ||
			i > totalPages - endSize
		) {
			pageLinks.push(
				<Button
					key={ i }
					onClick={ () => table.setPageIndex( i - 1 ) }
					text={ i }
				/>
			);
			dots = true;
		} else if ( dots ) {
			pageLinks.push( <Button key={ i } disabled={ true } text="..." /> );
			dots = false;
		}
	}
	return (
		<HStack justify="flex-start" spacing={ 0 } style={ { width: 'auto' } }>
			{ pageLinks }
		</HStack>
	);
}

export function DatatablePageSizeControl() {
	const table = useDataTableContext();
	return (
		<SelectControl
			label={ __( 'Number of items per page' ) }
			hideLabelFromVision={ true }
			value={ table.getState().pagination.pageSize }
			options={ [ 2, 5, 20, 50 ].map( ( pageSize ) => ( {
				// Only for TS and prototype..
				value: pageSize.toString(),
				label: `Show ${ pageSize }`,
			} ) ) }
			onChange={ ( value ) => table.setPageSize( +value ) }
			style={ { minWidth: '100px' } }
		/>
	);
}
