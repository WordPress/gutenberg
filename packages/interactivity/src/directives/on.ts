import { useInit, splitTask, warn } from '../utils';
import {
	directive,
	isNonDefaultDirectiveSuffix,
	type DirectiveCallback,
	type DirectiveEntry,
} from '../hooks';
import {
	warnEventNameWithTwoHyphens,
	warnWithSyncEvent,
} from './utils/warnings';

/**
 * Wraps event object to warn about access of synchronous properties and methods.
 *
 * For all store actions attached to an event listener the event object is proxied via this function, unless the action
 * uses the `withSyncEvent()` utility to indicate that it requires synchronous access to the event object.
 *
 * At the moment, the proxied event only emits warnings when synchronous properties or methods are being accessed. In
 * the future this will be changed and result in an error. The current temporary behavior allows implementers to update
 * their relevant actions to use `withSyncEvent()`.
 *
 * For additional context, see https://github.com/WordPress/gutenberg/issues/64944.
 *
 * @param event Event object.
 * @return Proxied event object.
 */
function wrapEventAsync( event: Event ) {
	const handler = {
		get( target: Event, prop: string | symbol, receiver: any ) {
			const value = target[ prop ];
			switch ( prop ) {
				case 'currentTarget':
					if ( globalThis.SCRIPT_DEBUG ) {
						warn(
							`Accessing the synchronous event.${ prop } property in a store action without wrapping it in withSyncEvent() is deprecated and will stop working in WordPress 7.0. Please wrap the store action in withSyncEvent().`
						);
					}
					break;
				case 'preventDefault':
				case 'stopImmediatePropagation':
				case 'stopPropagation':
					if ( globalThis.SCRIPT_DEBUG ) {
						warn(
							`Using the synchronous event.${ prop }() function in a store action without wrapping it in withSyncEvent() is deprecated and will stop working in WordPress 7.0. Please wrap the store action in withSyncEvent().`
						);
					}
					break;
			}
			if ( value instanceof Function ) {
				return function ( this: any, ...args: any[] ) {
					return value.apply(
						this === receiver ? target : this,
						args
					);
				};
			}
			return value;
		},
	};

	return new Proxy( event, handler );
}

/**
 * Creates a directive that adds an event listener to the global window or
 * document object using the full directive suffix as its event name.
 *
 * @param type 'window' or 'document'
 * @return Directive callback that manages the global event listener.
 */
const getGlobalEventDirective = (
	type: 'window' | 'document'
): DirectiveCallback => {
	return ( { directives, evaluate } ) => {
		directives[ `on-${ type }` ]
			.filter( isNonDefaultDirectiveSuffix )
			.forEach( ( entry ) => {
				const eventName = entry.suffix;
				if ( globalThis.SCRIPT_DEBUG ) {
					if ( eventName.includes( '--' ) ) {
						warnEventNameWithTwoHyphens(
							`on-${ type }`,
							eventName
						);
					}
				}
				useInit( () => {
					const cb = ( event: Event ) => {
						const result = evaluate( entry );
						if ( typeof result === 'function' ) {
							if ( ! result?.sync ) {
								event = wrapEventAsync( event );
							}
							result( event );
						}
					};
					const globalVar = type === 'window' ? window : document;
					globalVar.addEventListener( eventName, cb );
					return () => globalVar.removeEventListener( eventName, cb );
				} );
			} );
	};
};

/**
 * Creates a directive that adds an async event listener to the global window or
 * document object.
 *
 * Unlike the synchronous directives, the deprecated async directives still cut
 * the event name at `--`, so the legacy two-hyphen unique ID syntax keeps
 * working until they are removed.
 *
 * @param type 'window' or 'document'
 */
