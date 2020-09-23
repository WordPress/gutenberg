/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, search as searchIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Animate from '../../animate';
import Button from '../../button';
import MenuTitleSearch from './menu-title-search';
import { MenuTitleHeadingUI, MenuTitleUI } from '../styles/navigation-styles';

export default function NavigationMenuTitle( {
	controlledSearch,
	hasSearch,
	onControlledSearch,
	setUncontrolledSearch,
	title,
	uncontrolledSearch,
} ) {
	const [ isSearching, setIsSearching ] = useState( false );

	if ( ! title ) {
		return null;
	}

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
							onClick={ () => setIsSearching( true ) }
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
								controlledSearch={ controlledSearch }
								onControlledSearch={ onControlledSearch }
								setIsSearching={ setIsSearching }
								setUncontrolledSearch={ setUncontrolledSearch }
								title={ title }
								uncontrolledSearch={ uncontrolledSearch }
							/>
						</div>
					) }
				</Animate>
			) }
		</MenuTitleUI>
	);
}
