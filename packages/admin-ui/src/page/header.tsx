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
	headingLevel = 2,
	breadcrumbs,
	badges,
	title,
	subTitle,
	actions,
	showSidebarToggle = true,
}: {
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	title?: React.ReactNode;
	subTitle: React.ReactNode;
	actions?: React.ReactNode;
	showSidebarToggle?: boolean;
} ) {
	return (
		<VStack className="admin-ui-page__header" as="header">
			<HStack justify="space-between" spacing={ 2 }>
				<HStack spacing={ 2 } justify="left">
					{ showSidebarToggle && (
						<SidebarToggleSlot
							bubblesVirtually
							className="admin-ui-page__sidebar-toggle-slot"
						/>
					) }
					{ title && (
						<Heading
							level={ headingLevel }
							weight={ 500 }
							truncate
							size="20"
						>
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
