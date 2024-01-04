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
	hideTitleFromUI = false,
	onClose = null,
} ) {
	const classes = classnames( 'edit-site-page', className );

	return (
		<NavigableRegion className={ classes } ariaLabel={ title }>
			<div className="edit-site-page-content">
				{ ! hideTitleFromUI && title && (
					<Header
						title={ title }
						subTitle={ subTitle }
						actions={ actions }
						onClose={ onClose }
					/>
				) }
				{ children }
			</div>
			<EditorSnackbars />
		</NavigableRegion>
	);
}
