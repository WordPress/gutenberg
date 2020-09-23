/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { Icon, closeSmall, search as searchIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Animate from '../../animate';
import Button from '../../button';
import TextControl from '../../text-control';
import { useNavigationMenuContext } from './context';
import {
	MenuTitleHeadingUI,
	MenuTitleSearchUI,
	MenuTitleUI,
} from '../styles/navigation-styles';

export default function NavigationMenuTitle( {
	controlledSearch,
	hasSearch,
	onControlledSearch,
	setUncontrolledSearch,
	title,
	uncontrolledSearch,
} ) {
	const [ isSearching, setIsSearching ] = useState( false );
	const { menu } = useNavigationMenuContext();

	if ( ! title ) {
		return null;
	}

	const isControlledSearch = !! onControlledSearch;

	const onChange = ( value ) => {
		if ( isControlledSearch ) {
			onControlledSearch( value );
		} else {
			setUncontrolledSearch( value );
		}
	};

	const onSearchClose = () => {
		if ( isControlledSearch ) {
			onControlledSearch( '' );
		} else {
			setUncontrolledSearch( '' );
		}
		setIsSearching( false );
	};

	/* translators: placeholder for sidebar search box. %s: menu title */
	const placeholder = sprintf( __( 'Search in %s' ), title );

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
							<MenuTitleSearchUI className="components-navigation__menu-title-search">
								<Icon icon={ searchIcon } />

								<TextControl
									autoComplete="off"
									hideLabelFromVision
									id={ `components-navigation__menu-title-search-${ menu }` }
									label={ placeholder }
									onChange={ onChange }
									placeholder={ placeholder }
									type="search"
									value={
										isControlledSearch
											? controlledSearch
											: uncontrolledSearch
									}
								/>

								<Button
									isSmall
									isTertiary
									onClick={ onSearchClose }
								>
									<Icon icon={ closeSmall } />
								</Button>
							</MenuTitleSearchUI>
						</div>
					) }
				</Animate>
			) }
		</MenuTitleUI>
	);
}
