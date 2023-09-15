/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	SelectControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	chevronRightSmall,
	check,
	blockTable,
	chevronDown,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { useDataTableContext } from './context';

const {
	DropdownMenuV2,
	// DropdownMenuCheckboxItemV2,
	DropdownMenuGroupV2,
	DropdownMenuItemV2,
	// DropdownMenuRadioGroupV2,
	// DropdownMenuRadioItemV2,
	// DropdownMenuSeparatorV2,
	DropdownSubMenuV2,
	DropdownSubMenuTriggerV2,
} = unlock( componentsPrivateApis );

const PAGE_SIZE_VALUES = [ 2, 5, 20, 50 ];

export function DataTablePageSizeControl() {
	const table = useDataTableContext();
	return (
		<SelectControl
			__nextHasNoMarginBottom
			label={ __( 'Per page:' ) }
			labelPosition="side"
			value={ table.getState().pagination.pageSize }
			options={ PAGE_SIZE_VALUES.map( ( pageSize ) => ( {
				value: pageSize,
				label: pageSize,
			} ) ) }
			onChange={ ( value ) => table.setPageSize( +value ) }
		/>
	);
}

// TODO: probably the selected value should be a user setting per list..
function DataTablePageSizeMenu() {
	const table = useDataTableContext();
	const currenPageSize = table.getState().pagination.pageSize;
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={
						<>
							{ currenPageSize }
							<Icon icon={ chevronRightSmall } />{ ' ' }
						</>
					}
				>
					{ __( 'Row per page' ) }
				</DropdownSubMenuTriggerV2>
			}
		>
			{ PAGE_SIZE_VALUES.map( ( size ) => {
				return (
					<DropdownMenuItemV2
						key={ size }
						prefix={
							currenPageSize === size && <Icon icon={ check } />
						}
						onSelect={ ( event ) => {
							// We need to handle this on DropDown component probably..
							event.preventDefault();
							table.setPageSize( size );
						} }
						// TODO: check about role and a11y.
						role="menuitemcheckbox"
					>
						{ size }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownSubMenuV2>
	);
}

function DataTableColumnsVisibilityMenu() {
	const table = useDataTableContext();
	const hideableColumns = table
		.getAllColumns()
		.filter( ( columnn ) => columnn.getCanHide() );
	if ( ! hideableColumns?.length ) {
		return null;
	}
	return (
		<DropdownSubMenuV2
			trigger={
				<DropdownSubMenuTriggerV2
					suffix={ <Icon icon={ chevronRightSmall } /> }
				>
					{ __( 'Columns' ) }
				</DropdownSubMenuTriggerV2>
			}
		>
			{ hideableColumns?.map( ( column, i ) => {
				return (
					<DropdownMenuItemV2
						key={ i }
						prefix={
							column.getIsVisible() && <Icon icon={ check } />
						}
						onSelect={ ( event ) => {
							event.preventDefault();
							column.getToggleVisibilityHandler()( event );
						} }
						role="menuitemcheckbox"
					>
						{ column.columnDef.header }
					</DropdownMenuItemV2>
				);
			} ) }
		</DropdownSubMenuV2>
	);
}

export default function DataTableActions( {
	className,
	// TODO: check if we need something fixed here and use props
	// or we would need slot and compose components..
	showColumnsVisibility = true,
} ) {
	return (
		<DropdownMenuV2
			label={ __( 'Actions' ) }
			className={ className }
			trigger={
				<Button 
					variant='tertiary'
					icon={ blockTable }
				>
					{ __( 'View' ) }
					<Icon icon={ chevronDown } />
				</Button>
			}
		>
			<DropdownMenuGroupV2>
				{ !! showColumnsVisibility && (
					<DataTableColumnsVisibilityMenu />
				) }
				<DataTablePageSizeMenu />
			</DropdownMenuGroupV2>
			{ /* <DropdownMenuGroupV2>
					Do we need a Reset after all? If yes, what should reset?
					TODO: disable or not render if nothing to reset..
					<DropdownMenuItemV2
						onSelect={ () => table.resetColumnVisibility() }
					>
						{ __( 'Reset' ) }
					</DropdownMenuItemV2>
				</DropdownMenuGroupV2> */ }
		</DropdownMenuV2>
	);
}
