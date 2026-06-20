/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalItem as Item, FlexBlock } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { isRTL } from '@wordpress/i18n';
import { chevronRightSmall, chevronLeftSmall, Icon } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { SidebarNavigationContext } from '../sidebar';

const { useHistory, useLink, useLocation } = unlock( routerPrivateApis );

export default function SidebarNavigationItem( {
	className,
	icon,
	withChevron = false,
	suffix,
	uid,
	to,
	onClick,
	activeOnRouteName,
	children,
	...props
} ) {
	const history = useHistory();
	const linkProps = useLink( to );
	const { name } = useLocation();
	const { navigate } = useContext( SidebarNavigationContext );

	const isActive = activeOnRouteName && name === activeOnRouteName;
	// If there is no custom click handler, create one that navigates to `params`.
	function handleClick( e ) {
		if ( onClick ) {
			onClick( e );
			navigate( 'forward' );
		} else if ( to ) {
			e.preventDefault();
			history.navigate( to );
			navigate( 'forward', `[id="${ uid }"]` );
		}
	}

	return (
		<Item
			className={ clsx(
				'edit-site-sidebar-navigation-item',
				{ 'with-suffix': ! withChevron && suffix },
				className
			) }
			id={ uid }
			onClick={ handleClick }
			href={ to ? linkProps.href : undefined }
			aria-current={ isActive ? true : undefined }
			{ ...props }
		>
			<Stack direction="row" align="center" justify="start" gap="sm">
				{ icon && (
					<Icon
						style={ { fill: 'currentcolor' } }
						icon={ icon }
						size={ 24 }
					/>
				) }
				<FlexBlock>{ children }</FlexBlock>
				{ withChevron && (
					<Icon
						icon={ isRTL() ? chevronLeftSmall : chevronRightSmall }
						className="edit-site-sidebar-navigation-item__drilldown-indicator"
						size={ 24 }
					/>
				) }
				{ ! withChevron && suffix }
			</Stack>
		</Item>
	);
}
