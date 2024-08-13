/**
 * WordPress dependencies
 */
import { store, getContext } from '@wordpress/interactivity';

store( 'directive-context', {
	state: {
		get renderContext() {
			const ctx = getContext();
			return JSON.stringify( ctx, undefined, 2 );
		},
		get selected() {
			const { list, selected } = getContext();
			return list.find( ( obj ) => obj === selected )?.text;
		},
		get isProxyPreserved() {
			const ctx = getContext();
			const pointer = ctx.obj;
			return pointer === ctx.obj;
		},
		get isProxyPreservedOnCopy() {
			const { obj, obj2 } = getContext();
			return obj === obj2;
		},
	},
	actions: {
		updateContext( event ) {
			const ctx = getContext();
			const { name, value } = event.target;
			const [ key, ...path ] = name.split( '.' ).reverse();
			const obj = path.reduceRight( ( o, k ) => o[ k ], ctx );
			obj[ key ] = value;
		},
		toggleContextText() {
			const ctx = getContext();
			ctx.text = ctx.text === 'Text 1' ? 'Text 2' : 'Text 1';
		},
		selectItem( event ) {
			const ctx = getContext();
			const value = parseInt( event.target.value );
			ctx.selected = ctx.list.find( ( { id } ) => id === value );
		},
		replaceObj() {
			const ctx = getContext();
			ctx.obj = { overwritten: true };
		},
		copyObj() {
			const ctx = getContext();
			ctx.obj2 = ctx.obj;
		},
	},
} );

const html = `
		<div
			data-wp-interactive="directive-context-navigate"
			data-wp-router-region="navigation"
			data-wp-context='{ "text": "second page", "text2": "second page" }'
		>
			<div data-wp-context='{}'>
				<div data-testid="navigation inherited text" data-wp-text="context.text"></div>
				<div data-testid="navigation inherited text2" data-wp-text="context.text2"></div>
			</div>
			<div data-testid="navigation text" data-wp-text="context.text"></div>
			<div data-testid="navigation new text" data-wp-text="context.newText"></div>
			<button data-testid="toggle text" data-wp-on--click="actions.toggleText">Toggle Text</button>
			<button data-testid="add new text" data-wp-on--click="actions.addNewText">Add New Text</button>
			<button data-testid="add text2" data-wp-on--click="actions.addText2">Add Text 2</button>
			<button data-testid="navigate" data-wp-on--click="actions.navigate">Navigate</button>
			<button data-testid="async navigate" data-wp-on--click="actions.asyncNavigate">Async Navigate</button>
		</div>`;

const { actions } = store( 'directive-context-navigate', {
	actions: {
		toggleText() {
			const ctx = getContext();
			ctx.text = 'changed dynamically';
		},
		addNewText() {
			const ctx = getContext();
			ctx.newText = 'some new text';
		},
		addText2() {
			const ctx = getContext();
			ctx.text2 = 'some new text';
		},
		navigate() {
			return import( '@wordpress/interactivity-router' ).then(
				( { actions: routerActions } ) => {
					const url = new URL( window.location.href );
					url.searchParams.set( 'next_page', 'true' );
					return routerActions.navigate( url, { force: true, html } );
				}
			);
		},
		*asyncNavigate() {
			yield actions.navigate();
			const ctx = getContext();
			ctx.newText = 'changed from async action';
		},
	},
} );

store( 'directive-context-watch', {
	actions: {
		increment: () => {
			const ctx = getContext();
			ctx.counter = ctx.counter + 1;
		},
	},
	callbacks: {
		countChanges: () => {
			const ctx = getContext();
			// Subscribe to changes in counter.
			// eslint-disable-next-line no-unused-expressions
			ctx.counter;
			ctx.changes = ctx.changes + 1;
		},
	},
} );
