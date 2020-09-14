/**
 * WordPress dependencies
 */
import { Icon, closeSmall, search as searchIcon } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import { MenuTitleSearchUI, MenuTitleUI } from './styles/navigation-styles';
import TextControl from '../text-control';

export default function NavigationMenuTitle( {
	hasSearch,
	search,
	setSearch,
	title,
} ) {
	const [ isSearching, setIsSearching ] = useState( false );

	if ( ! title ) {
		return null;
	}

	const onSearchClose = () => {
		setSearch( '' );
		setIsSearching( false );
	};

	if ( isSearching ) {
		return (
			<MenuTitleSearchUI>
				<TextControl
					onChange={ ( value ) => setSearch( value ) }
					value={ search }
				/>

				<Button isSmall isTertiary onClick={ onSearchClose }>
					<Icon icon={ closeSmall } />
				</Button>
			</MenuTitleSearchUI>
		);
	}

	return (
		<MenuTitleUI
			as="h2"
			className="components-navigation__menu-title"
			variant="subtitle"
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
		</MenuTitleUI>
	);
}
