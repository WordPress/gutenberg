import clsx from 'clsx';
import type { NavigationConfig } from '../navigation/types';
import Header from './header';
import type { PageComponents } from './types';
import NavigableRegion from '../navigable-region';
import { SidebarToggleFill } from './sidebar-toggle-slot';
import styles from './style.module.css';

/**
 * A standard layout for admin screens. It includes a header with support for
 * a title or breadcrumbs, badges, actions such as a Save button, and links to
 * the sections of the screen. The page content shows below the header.
 */
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
	navigation,
	components,
	ariaLabel,
	hasPadding = false,
	showSidebarToggle = true,
}: {
	/**
	 * The heading level of the `title` element. Change it when the page
	 * renders below another heading of the same level.
	 *
	 * @default 1
	 */
	headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
	/**
	 * A `Breadcrumbs` element from `@wordpress/admin-ui`, shown in place of
	 * `title` on a page that is nested under another page. The last breadcrumb
	 * is the page heading.
	 */
	breadcrumbs?: React.ReactNode;
	/**
	 * Elements shown after the title or breadcrumbs, such as a `Badge` that
	 * shows the status of the page.
	 */
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
	/**
	 * The page heading. Omit it when you use `breadcrumbs`.
	 */
	title?: React.ReactNode;
	/**
	 * A short description shown below the page heading.
	 */
	subTitle?: React.ReactNode;
	/**
	 * The page content, shown below the header.
	 */
	children: React.ReactNode;
	/**
	 * A class name for the root element of the page.
	 */
	className?: string;
	/**
	 * Controls shown at the end of the header, such as the Save button for
	 * the page.
	 */
	actions?: React.ReactNode;
	/**
	 * Links to the sections of the screen, shown in the page header. Each
	 * section has its own URL. Give the list of links and the `href` of the
	 * current one, for example
	 * `{ items: [ { label: 'General', href: '/general' } ], currentHref: '/general' }`.
	 *
	 * To navigate with a client-side router, pass its link component as
	 * `components.link`.
	 */
	navigation?: NavigationConfig;
	/**
	 * Overrides for default elements rendered by the page's sub-components.
	 */
	components?: PageComponents;
	/**
	 * The accessible name of the page region. When `title` is a string, the
	 * default is the title. Set it when `title` is not a string, or when the
	 * page has no title, such as a page that shows breadcrumbs.
	 */
	ariaLabel?: string;
	/**
	 * Whether to add the standard padding around the page content.
	 */
	hasPadding?: boolean;
	/**
	 * Whether to show the sidebar toggle button in the header, if the app
	 * supplies one through `Page.SidebarToggleFill`.
	 */
	showSidebarToggle?: boolean;
} ) {
	const classes = clsx( styles.page, className );
	const effectiveAriaLabel =
		ariaLabel ?? ( typeof title === 'string' ? title : '' );

	return (
		<NavigableRegion className={ classes } ariaLabel={ effectiveAriaLabel }>
			{ ( title ||
				breadcrumbs ||
				badges ||
				actions ||
				visual ||
				!! navigation?.items?.length ) && (
				<Header
					headingLevel={ headingLevel }
					breadcrumbs={ breadcrumbs }
					badges={ badges }
					visual={ visual }
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
					navigation={ navigation }
					components={ components }
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
