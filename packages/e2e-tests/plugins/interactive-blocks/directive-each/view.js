/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

const { state } = store( 'directive-each' );

store( 'directive-each', {
	state: {
		letters: [ 'A', 'B', 'C' ],
	},
} );

store( 'directive-each', {
	state: {
		fruits: [ 'avocado', 'banana', 'cherimoya' ],
	},
	actions: {
		removeFruit() {
			const { fruit } = getContext();
			state.fruits.splice( state.fruits.indexOf( fruit ), 1 );
		},
		rotateFruits() {
			const fruit = state.fruits.pop();
			state.fruits.splice( 0, 0, fruit );
		},
		addFruit() {
			state.fruits.splice( 0, 0, 'ananas' );
		},
		replaceFruit() {
			state.fruits.splice( 0, 1, 'ananas' );
		},
	},
} );

store( 'directive-each', {
	state: {
		books: [
			{
				title: 'A Game of Thrones',
				author: 'George R.R. Martin',
				isbn: "9780553588484",
			},
			{
				title: 'A Clash of Kings',
				author: 'George R.R. Martin',
				isbn: "9780553381696",
			},
			{
				title: 'A Storm of Swords',
				author: 'George R.R. Martin',
				isbn: "9780553573428",
			},
		],
	},
	actions: {
		removeBook() {
			const { book } = getContext();
			state.books.splice( state.books.indexOf( book ), 1 );
		},
		rotateBooks() {
			const book = state.books.pop();
			state.books.splice( 0, 0, book );
		},
		addBook() {
			const book = {
				title: 'A Feast for Crows',
				author: 'George R.R. Martin',
				isbn: "9780553582024",
			};
			state.books.splice( 0, 0, book );
		},
		replaceBook() {
			const book = {
				title: 'A Feast for Crows',
				author: 'George R.R. Martin',
				isbn: "9780553582024",
			};
			state.books.splice( 0, 1, book );
		},
		modifyBook() {
			const [ book ] = state.books;
			book.title = book.title.toUpperCase();
		},
	},
} );

store( 'directive-each', {
	state: {
		numbers: [ 1, 2, 3 ],
	},
	actions: {
		shiftNumber() {
			state.numbers.shift();
		},
		unshiftNumber() {
			if ( state.numbers.length > 0 ) {
				state.numbers.unshift( state.numbers[ 0 ] - 1 );
			}
		}
	},
} );

store( 'directive-each', {
	state: {
		emptyList: []
	},
	actions: {
		addItem() {
			state.emptyList.push( `item ${ state.emptyList.length }` );
		}
	},
} );

store( 'directive-each', {
	state: {
		numbersAndNames: [
			{ name: "two", value: 2 },
			{ name: "three", value: 3 },
		],
	},
	actions: {
		unshiftNumberAndName() {
			state.numbersAndNames.unshift( { name: "one", value: 1 } );
		}
	},
} );



