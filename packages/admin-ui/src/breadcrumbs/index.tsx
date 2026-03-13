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
import type {
	BreadcrumbsProps,
	BreadcrumbItem as BreadcrumbItemType,
} from './types';

const BreadcrumbItem = ( {
	item: { label, to },
}: {
	item: BreadcrumbItemType;
} ) => {
	if ( ! to ) {
		return (
			<li>
				<Heading level={ 1 } truncate>
					{ label }
				</Heading>
			</li>
		);
	}

	return (
		<li>
			<Link to={ to }>{ label }</Link>
		</li>
	);
};

/**
 * Renders a breadcrumb navigation trail.
 *
 * All items except the last one must provide a `to` prop for navigation.
 * The last item represents the current page and its `to` prop is optional.
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

	return (
		<nav aria-label={ __( 'Breadcrumbs' ) }>
			<HStack
				as="ul"
				className="admin-ui-breadcrumbs__list"
				spacing={ 0 }
				justify="flex-start"
				alignment="center"
			>
				{ items.map( ( item, index ) => (
					<BreadcrumbItem key={ index } item={ item } />
				) ) }
			</HStack>
		</nav>
	);
};

export default Breadcrumbs;
