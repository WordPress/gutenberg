/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';

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
		</HStack>
	);
}
