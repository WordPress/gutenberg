/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { Icon, closeSmall, search as searchIcon } from '@wordpress/icons';
import { __, _n, sprintf } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Button from '../../button';
import VisuallyHidden from '../../visually-hidden';
import withSpokenMessages from '../../higher-order/with-spoken-messages';
import { useNavigationMenuContext } from './context';
import { useNavigationContext } from '../context';
import { MenuTitleSearchUI } from '../styles/navigation-styles';
import { SEARCH_FOCUS_DELAY } from '../constants';

function MenuTitleSearch( {
	debouncedSpeak,
	onCloseSearch,
	onSearch,
	search,
	title,
} ) {
	const {
		navigationTree: { items },
	} = useNavigationContext();
	const { menu } = useNavigationMenuContext();
	const inputRef = useRef();

	// Wait for the slide-in animation to complete before autofocusing the input.
	// This prevents scrolling to the input during the animation.
	useEffect( () => {
		const delayedFocus = setTimeout( () => {
			inputRef.current.focus();
		}, SEARCH_FOCUS_DELAY );

		return () => {
			clearTimeout( delayedFocus );
		};
	}, [] );

	useEffect( () => {
		if ( ! search ) {
			return;
		}

		const count = filter( items, '_isVisible' ).length;
		const resultsFoundMessage = sprintf(
			/* translators: %d: number of results. */
			_n( '%d result found.', '%d results found.', count ),
			count
		);
		debouncedSpeak( resultsFoundMessage );
	}, [ items, search ] );

	const onClose = () => {
		onSearch( '' );
		onCloseSearch();
	};

	function onKeyDown( event ) {
		if ( event.keyCode === ESCAPE ) {
			event.stopPropagation();
			onClose();
		}
	}

	const menuTitleId = `components-navigation__menu-title-${ menu }`;
	const inputId = `components-navigation__menu-title-search-${ menu }`;
	/* translators: placeholder for menu search box. %s: menu title */
	const placeholder = sprintf( __( 'Search in %s' ), title );

	return (
		<MenuTitleSearchUI className="components-navigation__menu-title-search">
			<Icon icon={ searchIcon } />

			<VisuallyHidden as="label" htmlFor={ inputId } id={ menuTitleId }>
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

			<Button
				isSmall
				variant="tertiary"
				label={ __( 'Close search' ) }
				onClick={ onClose }
			>
				<Icon icon={ closeSmall } />
			</Button>
		</MenuTitleSearchUI>
	);
}

export default withSpokenMessages( MenuTitleSearch );
