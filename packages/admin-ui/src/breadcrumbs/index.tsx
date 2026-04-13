/**
 * WordPress dependencies
 */
import clsx from 'clsx';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import { __experimentalHeading as Heading } from '@wordpress/components';
import { Breadcrumb } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { BreadcrumbsProps } from './types';

function createRouteLinkRender( to: string ) {
	return function RouteLinkRender( props: React.ComponentProps< 'a' > ) {
		const { href: _href, ...anchorProps } = props;

		return <Link to={ to } { ...( anchorProps as Record< string, unknown > ) } />;
	};
}

function renderCurrentHeading( props: React.ComponentProps< 'span' > ) {
	const { className, ...headingProps } = props;

	return (
		<Heading
			level={ 1 }
			truncate
			className={ clsx( 'admin-ui-breadcrumbs__current', className ) }
			{ ...( headingProps as Record< string, unknown > ) }
		/>
	);
}

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
		<Breadcrumb aria-label={ __( 'Breadcrumbs' ) }>
			<Breadcrumb.List className="admin-ui-breadcrumbs__list">
				{ precedingItems.map( ( item, index ) => (
					<Breadcrumb.Item
						key={ index }
						href={ item.to }
						render={ createRouteLinkRender( item.to! ) }
					>
						{ item.label }
					</Breadcrumb.Item>
				) ) }
				{ lastItem.to ? (
					<Breadcrumb.Item
						href={ lastItem.to }
						render={ createRouteLinkRender( lastItem.to ) }
						aria-current="page"
					>
						{ lastItem.label }
					</Breadcrumb.Item>
				) : (
					<Breadcrumb.Current render={ renderCurrentHeading }>
						{ lastItem.label }
					</Breadcrumb.Current>
				) }
			</Breadcrumb.List>
		</Breadcrumb>
	);
};

export default Breadcrumbs;
