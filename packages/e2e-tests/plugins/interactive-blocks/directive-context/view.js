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
	},
} );

const html = `
		<div
			data-wp-interactive='{ "namespace": "directive-context-navigate" }'
			data-wp-router-region="navigation"
			data-wp-context='{ "text": "second page" }'
		>
			<div data-testid="navigation text" data-wp-text="context.text"></div>
			<div data-testid="navigation new text" data-wp-text="context.newText"></div>
			<button data-testid="toggle text" data-wp-on--click="actions.toggleText">Toggle Text</button>
			<button data-testid="add new text" data-wp-on--click="actions.addNewText">Add new text</button>
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
		navigate() {
			return import( '@wordpress/interactivity-router' ).then(
				( { actions: routerActions } ) =>
					routerActions.navigate(
						window.location,
						{ force: true, html },
					)
			);

		},
		*asyncNavigate() {
			yield actions.navigate();
			const ctx = getContext();
			ctx.newText = 'changed from async action';
		},
	},
} );
