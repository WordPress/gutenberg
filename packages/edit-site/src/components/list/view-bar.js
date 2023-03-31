/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	SearchControl,
} from '@wordpress/components';
import { list, category } from '@wordpress/icons';

export default function ViewBar( { viewType, onViewChange } ) {
	return (
		<HStack className="edit-site-layout__view-bar">
			<SearchControl />
			<ToggleGroupControl
				hideLabelFromVision={ true }
				className="edit-site-layout__view-bar-toggle"
				value={ viewType }
				onChange={ onViewChange }
			>
				<ToggleGroupControlOptionIcon
					icon={ list }
					className="edit-site-sidebar-navigation-filter__option"
					value="list"
					label="List"
				/>
				<ToggleGroupControlOptionIcon
					icon={ category }
					className="edit-site-sidebar-navigation-filter__option"
					value="grid"
					label="Grid"
				/>
			</ToggleGroupControl>
		</HStack>
	);
}
