import clsx from 'clsx';
import Header2 from './header';
import { FullBleed } from './full-bleed';
import { Narrow } from './narrow';
import { Footer } from './footer';
import type { Page2Props } from './types';
import styles from './style.module.css';

/**
 * Iteration on the `Page` component (https://github.com/WordPress/gutenberg/issues/77628).
 * `Page` is unaffected and remains available; nothing in Gutenberg has been
 * migrated to `Page2` yet.
 */
function Page2( {
	headingLevel,
	breadcrumbs,
	badges,
	visual,
	title,
	description,
	children,
	className,
	navigation,
	actions,
}: Page2Props ) {
	const classes = clsx( styles.page2, className );
	const hasActions = !! (
		actions?.primary ||
		actions?.secondary?.length ||
		actions?.overflow?.length
	);

	return (
		<div className={ classes }>
			{ ( title ||
				!! breadcrumbs?.length ||
				!! badges?.length ||
				visual ||
				!! navigation?.items?.length ||
				hasActions ) && (
				<Header2
					headingLevel={ headingLevel }
					breadcrumbs={ breadcrumbs }
					badges={ badges }
					visual={ visual }
					title={ title }
					description={ description }
					navigation={ navigation }
					actions={ actions }
				/>
			) }
			<div className={ styles.content }>{ children }</div>
		</div>
	);
}

Page2.FullBleed = FullBleed;
Page2.Narrow = Narrow;
Page2.Footer = Footer;

export default Page2;
