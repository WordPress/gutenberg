import { BreadcrumbBase } from './breadcrumb';
import { BreadcrumbList } from './list';
import { BreadcrumbItem } from './item';
import { BreadcrumbCurrent } from './current';

/**
 * A breadcrumb navigation component with a simple `items` API and compound
 * subcomponents for custom composition.
 */
export const Breadcrumb = Object.assign( BreadcrumbBase, {
	List: BreadcrumbList,
	Item: BreadcrumbItem,
	Current: BreadcrumbCurrent,
} ) as typeof BreadcrumbBase & {
	List: typeof BreadcrumbList;
	Item: typeof BreadcrumbItem;
	Current: typeof BreadcrumbCurrent;
};
