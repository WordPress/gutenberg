/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalText as Text,
} from '@wordpress/components';

export default function DataListItem( { label, value } ) {
	return (
		<HStack
			className="edit-site-sidebar-navigation_data-list__item"
			key={ label }
			spacing={ 5 }
			alignment="left"
		>
			<Text className="edit-site-sidebar-navigation_data-list__label">
				{ label }
			</Text>
			<Text className="edit-site-sidebar-navigation_data-list__value">
				{ value }
			</Text>
		</HStack>
	);
}
