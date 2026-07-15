/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { NavigationProps } from './types';
import styles from './style.module.css';

/**
 * Renders a horizontal list of links for navigating between the sections of a
 * screen. The item whose `href` matches `currentHref` is marked with
 * `aria-current="page"`.
 *
 * Internal to the package: configured through the `Page` `navigation` prop.
 */
export const Navigation = ( {
	items,
	currentHref,
	ariaLabel,
}: NavigationProps ) => {
	if ( ! items.length ) {
		return null;
	}

	if ( process.env.NODE_ENV !== 'production' ) {
		const invalidItem = items.find(
			( item ) => typeof item.href !== 'string'
		);
		if ( invalidItem ) {
			throw new Error(
				`Navigation: item "${ invalidItem.label }" is missing an \`href\` prop.`
			);
		}

		const duplicate = items.find(
			( item, index ) =>
				items.findIndex( ( other ) => other.href === item.href ) !==
				index
		);
		if ( duplicate ) {
			throw new Error(
				`Navigation: duplicate \`href\` "${ duplicate.href }". Each item must have a unique \`href\` so a single item receives \`aria-current="page"\`.`
			);
		}
	}

	return (
		<nav aria-label={ ariaLabel ?? __( 'Sections' ) }>
			<Stack
				render={ <ul /> }
				direction="row"
				align="center"
				gap="lg"
				className={ styles.list }
			>
				{ items.map( ( item ) => (
					<li key={ item.href } className={ styles.li }>
						<Text
							variant="body-md"
							className={ styles.item }
							render={
								<Link
									variant="unstyled"
									href={ item.href }
									aria-current={
										item.href === currentHref
											? 'page'
											: undefined
									}
								/>
							}
						>
							{ item.label }
						</Text>
					</li>
				) ) }
			</Stack>
		</nav>
	);
};

export default Navigation;
