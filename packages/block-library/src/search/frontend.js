// eslint-disable-next-line @wordpress/no-global-event-listener
document.addEventListener( 'DOMContentLoaded', () => {
	const transitionDuration = 300;
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
		setTimeout(
			() =>
				( searchField.style.transitionDuration = `${ transitionDuration }ms` ),
			transitionDuration
		);

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
		};

		wrapper.addEventListener( 'click', toggleSearchField );
	} );
} );
