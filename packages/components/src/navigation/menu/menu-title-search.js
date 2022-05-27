/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
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
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			onClose();
		}
	}

	const inputId = `components-navigation__menu-title-search-${ menu }`;
	const placeholder = sprintf(
		/* translators: placeholder for menu search box. %s: menu title */
		__( 'Search %s' ),
		title?.toLowerCase()
	).trim();

	return (
		<div className="components-navigation__menu-title-search">
			<MenuTitleSearchUI
				autoComplete="off"
				className="components-navigation__menu-search-input"
				id={ inputId }
				onChange={ ( value ) => onSearch( value ) }
				onKeyDown={ onKeyDown }
				placeholder={ placeholder }
				onClose={ onClose }
				ref={ inputRef }
				type="search"
				value={ search }
			/>
		</div>
	);
}

export default withSpokenMessages( MenuTitleSearch );
