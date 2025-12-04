/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SidebarToggleSlot } from './sidebar-toggle-slot';

export default function Header( {
	breadcrumbs,
	badges,
	title,
	subTitle,
	actions,
	showSidebarToggle = true,
}: {
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	title?: React.ReactNode;
	subTitle: React.ReactNode;
	actions?: React.ReactNode;
	showSidebarToggle?: boolean;
} ) {
	return (
		<VStack className="admin-ui-page__header" as="header">
			<HStack
				className="admin-ui-page__header-title"
				justify="space-between"
				spacing={ 2 }
			>
				<HStack spacing={ 2 } justify="flex-start">
					{ showSidebarToggle && (
						<SidebarToggleSlot
							bubblesVirtually
							className="admin-ui-page__sidebar-toggle-slot"
						/>
					) }
					{ title && (
						<Heading as="h2" level={ 3 } weight={ 500 } truncate>
							{ title }
						</Heading>
					) }
					{ breadcrumbs }
					{ badges }
				</HStack>
				<HStack
					style={ { width: 'auto', flexShrink: 0 } }
					spacing={ 2 }
					className="admin-ui-page__header-actions"
				>
					{ actions }
				</HStack>
			</HStack>
			{ subTitle && (
				<p className="admin-ui-page__header-subtitle">{ subTitle }</p>
			) }
		</VStack>
	);
}
