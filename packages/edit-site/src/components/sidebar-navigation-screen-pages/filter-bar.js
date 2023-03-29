/**
 * External dependencies
 */
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

/**
 * WordPress dependencies
 */
import {
	FlexBlock,
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { Icon, settings, check, chevronRight } from '@wordpress/icons';

export default function FilterBar( { filters, onFilterChange } ) {
	return (
		<HStack className="edit-site-sidebar-navigation-filter">
			<ToggleGroupControl
				value={ filters.status }
				isBlock
				onChange={ ( value ) =>
					onFilterChange( { ...filters, status: value } )
				}
			>
				<ToggleGroupControlOption
					className="edit-site-sidebar-navigation-filter__option"
					value="publish,draft"
					label="All"
				/>
				<ToggleGroupControlOption
					className="edit-site-sidebar-navigation-filter__option"
					value="publish"
					label="Published"
				/>
				<ToggleGroupControlOption
					className="edit-site-sidebar-navigation-filter__option"
					value="draft"
					label="Draft"
				/>
			</ToggleGroupControl>
			<DropdownMenuDemo
				filters={ filters }
				onFilterChange={ onFilterChange }
			/>
		</HStack>
	);
}

const DropdownMenuDemo = ( { filters, onFilterChange } ) => {
	let orderLabel = 'Newest';

	switch ( filters.orderby ) {
		case 'date':
			orderLabel = filters.order === 'asc' ? 'Oldest' : 'Newest';
			break;
		case 'title':
			orderLabel = 'Title';
			break;
	}

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button className="IconButton" aria-label="Customise options">
					<Icon icon={ settings } />
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="DropdownMenuContent"
					sideOffset={ 5 }
				>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger className="DropdownMenuSubTrigger">
							<FilterOption
								label="Order by:"
								value={ orderLabel }
							/>
							<div className="RightSlot">
								<Icon
									fill="currentColor"
									icon={ chevronRight }
								/>
							</div>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.Portal>
							<DropdownMenu.SubContent
								className="DropdownMenuSubContent"
								sideOffset={ 2 }
								alignOffset={ -5 }
							>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={
										filters.order === 'desc' &&
										filters.orderby === 'date'
									}
									onCheckedChange={ () =>
										onFilterChange( {
											...filters,
											order: 'desc',
											orderby: 'date',
										} )
									}
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Newest
								</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={
										filters.order === 'asc' &&
										filters.orderby === 'date'
									}
									onCheckedChange={ () =>
										onFilterChange( {
											...filters,
											order: 'asc',
											orderby: 'date',
										} )
									}
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Oldest
								</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ filters.orderby === 'title' }
									onCheckedChange={ () =>
										onFilterChange( {
											...filters,
											order: 'asc',
											orderby: 'title',
										} )
									}
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Title
								</DropdownMenu.CheckboxItem>
							</DropdownMenu.SubContent>
						</DropdownMenu.Portal>
					</DropdownMenu.Sub>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger className="DropdownMenuSubTrigger">
							<FilterOption label="Category" value="All" />
							<div className="RightSlot">
								<Icon
									fill="currentColor"
									icon={ chevronRight }
								/>
							</div>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.Portal>
							<DropdownMenu.SubContent
								className="DropdownMenuSubContent"
								sideOffset={ 2 }
								alignOffset={ -5 }
							>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ true }
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									All
								</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ false }
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Technology
								</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ false }
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Design
								</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ false }
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Architecture
								</DropdownMenu.CheckboxItem>
							</DropdownMenu.SubContent>
						</DropdownMenu.Portal>
					</DropdownMenu.Sub>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger className="DropdownMenuSubTrigger">
							<FilterOption label="Author" value="Me" />
							<div className="RightSlot">
								<Icon
									fill="currentColor"
									icon={ chevronRight }
								/>
							</div>
						</DropdownMenu.SubTrigger>
						<DropdownMenu.Portal>
							<DropdownMenu.SubContent
								className="DropdownMenuSubContent"
								sideOffset={ 2 }
								alignOffset={ -5 }
							>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ true }
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Me
								</DropdownMenu.CheckboxItem>
								<DropdownMenu.CheckboxItem
									className="DropdownMenuCheckboxItem"
									checked={ false }
								>
									<DropdownMenu.ItemIndicator className="DropdownMenuItemIndicator">
										<Icon icon={ check } />
									</DropdownMenu.ItemIndicator>
									Others
								</DropdownMenu.CheckboxItem>
							</DropdownMenu.SubContent>
						</DropdownMenu.Portal>
					</DropdownMenu.Sub>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

const FilterOption = ( { label, value } ) => {
	return (
		<HStack className="edit-site-sidebar-navigation-filter-menu-item">
			<FlexBlock className="edit-site-sidebar-navigation-filter-menu-item__label">
				{ label }
			</FlexBlock>
			<div>{ value }</div>
		</HStack>
	);
};
