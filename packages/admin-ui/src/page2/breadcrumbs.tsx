// eslint-disable-next-line @wordpress/use-recommended-components -- `Breadcrumb` is the intended primitive for Page2's declarative `breadcrumbs` prop; it predates the component's promotion to the recommended allowlist.
import { Breadcrumb } from '@wordpress/ui';
import type { Page2BreadcrumbItem } from './types';

/**
 * Renders the `Page2` `breadcrumbs` prop (declarative data) as a
 * `Breadcrumb` trail from `@wordpress/ui`.
 *
 * All items except the last one must provide an `href`. In development mode,
 * an error is thrown when a non-last item is missing `href`. The last item
 * represents the current page.
 */
export default function Page2Breadcrumbs( {
	items,
}: {
	items: Page2BreadcrumbItem[];
} ) {
	if ( ! items.length ) {
		return null;
	}

	const precedingItems = items.slice( 0, -1 );
	const lastItem = items[ items.length - 1 ];

	if ( process.env.NODE_ENV !== 'production' ) {
		const invalidItem = precedingItems.find( ( item ) => ! item.href );
		if ( invalidItem ) {
			throw new Error(
				`Page2: breadcrumb item "${ invalidItem.label }" is missing an \`href\`. All items except the last one must have an \`href\`.`
			);
		}
	}

	return (
		<Breadcrumb.Root>
			{ precedingItems.map( ( item, index ) => (
				<Breadcrumb.LinkItem key={ index } href={ item.href ?? '' }>
					{ item.label }
				</Breadcrumb.LinkItem>
			) ) }
			<Breadcrumb.CurrentItem>{ lastItem.label }</Breadcrumb.CurrentItem>
		</Breadcrumb.Root>
	);
}
