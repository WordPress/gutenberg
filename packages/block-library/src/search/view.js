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
				e.type === 'blur' &&
				( e.relatedTarget !== searchButton ||
					e.target === searchButton )
			) {
				return toggleSearchField( false );
			}
			if (
				! e.target.closest( '.wp-block-search__inside-wrapper' ) &&
				activeElement !== searchButton &&
				activeElement !== searchField
			) {
				return toggleSearchField( false );
			}
		};

		const handleButtonClick = ( e ) => {
			if ( block.classList.contains( hiddenClass ) ) {
				e.preventDefault();
				searchField.focus();
			}
		};

		searchField.addEventListener( 'focus', () =>
			toggleSearchField( true )
		);
		searchField.addEventListener( 'blur', hideSearchField );
		searchButton.addEventListener( 'click', handleButtonClick );
		searchButton.addEventListener( 'blur', hideSearchField );
		document.body.addEventListener( 'click', hideSearchField );
	} );
} );
