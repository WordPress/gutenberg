/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

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
		<Stack
			direction="column"
			className="admin-ui-page__header"
			render={ <header /> }
		>
			<Stack direction="row" justify="space-between" gap="sm">
				<Stack direction="row" gap="sm" align="center" justify="start">
					{ showSidebarToggle && (
						<SidebarToggleSlot
							bubblesVirtually
							className="admin-ui-page__sidebar-toggle-slot"
						/>
					) }
					{ title && (
						<h2 className="admin-ui-page__header-title">
							{ title }
						</h2>
					) }
					{ breadcrumbs }
					{ badges }
				</Stack>
				<Stack
					direction="row"
					gap="sm"
					style={ { width: 'auto', flexShrink: 0 } }
					className="admin-ui-page__header-actions"
					align="center"
				>
					{ actions }
				</Stack>
			</Stack>
			{ subTitle && (
				<p className="admin-ui-page__header-subtitle">{ subTitle }</p>
			) }
		</Stack>
	);
}
