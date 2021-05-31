/**
 * Internal dependencies
 */
import { showSearchField, hideSearchField } from './utils.js';

const wpBlockSearch = ( block ) => {
	const attributeContainer = block.querySelector(
		'.wp-block-search__attributes'
	);

	if ( ! attributeContainer ) {
		return;
	}

	let attributes;
	try {
		attributes = JSON.parse( attributeContainer.text );
	} catch ( e ) {
		return;
	}
	attributeContainer.remove();

	const hiddenClass = 'wp-block-search__searchfield-hidden';
	const wrapperClass = '.wp-block-search__inside-wrapper';
	const buttonClass = '.wp-block-search__button';

	const wrapper = block.querySelector( wrapperClass );
	const searchField = block.querySelector( '.wp-block-search__input' );
	const button = block.querySelector( buttonClass );

	const toggleSearchField = ( e ) => {
		if ( e.target !== button && ! e.target.closest( buttonClass ) ) {
			return false;
		}

		e.preventDefault();

		return block.classList.contains( hiddenClass )
			? doShowSearchField()
			: doHideSearchField();
	};

	const doShowSearchField = () => {
		showSearchField(
			wrapper,
			searchField,
			attributes.width,
			attributes.widthUnit
		);
		block.classList.remove( hiddenClass );
		searchField.focus();

		wrapper.removeEventListener( 'click', toggleSearchField );
		document.body.addEventListener( 'click', doSearch );
	};

	const doHideSearchField = () => {
		hideSearchField( wrapper, searchField, button );
		block.classList.add( hiddenClass );
	};

	const doSearch = ( e ) => {
		if ( e.target.closest( wrapperClass ) ) {
			return false;
		}

		doHideSearchField();

		document.body.removeEventListener( 'click', doSearch );
		wrapper.addEventListener( 'click', toggleSearchField );
	};

	wrapper.addEventListener( 'click', toggleSearchField );
};

// eslint-disable-next-line @wordpress/no-global-event-listener
document.addEventListener( 'DOMContentLoaded', () => {
	Array.from(
		document.getElementsByClassName(
			'wp-block-search__button-behavior-expand'
		)
	).forEach( ( block ) => {
		wpBlockSearch( block );
	} );
} );
