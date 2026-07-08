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
 * Link items may also forward router `search` (query params), `params`
 * (dynamic path params), and `hash` to the underlying `@wordpress/route`
 * `Link`, so navigating to a parent crumb can preserve URL state such as
 * active filters or sort order.
 *
 * @param props
 * @param props.items The breadcrumb items to display. Each item accepts
 *                    `label`, optional `to`, and optional `search`, `params`,
 *                    and `hash` for link items.
 *
 * @example
 * ```jsx
 * <Breadcrumbs
 *   items={ [
 *     { label: 'Home', to: '/', search: { filter: 'active' } },
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
						<Text
							variant="body-lg"
							render={
								<Link
									tone="neutral"
									render={
										<RouterLink
											to={ item.to }
											search={ item.search as never }
											params={ item.params as never }
											hash={ item.hash }
										/>
									}
								/>
							}
						>
							{ item.label }
						</Text>
						<Text
							variant="body-lg"
							aria-hidden="true"
							className={ styles.separator }
						>
							/
						</Text>
					</li>
				) ) }
				<li>
					{ lastItem.to ? (
						<Text
							variant="body-lg"
							render={
								<Link
									tone="neutral"
									render={
										<RouterLink
											to={ lastItem.to }
											search={ lastItem.search as never }
											params={ lastItem.params as never }
											hash={ lastItem.hash }
										/>
									}
								/>
							}
						>
							{ lastItem.label }
						</Text>
					) : (
						<Text
							variant="heading-lg"
							render={ <h1 /> }
							className={ styles.current }
						>
							{ lastItem.label }
						</Text>
					) }
				</li>
			</Stack>
		</nav>
	);
};

export default Breadcrumbs;
