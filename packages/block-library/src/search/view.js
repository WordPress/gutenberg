window.addEventListener( 'DOMContentLoaded', () => {
	const hiddenClass = 'wp-block-search__searchfield-hidden';
	const wrapperClass = '.wp-block-search__inside-wrapper';
	const buttonClass = '.wp-block-search__button';

	Array.from(
		document.getElementsByClassName(
			'wp-block-search__button-behavior-expand'
		)
	).forEach( ( block ) => {
		const wrapper = block.querySelector( wrapperClass );
		const searchField = block.querySelector( '.wp-block-search__input' );
		const button = block.querySelector( buttonClass );

		// Hide search on init.
		block.classList.add( hiddenClass );

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
			block.classList.remove( hiddenClass );
			searchField.focus();

			wrapper.removeEventListener( 'click', toggleSearchField );
			button.removeEventListener( 'focus', toggleSearchField );
			document.body.addEventListener( 'click', doSearch );
		};

		const doHideSearchField = () => {
			block.classList.add( hiddenClass );
		};

		const doSearch = ( e ) => {
			if ( e.target.closest( wrapperClass ) ) {
				return false;
			}

			doHideSearchField();

			document.body.removeEventListener( 'click', doSearch );
			wrapper.addEventListener( 'click', toggleSearchField );
			button.addEventListener( 'focus', toggleSearchField );
		};

		wrapper.addEventListener( 'click', toggleSearchField );
		button.addEventListener( 'focus', toggleSearchField );
	} );
} );
