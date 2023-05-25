/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
/**
 * Internal dependencies
 */
import DataListItem from './data-list-item';

export default function SidebarDetails( { details } ) {
	return (
		<VStack
			className="edit-site-sidebar-navigation_data-list"
			spacing={ 5 }
		>
			{ details.map( ( detail ) => (
				<DataListItem
					key={ detail.label }
					label={ detail.label }
					value={ detail.value }
				/>
			) ) }
		</VStack>
	);
}
