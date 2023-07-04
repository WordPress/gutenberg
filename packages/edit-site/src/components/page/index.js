/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { NavigableRegion } from '@wordpress/interface';
import { EditorSnackbars } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Header from './header';

export default function Page( {
	title,
	titleLevel,
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
					level={ titleLevel }
				/>
			) }
			<div className="edit-site-page-content">
				{ children }
				<EditorSnackbars />
			</div>
		</NavigableRegion>
	);
}
