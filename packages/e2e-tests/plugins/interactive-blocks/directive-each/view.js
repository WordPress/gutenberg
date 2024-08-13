/**
 * WordPress dependencies
 */
import {
	store,
	getContext,
	useInit,
	privateApis,
} from '@wordpress/interactivity';

const { state } = store( 'directive-each' );

store( 'directive-each', {
	state: {
		letters: [ 'A', 'B', 'C' ],
	},
} );

store( 'directive-each', {
	state: {
		fruits: [ 'avocado', 'banana', 'cherimoya' ],
		get fruitId() {
			const { idPrefix, fruit } = getContext();
			return `${ idPrefix }${ fruit }`;
		},
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
				isbn: '9780553588484',
			},
			{
				title: 'A Clash of Kings',
				author: 'George R.R. Martin',
				isbn: '9780553381696',
			},
			{
				title: 'A Storm of Swords',
				author: 'George R.R. Martin',
				isbn: '9780553573428',
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
				isbn: '9780553582024',
			};
			state.books.splice( 0, 0, book );
		},
		replaceBook() {
			const book = {
				title: 'A Feast for Crows',
				author: 'George R.R. Martin',
				isbn: '9780553582024',
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
		},
	},
} );

store( 'directive-each', {
	state: {
		emptyList: [],
	},
	actions: {
		addItem() {
			state.emptyList.push( `item ${ state.emptyList.length }` );
		},
	},
} );

store( 'directive-each', {
	state: {
		numbersAndNames: [
			{ name: 'two', value: 2 },
			{ name: 'three', value: 3 },
		],
	},
	actions: {
		unshiftNumberAndName() {
			state.numbersAndNames.unshift( { name: 'one', value: 1 } );
		},
	},
} );

store( 'directive-each', {
	state: {
		animalBreeds: [
			{ name: 'Dog', breeds: [ 'chihuahua', 'rottweiler' ] },
			{ name: 'Cat', breeds: [ 'sphynx', 'siamese' ] },
		],
	},
	actions: {
		addAnimal() {
			state.animalBreeds.unshift( {
				name: 'Rat',
				breeds: [ 'dumbo', 'rex' ],
			} );
		},
		addBreeds() {
			state.animalBreeds.forEach( ( { name, breeds } ) => {
				if ( name === 'Dog' ) {
					breeds.unshift( 'german shepherd' );
				}
				if ( name === 'Cat' ) {
					breeds.unshift( 'maine coon' );
				}
				if ( name === 'Rat' ) {
					breeds.unshift( 'satin' );
				}
			} );
		},
	},
} );

const html = `
<div
	data-wp-interactive="directive-each"
	data-wp-router-region="navigation-updated list"
	data-wp-context='{ "a": 1, "b": 2, "c": 3, "d": 4 }'
	data-testid="navigation-updated list"
>
	<button
		data-testid="navigate"
		data-wp-on--click="actions.navigate"
	>Navigate</button>
	<template data-wp-each="state.list">
		<p data-wp-text="context.item" data-testid="item"></p>
	</template>
	<p data-testid="item" data-wp-each-child>alpha</p>
	<p data-testid="item" data-wp-each-child>beta</p>
	<p data-testid="item" data-wp-each-child>gamma</p>
	<p data-testid="item" data-wp-each-child>delta</p>
</div>
`;

store( 'directive-each', {
	state: {
		get list() {
			const ctx = getContext();
			return Object.keys( ctx ).sort();
		},
	},
	actions: {
		*navigate() {
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			return actions.navigate( window.location, {
				force: true,
				html,
			} );
		},
	},
} );

const { directive } = privateApis(
	'I acknowledge that using private APIs means my theme or plugin will inevitably break in the next version of WordPress.'
);

/*
 * This is a high-priority version of the wp-init directive, to test directives
 * with such priority or lower don't run in elements with wp-each-child.
 */
directive(
	'priority-2-init',
	( { directives: { 'priority-2-init': init }, evaluate } ) => {
		init.forEach( ( entry ) => {
			useInit( () => evaluate( entry ) );
		} );
	},
	{ priority: 2 }
);

store( 'directive-each', {
	callbacks: {
		updateCallbackRunCount() {
			const ctx = getContext();
			ctx.callbackRunCount += 1;
		},
	},
} );
