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
 * screen. The item whose `href` matches `selected` is marked with
 * `aria-current="page"`.
 *
 * Internal to the package: configured through the `Page` `navigation` prop.
 *
 * @param {NavigationProps} props
 */
export const Navigation = ( props: NavigationProps ) => {
	const { items, selected } = props;

	if ( ! items.length ) {
		return null;
	}

	if ( process.env.NODE_ENV !== 'production' ) {
		const invalidItem = items.find( ( item ) => ! item.href );
		if ( invalidItem ) {
			throw new Error(
				`Navigation: item "${ invalidItem.label }" is missing an \`href\` prop.`
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
				{ items.map( ( item, index ) => (
					<li key={ index }>
						<Text
							variant="body-md"
							render={
								<Link
									variant="unstyled"
									href={ item.href }
									aria-current={
										item.href === selected
											? 'page'
											: undefined
									}
									className={ styles.item }
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
