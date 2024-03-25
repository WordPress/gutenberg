/**
 * Internal dependencies
 */
import { generateSourcePropertyKey } from './utils';

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
 * Sets up a subscription to monitor changes in a specified external property.
 *
 * @param {string}   key              - The key identifying the external property to observe.
 * @param {Function} [updateCallback] - Optional callback invoked with the new value when the observed property changes.
 * @return {Function} Thunk function for Redux dispatch, sets up the property change subscription.
 */
export function observeExternalProperty( key, updateCallback ) {
	return ( { select, registry, dispatch } ) => {
		const handler = select.getExternalPropertyHandler( key );
		let currentValue = handler.get();

		function watchValueChanges() {
			const value = select.getExternalPropertieValue( key );
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

export function registerExternalConnection( { source, args }, updateCallback ) {
	return ( { dispatch, select } ) => {
		const settings = select.getBindingsSource( source );
		if ( ! settings ) {
			return;
		}

		// Do not register if it's already registered.
		const key = generateSourcePropertyKey( { source, args } );
		if ( select.getExternalPropertyHandler( key ) ) {
			return;
		}

		const { connect } = settings;
		const handler = connect( args );

		dispatch( {
			type: 'REGISTER_BINDINGS_CONNECTION',
			key,
			...handler,
		} );

		dispatch.observeExternalProperty( key, updateCallback );
	};
}

export function updateExternalProperty( key, value ) {
	return ( { select, dispatch } ) => {
		const handler = select.getExternalPropertyHandler( key );
		if ( ! handler ) {
			return;
		}

		handler.update( value );

		// Fake action
		dispatch( {
			type: 'UPDATE_BINDINGS_CONNECTION_VALUE',
			key,
			value,
		} );
	};
}
