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
			button.addEventListener( 'blur', toggleSearchField );
			document.body.addEventListener( 'click', doHideSearchField );
		};

		const doHideSearchField = () => {
			block.classList.add( hiddenClass );
		};

		searchField.addEventListener( 'focus', doShowSearchField );
	} );
} );
