/**
 * WordPress dependencies
 */
import { Link as RouterLink } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { BreadcrumbsProps } from './types';
import styles from './style.module.css';

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
			<Stack
				render={ <ul /> }
				direction="row"
				align="center"
				className={ styles.list }
			>
				{ precedingItems.map( ( item, index ) => (
					<li key={ index }>
						<Link
							render={ <RouterLink to={ item.to } /> }
							tone="neutral"
						>
							{ item.label }
						</Link>
					</li>
				) ) }
				<li>
					{ lastItem.to ? (
						<Link
							render={ <RouterLink to={ lastItem.to } /> }
							tone="neutral"
						>
							{ lastItem.label }
						</Link>
					) : (
						/* eslint-disable jsx-a11y/heading-has-content */
						<Text
							variant="heading-lg"
							render={ <h1 /> }
							className={ styles.current }
						>
							{ lastItem.label }
						</Text>
						/* eslint-enable jsx-a11y/heading-has-content */
					) }
				</li>
			</Stack>
		</nav>
	);
};

export default Breadcrumbs;
