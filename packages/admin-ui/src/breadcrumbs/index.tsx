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
