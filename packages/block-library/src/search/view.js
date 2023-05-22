window.addEventListener( 'DOMContentLoaded', () => {
	const hiddenClass = 'wp-block-search__searchfield-hidden';

	Array.from(
		document.getElementsByClassName(
			'wp-block-search__button-behavior-expand'
		)
	).forEach( ( block ) => {
		const searchField = block.querySelector( '.wp-block-search__input' );
		const searchButton = block.querySelector( '.wp-block-search__button' );
		const activeElement = block.ownerDocument.activeElement;

		const toggleSearchField = ( showSearchField ) => {
			if ( showSearchField ) {
				return block.classList.remove( hiddenClass );
			}

			return block.classList.add( hiddenClass );
		};

		const hideSearchField = ( e ) => {
			if (
				! e.target.closest( '.wp-block-search__inside-wrapper' ) &&
				activeElement !== searchButton &&
				activeElement !== searchField
			) {
				return toggleSearchField( false );
			}

			if ( e.key === 'Escape' ) {
				searchButton.focus();
				return toggleSearchField( false );
			}
		};

		const handleButtonClick = ( e ) => {
			if ( block.classList.contains( hiddenClass ) ) {
				e.preventDefault();
				searchField.focus();
				toggleSearchField( true );
			}
		};

		searchField.addEventListener( 'blur', hideSearchField );
		searchField.addEventListener( 'keydown', ( e ) => {
			hideSearchField( e );
		} );
		searchButton.addEventListener( 'click', handleButtonClick );
		document.body.addEventListener( 'click', hideSearchField );
	} );
} );
