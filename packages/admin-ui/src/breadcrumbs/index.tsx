/**
 * WordPress dependencies
 */
import { Link } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import {
	__experimentalHeading as Heading,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { BreadcrumbsProps } from './types';

/**
 * Renders a breadcrumb navigation trail.
 *
 * All items except the last one must provide a `to` prop for navigation.
 * In development mode, an error is thrown when a non-last item is missing `to`.
 * The last item represents the current page and its `to` prop is optional.
 * Only the last item (when it has no `to` prop) is rendered as an `h1`.
 *
 * @param props
 * @param props.items The breadcrumb items to display.
 *
 * @example
 * ```jsx
 * <Breadcrumbs
 *   items={ [
 *     { label: 'Home', to: '/' },
 *     { label: 'Settings', to: '/settings' },
 *     { label: 'General' },
 *   ] }
 * />
 * ```
 */
export const Breadcrumbs = ( { items }: BreadcrumbsProps ) => {
	if ( ! items.length ) {
		return null;
	}

	const precedingItems = items.slice( 0, -1 );
	const lastItem = items[ items.length - 1 ];

	if ( process.env.NODE_ENV !== 'production' ) {
		const invalidItem = precedingItems.find( ( item ) => ! item.to );
		if ( invalidItem ) {
			throw new Error(
				`Breadcrumbs: item "${ invalidItem.label }" is missing a \`to\` prop. All items except the last one must have a \`to\` prop.`
			);
		}
	}

	return (
		<nav aria-label={ __( 'Breadcrumbs' ) }>
			<HStack
				as="ul"
				className="admin-ui-breadcrumbs__list"
				spacing={ 0 }
				justify="flex-start"
				alignment="center"
			>
				{ precedingItems.map( ( item, index ) => (
					<li key={ index }>
						<Link to={ item.to }>{ item.label }</Link>
					</li>
				) ) }
				<li>
					{ lastItem.to ? (
						<Link to={ lastItem.to }>{ lastItem.label }</Link>
					) : (
						<Heading level={ 1 } truncate>
							{ lastItem.label }
						</Heading>
					) }
				</li>
			</HStack>
		</nav>
	);
};

export default Breadcrumbs;
