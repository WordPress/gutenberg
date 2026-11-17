import clsx from 'clsx';
import type { BreadcrumbItem } from '../breadcrumbs/types';
import type { NavigationConfig } from '../navigation/types';
import Header from './header';
import type { PageComponents } from './types';
import NavigableRegion from '../navigable-region';
import { SidebarToggleFill } from './sidebar-toggle-slot';
import styles from './style.module.css';

/**
 * A standard layout for admin screens. It includes a header with support for
 * a title or breadcrumbs, badges, actions such as a Save button, and tab-style
 * links to the sections of the screen. The page content shows below the header.
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
	 * A breadcrumb trail, shown in place of `title` on a page that is nested
	 * under another page. Give the list of items, for example
	 * `[ { label: 'Settings', href: '/settings' }, { label: 'General' } ]`.
	 * All items except the last one must have an `href`. The last item is the
	 * page heading.
	 *
	 * To navigate with a client-side router, pass its link component as
	 * `components.link`.
	 */
	breadcrumbs?: readonly BreadcrumbItem[];
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
	 * Tab-style links to the sections of the screen, shown in the page header.
	 * Each section has its own URL. Give the list of links and the `href` of
	 * the current one, for example
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
	 * The accessible name of the page region. The default is `title` when it
	 * is a string, or else the label of the last `breadcrumbs` item. Set it
	 * when the page has neither.
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
		ariaLabel ??
		( typeof title === 'string' ? title : breadcrumbs?.at( -1 )?.label ) ??
		'';

	return (
		<NavigableRegion className={ classes } ariaLabel={ effectiveAriaLabel }>
			{ ( title ||
				!! breadcrumbs?.length ||
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
