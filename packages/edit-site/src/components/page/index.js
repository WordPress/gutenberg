/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	EditorSnackbars,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Header from './header';
import { unlock } from '../../lock-unlock';

const { NavigableRegion } = unlock( editorPrivateApis );

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
			<div className="edit-site-page-content">
				{ ! hideTitleFromUI && title && (
					<Header
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
