/* eslint-disable jsdoc/no-undefined-types */
/**
 * @template {import('./types').State} S
 * @template {{ type: unknown }} A
 * @param {(state: S, action: A) => S} reducer
 * @param {S} initial
 *
 * @return {import('./types').Redux<S, A>} A thin redux implementation.
 */
export const redux = ( reducer, initial ) => ( set, get, api ) => {
	api.dispatch = ( /** @type {A} */ action ) => {
		set( ( /** @type {S} */ state ) => reducer( state, action ) );
		if ( api.devtools ) {
			api.devtools.send( api.devtools.prefix + action.type, get() );
		}
		return action;
	};
	return { dispatch: api.dispatch, ...initial };
};

/**
 * @template {import('./types').State} S
 * @param {import('./types').StateCreator<S, import('./types').NamedSet<S>>} fn
 * @param {string} [prefix]
 *
 * @return {import('./types').DevTools<S>} Devtools for Redux implementation
 */
export const devtools = ( fn, prefix ) => ( set, get, api ) => {
	let extension;
	try {
		extension =
			/** @type {any} */ ( window ).__REDUX_DEVTOOLS_EXTENSION__ ||
			/** @type {any} */ ( window ).top.__REDUX_DEVTOOLS_EXTENSION__;
	} catch {}

	if ( ! extension ) {
		if (
			// @ts-ignore
			process.env.NODE_ENV === 'development' &&
			typeof window !== 'undefined'
		) {
			// eslint-disable-next-line no-console
			console.warn( 'Please install/enable Redux devtools extension' );
		}
		api.devtools = null;
		return fn( set, get, api );
	}
	/**
	 * @type {import('./types').NamedSet<S>}
	 */
	const namedSet = ( state, replace, name ) => {
		set( state, replace );
		if ( ! api.dispatch ) {
			api.devtools.send(
				api.devtools.prefix + ( name || 'action' ),
				get()
			);
		}
	};
	const initialState = fn( namedSet, get, api );
	if ( ! api.devtools ) {
		const savedSetState = api.setState;
		api.setState = (
			/** @type {import('./types').PartialState<S>} */ state,
			/** @type {boolean | undefined} */ replace
		) => {
			savedSetState( state, replace );
			api.devtools.send(
				api.devtools.prefix + 'setState',
				api.getState()
			);
		};
		api.devtools = extension.connect( { name: prefix } );
		api.devtools.prefix = prefix ? `${ prefix } > ` : '';
		api.devtools.subscribe( ( /** @type {any} */ message ) => {
			if ( message.type === 'DISPATCH' && message.state ) {
				const ignoreState =
					message.payload.type === 'JUMP_TO_ACTION' ||
					message.payload.type === 'JUMP_TO_STATE';
				if ( ! api.dispatch && ! ignoreState ) {
					api.setState( JSON.parse( message.state ) );
				} else {
					savedSetState( JSON.parse( message.state ) );
				}
			} else if (
				message.type === 'DISPATCH' &&
				message.payload?.type === 'COMMIT'
			) {
				api.devtools.init( api.getState() );
			}
		} );
		api.devtools.init( initialState );
	}
	return initialState;
};

/**
 * @template {import('./types').State} PrimaryState
 * @template {import('./types').State} SecondaryState
 * @param {PrimaryState} initialState
 * @param {import('./types').CombineCreate<PrimaryState, SecondaryState>} create
 *
 * @return {import('./types').StateCreator<PrimaryState & SecondaryState>} State creator.
 */
export const combine = ( initialState, create ) => ( set, get, api ) =>
	Object.assign(
		{},
		initialState,
		create(
			/** @type {import('./types').SetState<PrimaryState>} */ ( set ),
			/** @type {import('./types').GetState<PrimaryState>} */ ( get ),
			/** @type {import('./types').StoreApi<PrimaryState>} */ ( api )
		)
	);

/**
 * @template {import('./types').State} S
 * @param {import('./types').StateCreator<S>} config
 * @param {import('./types').PersistOptions<S>} options
 *
 * @return {import('./types').StateCreator<S>} Persistance middleware
 */
export const persist = ( config, options ) => ( set, get, api ) => {
	const {
		name,
		getStorage = () => window.localStorage,
		serialize = JSON.stringify,
		deserialize = JSON.parse,
		blacklist,
		whitelist,
		onRehydrateStorage,
		version = 0,
	} = options || {};

	/**
	 * @type {import('./types').StateStorage | undefined}
	 */
	let storage;

	try {
		storage = getStorage();
	} catch ( e ) {
		// prevent error if the storage is not defined (e.g. when server side rendering a page)
	}

	if ( ! storage ) return config( set, get, api );

	const setItem = async () => {
		const state = { ...get() };

		if ( whitelist ) {
			Object.keys( state ).forEach( ( key ) => {
				// eslint-disable-next-line no-unused-expressions
				! whitelist.includes( key ) && delete state[ key ];
			} );
		}
		if ( blacklist ) {
			blacklist.forEach( ( key ) => delete state[ key ] );
		}

		// eslint-disable-next-line no-unused-expressions
		storage?.setItem( name, await serialize( { state, version } ) );
	};

	const savedSetState = api.setState;

	api.setState = ( state, replace ) => {
		savedSetState( state, replace );
		setItem();
	};

	// rehydrate initial state with existing stored state
	( async () => {
		const postRehydrationCallback =
			onRehydrateStorage?.( get() ) || undefined;

		try {
			const storageValue = await storage.getItem( name );

			if ( storageValue ) {
				const deserializedStorageValue = await deserialize(
					storageValue
				);

				// if versions mismatch, clear storage by storing the new initial state
				if ( deserializedStorageValue.version !== version ) {
					setItem();
				} else {
					set( deserializedStorageValue.state );
				}
			}
		} catch ( e ) {
			throw new Error( `Unable to get to stored state in "${ name }"` );
		} finally {
			// eslint-disable-next-line no-unused-expressions
			postRehydrationCallback?.( get() );
		}
	} )();

	return config(
		( payload ) => {
			set( payload );
			setItem();
		},
		get,
		api
	);
};
/* eslint-enable jsdoc/no-undefined-types */
