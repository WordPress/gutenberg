( function() {
	// Set up a data store to fetch a preview from the plugin's API
	// so we can test that the selectors are used correctly by the embed blocks.
	const { data, apiFetch, hooks, element, components, editor, i18n } = wp;
	const { registerStore, select } = data;
	const { createElement } = element;
	const { addFilter } = hooks;
	const { TextControl, PanelBody, SVG, Path } = components;
	const { InspectorControls } = editor;
	const { __ } = i18n;

	const DEFAULT_STATE = {
		preview: false,
	};

	const actions = {
		setPreview( preview ) {
			return {
				type: 'SET_PREVIEW',
				preview,
			};
		},
		fetchFromAPI( path ) {
			return {
				type: 'FETCH_FROM_API',
				path,
			};
		},
	};

	registerStore( 'extend-embeds', {
		reducer( state = DEFAULT_STATE, action ) {
			switch ( action.type ) {
				case 'SET_PREVIEW':
					return {
						...state,
						preview: {
							html: action.preview,
							provider: 'Reddit',
						},
					};
			}

			return state;
		},

		actions,

		selectors: {
			getPreview( state ) {
				const { preview } = state;
				return preview;
			},
			isFetchingPreview() {
				return select( 'core/data' ).isResolving( 'extend-embeds', 'getPreview' );
			},
		},

		controls: {
			FETCH_FROM_API( action ) {
				return apiFetch( { path: action.path } );
			},
		},

		resolvers: {
			* getPreview() {
				const path = '/extend-embeds/v1/preview/';
				const preview = yield actions.fetchFromAPI( path );
				return actions.setPreview( preview );
			},
		},
	} );

	const redditInspector = ( props ) => {
		const { attributes = {} } = props;
		const { extraOptions = {} } = attributes;
		const { saveContent } = extraOptions;
		const onChangeSaveContent = ( value ) => {
			const { setAttributes } = props;
			setAttributes( { extraOptions: { saveContent: value } } );
		};
		return createElement(
			InspectorControls,
			null,
			createElement(
				PanelBody,
				{ title: __('Extra Reddit Settings'), className: 'blocks-reddit-extra' },
				createElement( TextControl, {
					value: saveContent,
					onChange: onChangeSaveContent,
					label: __('The content to save')
				} )
			)
		);
	};

	// Replace the default save with one that renders the `saveContent` from `extraOptions`
	const redditSave = ( attributes = {} ) => {
		const { extraOptions = {} } = attributes;
		const { saveContent = '' } = extraOptions;
		return createElement(
			'p',
			null,
			saveContent
		);
	};

	const redditIcon = createElement( SVG, {
		viewBox: "0 0 24 24"
	}, createElement( Path, {
		d: "M22 11.816c0-1.256-1.02-2.277-2.277-2.277-.593 0-1.122.24-1.526.613-1.48-.965-3.455-1.594-5.647-1.69l1.17-3.702 3.18.75c.01 1.027.847 1.86 1.877 1.86 1.035 0 1.877-.84 1.877-1.877 0-1.035-.842-1.877-1.877-1.877-.77 0-1.43.466-1.72 1.13L13.55 3.92c-.204-.047-.4.067-.46.26l-1.35 4.27c-2.317.037-4.412.67-5.97 1.67-.402-.355-.917-.58-1.493-.58C3.02 9.54 2 10.56 2 11.815c0 .814.433 1.523 1.078 1.925-.037.222-.06.445-.06.673 0 3.292 4.01 5.97 8.94 5.97s8.94-2.678 8.94-5.97c0-.214-.02-.424-.052-.632.687-.39 1.154-1.12 1.154-1.964zm-3.224-7.422c.606 0 1.1.493 1.1 1.1s-.493 1.1-1.1 1.1-1.1-.494-1.1-1.1.493-1.1 1.1-1.1zm-16 7.422c0-.827.673-1.5 1.5-1.5.313 0 .598.103.838.27-.85.675-1.477 1.478-1.812 2.36-.32-.274-.525-.676-.525-1.13zm9.183 7.79c-4.502 0-8.165-2.33-8.165-5.193S7.457 9.22 11.96 9.22s8.163 2.33 8.163 5.193-3.663 5.193-8.164 5.193zM20.635 13c-.326-.89-.948-1.7-1.797-2.383.247-.186.55-.3.882-.3.827 0 1.5.672 1.5 1.5 0 .482-.23.91-.586 1.184zm-11.64 1.704c-.76 0-1.397-.616-1.397-1.376 0-.76.636-1.397 1.396-1.397.76 0 1.376.638 1.376 1.398 0 .76-.616 1.376-1.376 1.376zm7.405-1.376c0 .76-.615 1.376-1.375 1.376s-1.4-.616-1.4-1.376c0-.76.64-1.397 1.4-1.397.76 0 1.376.638 1.376 1.398zm-1.17 3.38c.15.152.15.398 0 .55-.675.674-1.728 1.002-3.22 1.002l-.01-.002-.012.002c-1.492 0-2.544-.328-3.218-1.002-.152-.152-.152-.398 0-.55.152-.152.4-.15.55 0 .52.52 1.394.775 2.67.775l.01.002.01-.002c1.276 0 2.15-.253 2.67-.775.15-.152.398-.152.55 0z"
	} ) );

	const addEnhancedRedditBlock = ( blockSettings ) => {
		return [
			{
				name: 'extend-embeds/reddit',
				settings: {
					title: 'Reddit with extra stuff',
					icon: redditIcon,
					description: __( 'Embed a Reddit thread with extra options.' ),
					preview: select( 'extend-embeds' ).getPreview,
					fetching: select( 'extend-embeds' ).isFetchingPreview,
					save: redditSave,
					inspector: redditInspector,
				},
				patterns: [ /^https?:\/\/(www\.)?reddit\.com\/.+/i ],
			},
			...blockSettings,
		];
	};

	// Add a filter that adds the enhanced reddit block to the list of other embed blocks.
	addFilter(
		'blockLibrary.Embed.othersSettings',
		'test/extend-embeds',
		addEnhancedRedditBlock
	);
} )();
