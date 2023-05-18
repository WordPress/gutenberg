/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	SearchControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
} from '@wordpress/components';
import { menu, grid } from '@wordpress/icons';
/**
 * Internal dependencies
 */

export default function FilterBar() {
	return (
		<HStack
			className="edit-site-page-filter-bar"
			spacing={ 3 }
			alignment="left"
		>
			<SearchControl
				className="edit-site-page-filter-bar__search"
				label="Search templates..."
				placeholder="Search templates..."
			/>
			<ToggleGroupControl
				__nextHasNoMarginBottom
				label="view type"
				value="list"
				isBlock
				size="__unstable-large"
				hideLabelFromVision
			>
				<ToggleGroupControlOptionIcon
					icon={ menu }
					value="list"
					label="List"
				/>
				<ToggleGroupControlOptionIcon
					icon={ grid }
					value="grid"
					label="Grid"
				/>
			</ToggleGroupControl>
		</HStack>
	);
}