const getGlobalAsyncEventDirective = (
	type: 'window' | 'document'
): DirectiveCallback => {
	return ( { directives, evaluate } ) => {
		directives[ `on-async-${ type }` ]
			.filter( isNonDefaultDirectiveSuffix )
			.forEach( ( entry ) => {
				if ( globalThis.SCRIPT_DEBUG ) {
					warnWithSyncEvent( `on-async-${ type }`, `on-${ type }` );
				}
				const eventName = entry.suffix.split( '--', 1 )[ 0 ];
				useInit( () => {
					const cb = async ( event: Event ) => {
						await splitTask();
						const result = evaluate( entry );
						if ( typeof result === 'function' ) {
							result( event );
						}
					};
					const globalVar = type === 'window' ? window : document;
					globalVar.addEventListener( eventName, cb, {
						passive: true,
					} );
					return () => globalVar.removeEventListener( eventName, cb );
				} );
			} );
	};
};

// data-wp-on--[event]---[unique-id]
directive( 'on', ( { directives: { on }, element, evaluate } ) => {
	const events = new Map< string, Set< DirectiveEntry > >();
	on.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
		const eventType = entry.suffix;
		if ( globalThis.SCRIPT_DEBUG ) {
			if ( eventType.includes( '--' ) ) {
				warnEventNameWithTwoHyphens( 'on', eventType );
			}
		}
		if ( ! events.has( eventType ) ) {
			events.set( eventType, new Set< DirectiveEntry >() );
		}
		events.get( eventType )!.add( entry );
	} );

	events.forEach( ( entries, eventType ) => {
		const existingHandler = element.props[ `on${ eventType }` ];
		element.props[ `on${ eventType }` ] = ( event: Event ) => {
			if ( existingHandler ) {
				existingHandler( event );
			}
			entries.forEach( ( entry ) => {
				let start;
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						start = performance.now();
					}
				}
				const result = evaluate( entry );
				if ( typeof result === 'function' ) {
					if ( ! result?.sync ) {
						event = wrapEventAsync( event );
					}
					result( event );
				}
				if ( globalThis.IS_GUTENBERG_PLUGIN ) {
					if ( globalThis.SCRIPT_DEBUG ) {
						performance.measure(
							`interactivity api on ${ entry.namespace }`,
							{
								start,
								end: performance.now(),
								detail: {
									devtools: {
										track: `IA: on ${ entry.namespace }`,
									},
								},
							}
						);
					}
				}
			} );
		};
	} );
} );

// data-wp-on-async--[event] (deprecated). The event name is still cut at `--`
// to keep the legacy two-hyphen unique ID syntax working until removal.
directive(
	'on-async',
	( { directives: { 'on-async': onAsync }, element, evaluate } ) => {
		if ( globalThis.SCRIPT_DEBUG ) {
			warnWithSyncEvent( 'on-async', 'on' );
		}
		const events = new Map< string, Set< DirectiveEntry > >();
		onAsync.filter( isNonDefaultDirectiveSuffix ).forEach( ( entry ) => {
			const event = entry.suffix.split( '--', 1 )[ 0 ];
			if ( ! events.has( event ) ) {
				events.set( event, new Set< DirectiveEntry >() );
			}
			events.get( event )!.add( entry );
		} );

		events.forEach( ( entries, eventType ) => {
			const existingHandler = element.props[ `on${ eventType }` ];
			element.props[ `on${ eventType }` ] = ( event: Event ) => {
				if ( existingHandler ) {
					existingHandler( event );
				}
				entries.forEach( async ( entry ) => {
					await splitTask();
					const result = evaluate( entry );
					if ( typeof result === 'function' ) {
						result( event );
					}
				} );
			};
		} );
	}
);

// Global event directives
// data-wp-on-window--[event]---[unique-id]
directive( 'on-window', getGlobalEventDirective( 'window' ) );
// data-wp-on-document--[event]---[unique-id]
directive( 'on-document', getGlobalEventDirective( 'document' ) );

// data-wp-on-async-window--[event] (deprecated)
directive( 'on-async-window', getGlobalAsyncEventDirective( 'window' ) );
// data-wp-on-async-document--[event] (deprecated)
directive( 'on-async-document', getGlobalAsyncEventDirective( 'document' ) );
