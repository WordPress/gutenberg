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

	block
		.querySelector( '.wp-block-search__button' )
		.addEventListener( 'click', ( e ) => {
			e.preventDefault();

			const wrapper = block.querySelector(
				'.wp-block-search__inside-wrapper'
			);
			const searchField = block.querySelector(
				'.wp-block-search__input'
			);
			const button = block.querySelector( '.wp-block-search__button' );

			if (
				block.classList.contains(
					'wp-block-search__searchfield-hidden'
				)
			) {
				showSearchField(
					wrapper,
					searchField,
					attributes.width,
					attributes.widthUnit
				);
				block.classList.remove( 'wp-block-search__searchfield-hidden' );
			} else {
				hideSearchField( wrapper, searchField, button );
				block.classList.add( 'wp-block-search__searchfield-hidden' );
			}
		} );
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
