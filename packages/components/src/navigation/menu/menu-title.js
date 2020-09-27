/**
 * WordPress dependencies
 */
import { useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, search as searchIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Animate from '../../animate';
import Button from '../../button';
import MenuTitleSearch from './menu-title-search';
import { MenuTitleHeadingUI, MenuTitleUI } from '../styles/navigation-styles';

export default function NavigationMenuTitle( {
	hasSearch,
	onSearch,
	search,
	title,
} ) {
	const [ isSearching, setIsSearching ] = useState( false );
	const searchButtonRef = useRef();

	if ( ! title ) {
		return null;
	}

	const onCloseSearch = () => {
		setIsSearching( false );

		// Wait for the slide-in animation to complete before focusing the search button.
		// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
		setTimeout( () => {
			searchButtonRef.current.focus();
		}, 100 );
	};

	/* translators: search button label for menu search box. %s: menu title */
	const searchButtonLabel = sprintf( __( 'Search in %s' ), title );

	return (
		<MenuTitleUI className="components-navigation__menu-title">
			{ ! isSearching && (
				<MenuTitleHeadingUI
					as="h2"
					className="components-navigation__menu-title-heading"
					variant="title.small"
				>
					{ title }

					{ hasSearch && (
						<Button
							isSmall
							isTertiary
							label={ searchButtonLabel }
							onClick={ () => setIsSearching( true ) }
							ref={ searchButtonRef }
							showTooltip
						>
							<Icon icon={ searchIcon } />
						</Button>
					) }
				</MenuTitleHeadingUI>
			) }

			{ isSearching && (
				<Animate type="slide-in" options={ { origin: 'left' } }>
					{ ( { className: animateClassName } ) => (
						<div className={ animateClassName }>
							<MenuTitleSearch
								onCloseSearch={ onCloseSearch }
								onSearch={ onSearch }
								search={ search }
								title={ title }
							/>
						</div>
					) }
				</Animate>
			) }
		</MenuTitleUI>
	);
}
