/**
 * WordPress dependencies
 */
import {
	chevronRightSmall,
	chevronRight,
	chevronLeftSmall,
	chevronLeft,
} from '@wordpress/icons';
import {
	Button,
	SelectControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDataTableContext } from './context';

// type DataTablePaginationProps = {
// 	className?: string;
// 	totalItems: number;
// };

// TODO: break into smaller components.
// TODO: translatable and a11y
export default function DataTablePagination( {
	// If passed, use it as it's for controlled pagination.
	totalItems,
} ) {
	const table = useDataTableContext();
	return (
		<HStack>
			<HStack justify="flex-start">
				<span>
					{ `${
						totalItems || table.getCoreRowModel().rows.length
					} items` }
				</span>
				<Button
					icon={ chevronLeft }
					onClick={ () => table.setPageIndex( 0 ) }
					disabled={ ! table.getCanPreviousPage() }
				/>
				<Button
					icon={ chevronLeftSmall }
					onClick={ () => table.previousPage() }
					disabled={ ! table.getCanPreviousPage() }
				/>
				<span>
					{ table.getState().pagination.pageIndex + 1 } of{ ' ' }
					{ table.getPageCount() }
				</span>
				<Button
					icon={ chevronRightSmall }
					onClick={ () => table.nextPage() }
					disabled={ ! table.getCanNextPage() }
				/>
				<Button
					icon={ chevronRight }
					onClick={ () =>
						table.setPageIndex( table.getPageCount() - 1 )
					}
					disabled={ ! table.getCanNextPage() }
				/>
			</HStack>
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
		</HStack>
	);
}
