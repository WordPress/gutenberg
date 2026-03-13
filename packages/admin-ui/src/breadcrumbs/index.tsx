/**
 * WordPress dependencies
 */
import { Link } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { __experimentalHStack as HStack } from '@wordpress/components';

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
				<Text
					className="admin-ui-page__header-title"
					// eslint-disable-next-line jsx-a11y/heading-has-content -- content provided via render prop
					render={ <h1 /> }
					variant="heading-lg"
				>
					{ label }
				</Text>
			</li>
		);
	}

	return (
		<li>
			<Link to={ to }>
				<Text variant="heading-lg">{ label }</Text>
			</Link>
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
