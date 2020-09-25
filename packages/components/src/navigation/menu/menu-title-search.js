/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { Icon, closeSmall, search as searchIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Button from '../../button';
import VisuallyHidden from '../../visually-hidden';
import { useNavigationMenuContext } from './context';
import { MenuTitleSearchUI } from '../styles/navigation-styles';

export default function MenuTitleSearch( {
	closeSearch,
	onSearch,
	search,
	title,
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

	const onSearchClose = () => {
		onSearch( '' );
		closeSearch();
	};

	function onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			onSearchClose();
		}
	}

	const inputId = `components-navigation__menu-title-search-${ menu }`;
	/* translators: placeholder for sidebar search box. %s: menu title */
	const placeholder = sprintf( __( 'Search in %s' ), title );

	return (
		<MenuTitleSearchUI className="components-navigation__menu-title-search">
			<Icon icon={ searchIcon } />

			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ placeholder }
			</VisuallyHidden>

			<input
				autoComplete="off"
				className="components-text-control__input"
				id={ inputId }
				onChange={ ( event ) => onSearch( event.target.value ) }
				onKeyDown={ onKeyDown }
				placeholder={ placeholder }
				ref={ inputRef }
				type="search"
				value={ search }
			/>

			<Button isSmall isTertiary onClick={ onSearchClose }>
				<Icon icon={ closeSmall } />
			</Button>
		</MenuTitleSearchUI>
	);
}
