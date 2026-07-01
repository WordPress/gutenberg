/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Link as RouterLink } from '@wordpress/route';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NavigationProps } from './types';
import styles from './style.module.css';

/**
 * Renders a horizontal list of links for navigating between the sections of a
 * screen. The active item is marked with `aria-current="page"`. Routing is
 * composed in through each item's `to` and/or `search`, and the consumer
 * decides which item is `active`.
 *
 * @param {NavigationProps} props
 *
 * @example
 * ```jsx
 * <Navigation
 *   items={ [
 *     { label: 'Overview', to: '/overview', active: true },
 *     { label: 'Products', to: '/products' },
 *   ] }
 * />
 * ```
 */
export const Navigation = ( props: NavigationProps ) => {
	const { items } = props;

	if ( ! items.length ) {
		return null;
	}

	if ( process.env.NODE_ENV !== 'production' ) {
		const invalidItem = items.find(
			( item ) => ! item.to && ! item.search
		);
		if ( invalidItem ) {
			throw new Error(
				`Navigation: item "${ invalidItem.label }" must have a \`to\` or \`search\` prop.`
			);
		}
	}

	return (
		<nav aria-label={ __( 'Secondary navigation' ) }>
			<Stack
				render={ <ul /> }
				direction="row"
				align="center"
				gap="lg"
				className={ styles.list }
			>
				{ items.map( ( item, index ) => {
					// Merge the item's params on top of the current ones so
					// unrelated query state (filters, etc.) is preserved. Cast
					// for the router, which types `search` against a route tree
					// this generic component is agnostic to.
					const search = (
						item.search
							? ( previous: Record< string, unknown > ) => ( {
									...previous,
									...item.search,
							  } )
							: undefined
					) as never;
					return (
						<li key={ index }>
							<Text
								variant="body-md"
								render={
									<Link
										variant="unstyled"
										aria-current={
											item.active ? 'page' : undefined
										}
										className={ clsx( styles.item, {
											[ styles.active ]: item.active,
										} ) }
										render={
											<RouterLink
												to={ item.to }
												search={ search }
											/>
										}
									/>
								}
							>
								{ item.label }
							</Text>
						</li>
					);
				} ) }
			</Stack>
		</nav>
	);
};

export default Navigation;
