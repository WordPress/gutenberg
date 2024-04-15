/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexBlock,
} from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';
import { chevronRightSmall, chevronLeftSmall, Icon } from '@wordpress/icons';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function SidebarNavigationItem( {
	className,
	icon,
	withChevron = false,
	suffix,
	path,
	onClick,
	children,
	...props
} ) {
	const history = useHistory();
	let handleClick = onClick;

	// If there is no custom click handler, create one that navigates to `path`.
	if ( ! handleClick && path ) {
		handleClick = ( e ) => {
			e.preventDefault();
			// history.replaceState( { focusTargetSelector: `[$id="${ path }"]` } );
			history.push( { path } );
		};
	}

	return (
		<Item
			className={ classnames(
				'edit-site-sidebar-navigation-item',
				{ 'with-suffix': ! withChevron && suffix },
				className
			) }
			onClick={ handleClick }
			{ ...props }
		>
			<HStack justify="flex-start">
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
			</HStack>
		</Item>
	);
}
