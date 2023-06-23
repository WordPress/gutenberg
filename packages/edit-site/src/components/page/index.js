/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { NavigableRegion } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import Header from './header';

export default function Page( {
	title,
	subTitle,
	actions,
	children,
	className,
	hideTitleFromUI = false,
} ) {
	const classes = classnames( 'edit-site-page', className );

	return (
		<NavigableRegion className={ classes } ariaLabel={ title }>
			{ ! hideTitleFromUI && title && (
				<Header
					title={ title }
					subTitle={ subTitle }
					actions={ actions }
				/>
			) }
			<div className="edit-site-page-content">{ children }</div>
		</NavigableRegion>
	);
}
