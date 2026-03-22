/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

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
	const HeadingTag = `h${ headingLevel }` as const;
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
						<HeadingTag className="admin-ui-page__header-title">
							{ title }
						</HeadingTag>
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
