/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */

export default function SidebarDetails( { details } ) {
	return (
		<VStack className="edit-site-sidebar-data-list" spacing={ 4 }>
			{ details.map( ( detail ) => (
				<HStack
					className="edit-site-sidebar-navigation-screen_data-list-item"
					key={ detail.label }
					spacing={ 2 }
				>
					<Text className="edit-site-sidebar-data-list__label">
						{ detail.label }
					</Text>
					<Text className="edit-site-sidebar-data-list__value">
						{ detail.value }
					</Text>
				</HStack>
			) ) }
		</VStack>
	);
}
