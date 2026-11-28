import { _x } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import type { BreadcrumbsProps } from './types';
import styles from './style.module.css';

/**
 * Renders a breadcrumb navigation trail. All items except the last one link to
 * their `href`. The last item is the current page and is the page heading.
 *
 * Internal to the package: configured through the `Page` `breadcrumbs` prop.
 */
export const Breadcrumbs = ( {
	items,
	headingLevel,
	linkComponent,
}: BreadcrumbsProps ) => {
	if ( ! items.length ) {
		return null;
	}

	const LinkComponent = linkComponent ?? 'a';
	const HeadingTag = `h${ headingLevel }` as const;
	const precedingItems = items.slice( 0, -1 );
	const lastItem = items[ items.length - 1 ];

	if ( process.env.NODE_ENV !== 'production' ) {
		const invalidItem = precedingItems.find( ( item ) => ! item.href );
		if ( invalidItem ) {
			throw new Error(
				`Breadcrumbs: item "${ invalidItem.label }" is missing an \`href\` prop. All items except the last one must have an \`href\` prop.`
			);
		}
	}

	return (
		<nav aria-label={ _x( 'Breadcrumbs', 'aria label' ) }>
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
										<LinkComponent href={ item.href! } />
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
					<Text
						variant="heading-lg"
						render={ <HeadingTag /> }
						className={ styles.current }
					>
						{ lastItem.label }
					</Text>
				</li>
			</Stack>
		</nav>
	);
};

export default Breadcrumbs;
