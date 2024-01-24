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
	subTitle,
	actions,
	children,
	className,
	backPath,
	hideTitleFromUI = false,
} ) {
	const classes = classnames( 'edit-site-page', className );

	return (
		<NavigableRegion className={ classes } ariaLabel={ title }>
			<div className="edit-site-page-content">
				{ ! hideTitleFromUI && title && (
					<Header
						backPath={ backPath }
						title={ title }
						subTitle={ subTitle }
						actions={ actions }
					/>
				) }
				{ children }
			</div>
			<EditorSnackbars />
		</NavigableRegion>
	);
}
