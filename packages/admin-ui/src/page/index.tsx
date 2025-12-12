/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import Header from './header';
import NavigableRegion from '../navigable-region';
import { SidebarToggleFill } from './sidebar-toggle-slot';

function Page( {
	breadcrumbs,
	badges,
	title,
	subTitle,
	children,
	className,
	actions,
	hasPadding = false,
	showSidebarToggle = true,
}: {
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	title?: React.ReactNode;
	subTitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
	hasPadding?: boolean;
	showSidebarToggle?: boolean;
} ) {
	const classes = clsx( 'admin-ui-page', className );

	return (
		<NavigableRegion className={ classes } ariaLabel={ title }>
			{ ( title || breadcrumbs || badges ) && (
				<Header
					breadcrumbs={ breadcrumbs }
					badges={ badges }
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
					showSidebarToggle={ showSidebarToggle }
				/>
			) }
			{ hasPadding ? (
				<div className="admin-ui-page__content has-padding">
					{ children }
				</div>
			) : (
				children
			) }
		</NavigableRegion>
	);
}

Page.SidebarToggleFill = SidebarToggleFill;

export default Page;
