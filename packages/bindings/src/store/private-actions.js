/**
 * Internal dependencies
 */
import { generateBindingsConnectionKey } from './utils';

/**
 * Register an external source
 *
 * @param {string} source Name of the source to register.
 */
export function registerBindingsSource( source ) {
	return {
		type: 'REGISTER_BINDINGS_SOURCE',
		...source,
	};
}

/**
 * Sets up a subscription to monitor changes
 * in a specified bindings connection.
 *
 * @param {string}   key              - The key identifying the bindings connection to observe.
 * @param {Function} [updateCallback] - Optional callback invoked when the observed property changes.
 * @return {Function}                   Thunk.
 */
export function observeBindingsConnectionChange( key, updateCallback ) {
	return ( { select, registry, dispatch } ) => {
		const handler = select.getBindingsConnectionHandler( key );
		let currentValue = handler.get();

		function watchValueChanges() {
			const value = select.getBindingsConnectionValue( key );
			if ( value === currentValue ) {
				return;
			}

			currentValue = value;
			updateCallback?.( value );
		}

		dispatch( {
			type: 'UPDATE_BINDINGS_CONNECTION',
			key,
			unsubscribe: registry.subscribe( watchValueChanges ),
		} );
	};
}

/**
 * Registers a connection to a bindings source.
 * The connection is established by a combination
 * of the source handler name and the binding arguments.
 *
 * @param {Object}   settings        - Settings.
 * @param {string}   settings.source - The source handler name.
 * @param {Object}   settings.args   - The binding arguments.
 * @param {Function} updateCallback  - Callback invoked when the connection value changes.
 * @return {Function}                  Thunk function for Redux dispatch, registers the connection.
 */
export function registerBindingsConnection( { source, args }, updateCallback ) {
	return ( { dispatch, select } ) => {
		const settings = select.getBindingsSource( source );
		if ( ! settings ) {
			return;
		}

		// Do not register if it's already registered.
		const key = generateBindingsConnectionKey( { source, args } );
		if ( select.getBindingsConnectionHandler( key ) ) {
			return;
		}

		const { connect } = settings;
		const handler = connect( args );

		dispatch( {
			type: 'REGISTER_BINDINGS_CONNECTION',
			key,
			...handler,
		} );

		/*
		 * Observe the external property to monitor changes.
		 * To do: scale this to register multiple callbacks.
		 */
		dispatch.observeBindingsConnectionChange( key, updateCallback );
	};
}

/**
 * Updates the value of a bindings connection.
 * The connection is identified by the connection key.
 *
 * @param {string} key   - The connection key.
 * @param {*}      value - The new value.
 * @return {Function}     Thunk function for Redux dispatch, updates the connection value.
 */
export function updateBindingsConnectionValue( key, value ) {
	return ( { select } ) => {
		const bindingsConnection = select.getBindingsConnectionHandler( key );
		if ( ! bindingsConnection ) {
			return;
		}

		bindingsConnection.update( value );
	};
}
