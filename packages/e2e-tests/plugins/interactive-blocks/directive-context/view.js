( ( { wp } ) => {
	const { store, navigate } = wp.interactivity;

	const html = `
		<div
			data-wp-interactive
			data-wp-navigation-id="navigation"
			data-wp-context='{ "text": "second page" }'
		>
			<div data-testid="navigation text" data-wp-text="context.text"></div>
			<div data-testid="navigation new text" data-wp-text="context.newText"></div>
			<button data-testid="toggle text" data-wp-on--click="actions.toggleText">Toggle Text</button>
			<button data-testid="add new text" data-wp-on--click="actions.addNewText">Add new text</button>
			<button data-testid="navigate" data-wp-on--click="actions.navigate">Navigate</button>
			<button data-testid="async navigate" data-wp-on--click="actions.asyncNavigate">Async Navigate</button>
		</div>`;

	store( {
		derived: {
			renderContext: ( { context } ) => {
				return JSON.stringify( context, undefined, 2 );
			},
		},
		actions: {
			updateContext: ( { context, event } ) => {
				const { name, value } = event.target;
				const [ key, ...path ] = name.split( '.' ).reverse();
				const obj = path.reduceRight( ( o, k ) => o[ k ], context );
				obj[ key ] = value;
			},
			toggleContextText: ( { context } ) => {
				context.text = context.text === 'Text 1' ? 'Text 2' : 'Text 1';
			},
			toggleText: ( { context } ) => {
				context.text = "changed dynamically";
			},
			addNewText: ( { context } ) => {
				context.newText = 'some new text';
			},
			navigate: () => {
				navigate( window.location, {
					force: true,
					html,
				} );
			},
			asyncNavigate: async ({ context }) => {
				await navigate( window.location, {
					force: true,
					html,
				} );
				context.newText = 'changed from async action';
			}
		},
	} );
} )( window );
