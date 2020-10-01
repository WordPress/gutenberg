/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useNavigationContext } from '../context';
import { MenuBackButtonUI } from '../styles/navigation-styles';

function NavigationBackButton(
	{ backButtonLabel, className, href, onClick, parentMenu },
	ref
) {
	const { setActiveMenu, navigationTree } = useNavigationContext();

	const classes = classnames(
		'components-navigation__back-button',
		className
	);

	const parentMenuTitle = navigationTree.getMenu( parentMenu )?.title;

	return (
		<MenuBackButtonUI
			className={ classes }
			href={ href }
			isTertiary
			onClick={ () =>
				parentMenu ? setActiveMenu( parentMenu, 'right' ) : onClick
			}
			ref={ ref }
		>
			<Icon icon={ chevronLeft } />
			{ backButtonLabel || parentMenuTitle || __( 'Back' ) }
		</MenuBackButtonUI>
	);
}

export default forwardRef( NavigationBackButton );
