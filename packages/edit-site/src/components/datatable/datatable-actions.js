/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	SelectControl,
} from '@wordpress/components';
import { moreVertical, check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDataTableContext } from './context';

// TODO: should this probably be a user setting?
export function DataTablePageSizeControl() {
	const table = useDataTableContext();
	return (
		<SelectControl
			label={ __( 'Entries per page' ) }
			value={ table.getState().pagination.pageSize }
			options={ [ 2, 5, 20, 50 ].map( ( pageSize ) => ( {
				value: pageSize,
				label: pageSize,
			} ) ) }
			onChange={ ( value ) => table.setPageSize( +value ) }
			style={ { minWidth: '100px' } }
		/>
	);
}

export default function DataTableActions( { className, toggleProps } ) {
	const table = useDataTableContext();
	const columns = table
		.getAllColumns()
		.filter( ( columnn ) => columnn.getCanHide() );
	return (
		<DropdownMenu
			icon={ moreVertical }
			label={ __( 'Actions' ) }
			className={ className }
			toggleProps={ toggleProps }
		>
			{ () => (
				<>
					<MenuGroup>
						<DataTablePageSizeControl />
					</MenuGroup>
					{ !! columns?.length && (
						<>
							<MenuGroup label={ __( 'Table columns' ) }>
								{ columns?.map( ( column, i ) => {
									const isSelected = column.getIsVisible();
									return (
										<MenuItem
											key={ i }
											icon={ isSelected && check }
											isSelected={ isSelected }
											onClick={ column.getToggleVisibilityHandler() }
											role="menuitemcheckbox"
										>
											{ column.columnDef.header }
										</MenuItem>
									);
								} ) }
							</MenuGroup>
							<MenuGroup>
								{ /* // TODO: disable or not render if nothing to reset.. */ }
								<MenuItem
									onClick={ () =>
										table.resetColumnVisibility()
									}
								>
									{ __( 'Reset' ) }
								</MenuItem>
							</MenuGroup>
						</>
					) }
				</>
			) }
		</DropdownMenu>
	);
}
