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
import styles from './style.module.css';

function Page( {
	headingLevel,
	breadcrumbs,
	badges,
	visual,
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
	/**
	 * Optional visual mark (icon, image, etc.) shown before the page title or breadcrumbs.
	 *
	 * The visual is rendered outside the page heading element and is treated as purely
	 * decorative in the accessibility tree (the wrapper uses `aria-hidden`). Do not pass
	 * interactive content (links, buttons, tooltips) or non-redundant text here.
	 *
	 * When passing an `<img>`, use `alt=""` if the image does not add meaning beyond what is
	 * already available in the visible title, breadcrumbs, or surrounding copy. Meaningful
	 * images should not rely on this slot for their accessible name.
	 */
	visual?: React.ReactNode;
	title?: React.ReactNode;
	subTitle?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
	actions?: React.ReactNode;
	ariaLabel?: string;
	hasPadding?: boolean;
	showSidebarToggle?: boolean;
} ) {
	const classes = clsx( styles.page, className );
	const effectiveAriaLabel =
		ariaLabel ?? ( typeof title === 'string' ? title : '' );

	return (
		<NavigableRegion className={ classes } ariaLabel={ effectiveAriaLabel }>
			{ ( title || breadcrumbs || badges || actions || visual ) && (
				<Header
					headingLevel={ headingLevel }
					breadcrumbs={ breadcrumbs }
					badges={ badges }
					visual={ visual }
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
					showSidebarToggle={ showSidebarToggle }
				/>
			) }
			{ hasPadding ? (
				<div
					className={ clsx(
						styles.content,
						styles[ 'has-padding' ]
					) }
				>
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
