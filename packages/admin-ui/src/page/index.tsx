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
	headingLevel,
	breadcrumbs,
	badges,
	title,
	subTitle,
	children,
	className,
	actions,
	ariaLabel,
	hasPadding = false,
	showSidebarToggle = true,
}: {
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
	breadcrumbs?: React.ReactNode;
	badges?: React.ReactNode;
	title?: React.ReactNode;
	subTitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
	ariaLabel?: string;
	hasPadding?: boolean;
	showSidebarToggle?: boolean;
} ) {
	const classes = clsx( 'admin-ui-page', className );
	const effectiveAriaLabel =
		ariaLabel ?? ( typeof title === 'string' ? title : '' );

	return (
		<NavigableRegion className={ classes } ariaLabel={ effectiveAriaLabel }>
			{ ( title || breadcrumbs || badges ) && (
				<Header
					headingLevel={ headingLevel }
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
