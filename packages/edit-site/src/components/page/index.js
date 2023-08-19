/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { NavigableRegion } from '@wordpress/interface';
import { EditorSnackbars } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Header from './header';

function Page(
	{ title, subTitle, actions, children, className, hideTitleFromUI = false },
	ref
) {
	const classes = classnames( 'edit-site-page', className );

	return (
		<NavigableRegion className={ classes } ariaLabel={ title }>
			<div className="edit-site-page-content" ref={ ref }>
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

export default forwardRef( Page );
