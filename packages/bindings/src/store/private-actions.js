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
		name: source.name,
		label: source.label,
		connect: source.connect,
	};
}

export function registerExternalPropertyHandler(
	{ source, args },
	updateCallback
) {
	return ( { dispatch, select, registry } ) => {
		const settings = select.getBindingsSource( source );
		if ( ! settings ) {
			return;
		}

		// Do not register if it's already registered.
		const key = generateSourcePropertyKey( source, args );
		if ( select.getExternalPropertyHandler( key ) ) {
			return;
		}

		const { connect } = settings;
		const handler = connect( args );

		let currentValue = handler.get();
		function watchValueChanges() {
			const value = select.getExternalPropertieValue( key );
			if ( value === currentValue ) {
				return;
			}

			currentValue = value;
			updateCallback?.( value );
		}

		const unsubscribe = registry.subscribe( watchValueChanges );

		dispatch( {
			type: 'REGISTER_BINDINGS_SOURCE_PROPERTY',
			key,
			unsubscribe,
			...handler,
		} );
	};
}

export function updateExternalProperty( key, value ) {
	return ( { select } ) => {
		const handler = select.getExternalPropertyHandler( key );
		if ( ! handler ) {
			return;
		}

		handler.update( value );
	};
}
