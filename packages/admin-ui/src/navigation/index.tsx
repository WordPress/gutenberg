import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
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
	ariaLabel = __( 'Sections' ),
	components,
}: NavigationProps ) => {
	if ( ! items.length ) {
		return null;
	}

	const LinkComponent = components?.link;

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
		<nav aria-label={ ariaLabel }>
			{ /*
			 * Disable reason: The `list` ARIA role is redundant but
			 * Safari+VoiceOver won't announce the list otherwise.
			 */
			/* eslint-disable jsx-a11y/no-redundant-roles */ }
			<Stack
				render={ <ul role="list" /> }
				direction="row"
				align="center"
				gap="md"
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
									render={
										LinkComponent ? (
											<LinkComponent />
										) : undefined
									}
								/>
							}
						>
							{ item.label }
						</Text>
					</li>
				) ) }
			</Stack>
			{ /* eslint-enable jsx-a11y/no-redundant-roles */ }
		</nav>
	);
};

export default Navigation;
