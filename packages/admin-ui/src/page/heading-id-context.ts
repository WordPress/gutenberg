import { createContext } from '@wordpress/element';

/**
 * The ID for the heading that names the page region, when the page shows
 * breadcrumbs instead of a title. `Breadcrumbs` gives it to the heading of the
 * current page.
 */
export const PageHeadingIdContext = createContext< string | undefined >(
	undefined
);
