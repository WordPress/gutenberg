/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { Icon, closeSmall, search as searchIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from '../../button';
import { useNavigationMenuContext } from './context';
import { MenuTitleSearchUI } from '../styles/navigation-styles';

export default function MenuTitleSearch( {
	controlledSearch,
	onControlledSearch,
	setIsSearching,
	setUncontrolledSearch,
	title,
	uncontrolledSearch,
} ) {
	const { menu } = useNavigationMenuContext();
	const inputRef = useRef();

	// Wait for the slide-in animation to complete before autofocusing the input.
	// This prevents scrolling to the input during the animation.
	useEffect( () => {
		const delayedFocus = setTimeout( () => {
			inputRef.current.focus();
		}, 100 );

		return () => {
			clearTimeout( delayedFocus );
		};
	}, [] );

	const isControlledSearch = !! onControlledSearch;

	const onChange = ( event ) => {
		if ( isControlledSearch ) {
			onControlledSearch( event.target.value );
		} else {
			setUncontrolledSearch( event.target.value );
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
		<MenuTitleSearchUI className="components-navigation__menu-title-search">
			<Icon icon={ searchIcon } />

			<input
				autoComplete="off"
				className="components-text-control__input"
				id={ `components-navigation__menu-title-search-${ menu }` }
				onChange={ onChange }
				placeholder={ placeholder }
				ref={ inputRef }
				type="search"
				value={
					isControlledSearch ? controlledSearch : uncontrolledSearch
				}
			/>

			<Button isSmall isTertiary onClick={ onSearchClose }>
				<Icon icon={ closeSmall } />
			</Button>
		</MenuTitleSearchUI>
	);
}
