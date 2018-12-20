( function() {
	// Set up a data store to fetch a preview from the plugin's API
	// so we can test that the selectors are used correctly by the embed blocks.
	const { data, apiFetch, hooks, element, components, editor, i18n } = wp;
	const { registerStore, select } = data;
	const { createElement } = element;
	const { addFilter } = hooks;
	const { TextControl, PanelBody } = components;
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

	const addRedditExtras = ( settings ) => {
		if ( 'Reddit' !== settings.title ) {
			return settings;
		}
		return {
			...settings,
			preview: select( 'extend-embeds' ).getPreview,
			fetching: select( 'extend-embeds' ).isFetchingPreview,
			save: redditSave,
			inspector: redditInspector,
		};
	};

	// Add a filter that adds the components and selectors to the target embed block.
	addFilter(
		'blockLibrary.Embed.coreSettings',
		'test/extend-embeds',
		addRedditExtras
	);
} )();
