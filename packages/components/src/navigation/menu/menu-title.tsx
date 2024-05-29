/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, search as searchIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getAnimateClassName } from '../../animate';
import Button from '../../button';
import MenuTitleSearch from './menu-title-search';
import {
	GroupTitleUI,
	MenuTitleActionsUI,
	MenuTitleUI,
} from '../styles/navigation-styles';
import { useNavigationMenuContext } from './context';
import { SEARCH_FOCUS_DELAY } from '../constants';

import type { NavigationMenuTitleProps } from '../types';

export default function NavigationMenuTitle( {
	hasSearch,
	onSearch,
	search,
	title,
	titleAction,
}: NavigationMenuTitleProps ) {
	const [ isSearching, setIsSearching ] = useState( false );
	const { menu } = useNavigationMenuContext();
	const searchButtonRef = useRef< HTMLElement >( null );

	if ( ! title ) {
		return null;
	}

	const onCloseSearch = () => {
		setIsSearching( false );

		// Wait for the slide-in animation to complete before focusing the search button.
		// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
		setTimeout( () => {
			searchButtonRef.current?.focus();
		}, SEARCH_FOCUS_DELAY );
	};

	const menuTitleId = `components-navigation__menu-title-${ menu }`;
	/* translators: search button label for menu search box. %s: menu title */
	const searchButtonLabel = sprintf( __( 'Search in %s' ), title );

	return (
		<MenuTitleUI className="components-navigation__menu-title">
			{ ! isSearching && (
				<GroupTitleUI
					as="h2"
					className="components-navigation__menu-title-heading"
					level={ 3 }
				>
					<span id={ menuTitleId }>{ title }</span>

					{ ( hasSearch || titleAction ) && (
						<MenuTitleActionsUI>
							{ titleAction }

							{ hasSearch && (
								<Button
									size="small"
									variant="tertiary"
									label={ searchButtonLabel }
									onClick={ () => setIsSearching( true ) }
									ref={ searchButtonRef }
								>
									<Icon icon={ searchIcon } />
								</Button>
							) }
						</MenuTitleActionsUI>
					) }
				</GroupTitleUI>
			) }

			{ isSearching && (
				<div
					className={ getAnimateClassName( {
						type: 'slide-in',
						origin: 'left',
					} ) }
				>
					<MenuTitleSearch
						onCloseSearch={ onCloseSearch }
						onSearch={ onSearch }
						search={ search }
						title={ title }
					/>
				</div>
			) }
		</MenuTitleUI>
	);
}
