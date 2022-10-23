/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';

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

	const handleOnClick = ( event ) => {
		if ( typeof onClick === 'function' ) {
			onClick( event );
		}

		const animationDirection = isRTL() ? 'left' : 'right';
		if ( parentMenu && ! event.defaultPrevented ) {
			setActiveMenu( parentMenu, animationDirection );
		}
	};
	const icon = isRTL() ? chevronRight : chevronLeft;
	return (
		<MenuBackButtonUI
			className={ classes }
			href={ href }
			variant="tertiary"
			ref={ ref }
			onClick={ handleOnClick }
		>
			<Icon icon={ icon } />
			{ backButtonLabel || parentMenuTitle || __( 'Back' ) }
		</MenuBackButtonUI>
	);
}
export default forwardRef( NavigationBackButton );
