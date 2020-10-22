import React from 'react';
import { compose } from '@wordpress/compose';
import { render } from 'react-dom';

import '@wordpress/core-data';
import { withSelect, withDispatch } from '@wordpress/data';

const Books = function ( { books, toggleIsFavourite } ) {
	return books.map( ( b ) => (
		<label key={ b.id } style={ { display: 'block' } }>
			Is Favourite:
			<input
				type="checkbox"
				checked={ b.json.isFavouriteBook }
				onChange={ () => {
					toggleIsFavourite( b );
				} }
			/>
			Title: { b.title.raw }
		</label>
	) );
};

const BookContainer = function ( { books, toggleIsFavourite } ) {
	return (
		<>
			<h2>Books</h2>
			<Books books={ books } toggleIsFavourite={ toggleIsFavourite } />
		</>
	);
};

const App = compose( [
	withSelect( ( select ) => {
		const args = [ 'postType', 'book' ];
		const books = select( 'core' ).getEntityRecords( ...args ) || [];

		return {
			books,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { saveEntityRecord } = dispatch( 'core' );

		return {
			toggleIsFavourite: ( book ) => {
				saveEntityRecord( 'postType', 'book', {
					id: book.id,
					json: {
						...book.json,
						isFavouriteBook: ! book.json.isFavouriteBook,
					},
				} );
			},
		};
	} ),
] )( BookContainer );

const renderApp = () => {
	render( <App />, document.getElementById( 'core-data' ) );
};

setTimeout( renderApp, 0 );
